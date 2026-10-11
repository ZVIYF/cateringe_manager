import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { PublicQuoteSchemas } from '@catering/shared';
import { notFound } from '../../lib/errors';
import type { Prisma, PaymentMethod, PaymentStatus } from '@prisma/client';

function formatPaymentItem(p: {
  id: string;
  orderId: string;
  amount: number;
  method: unknown;
  status: unknown;
  reference: string | null;
  receiptUrl: string | null;
  createdAt: Date;
}, order?: { number: number; customer?: unknown } | null) {
  const customer = order?.customer as { name?: string } | undefined;
  return PublicQuoteSchemas.PaymentListItem.parse({
    id: p.id,
    orderId: p.orderId,
    orderNumber: order?.number,
    customerName: customer?.name,
    amount: p.amount,
    method: p.method,
    status: p.status,
    reference: p.reference ?? null,
    receiptUrl: p.receiptUrl ?? null,
    createdAt: p.createdAt.toISOString(),
  });
}

/**
 * GET /payments
 * List payments with filters (orderId, status, method).
 */
export async function getPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as {
      orderId?: string;
      status?: PaymentStatus;
      method?: PaymentMethod;
      page?: string;
      pageSize?: string;
    };
    const page = query.page ? parseInt(query.page, 10) : 1;
    const pageSize = query.pageSize ? parseInt(query.pageSize, 10) : 25;

    const where: Record<string, unknown> = {};
    if (query.orderId) where['orderId'] = query.orderId;
    if (query.status) where['status'] = query.status;
    if (query.method) where['method'] = query.method;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    // Fetch related order numbers
    const orderIds = [...new Set(payments.map(p => p.orderId))];
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, number: true, customer: true },
    });
    const orderMap = new Map(orders.map(o => [o.id, o]));

    const data = payments.map(p => formatPaymentItem(p, orderMap.get(p.orderId)));

    res.json({
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /payments
 * Record a payment against an order.
 */
export async function createPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as PublicQuoteSchemas.CreatePaymentBody;

    const order = await prisma.order.findUnique({
      where: { id: body.orderId },
    });

    if (!order) {
      return next(notFound('הזמנה לא נמצאה'));
    }

    const receiptUrl = `/receipts/rcpt-${Date.now()}.pdf`;

    const payment = await prisma.payment.create({
      data: {
        orderId: body.orderId,
        amount: body.amount,
        method: body.method,
        status: 'SUCCEEDED',
        reference: body.reference ?? null,
        receiptUrl,
      },
    });

    // Update order paid and balance totals
    const currentTotals = order.totals as {
      total: number;
      paid: number;
      balance: number;
      [key: string]: unknown;
    };
    const updatedPaid = (currentTotals?.paid ?? 0) + body.amount;
    const updatedBalance = (currentTotals?.total ?? 0) - updatedPaid;

    await prisma.order.update({
      where: { id: order.id },
      data: {
        totals: {
          ...currentTotals,
          paid: updatedPaid,
          balance: updatedBalance,
        } as unknown as Prisma.InputJsonObject,
      },
    });

    res.status(201).json({
      data: formatPaymentItem(payment, order),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /payments/link
 * Generate a payment checkout link.
 */
export async function createPaymentLink(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as PublicQuoteSchemas.CreatePaymentLinkBody;

    const order = await prisma.order.findUnique({
      where: { id: body.orderId },
    });

    if (!order) {
      return next(notFound('הזמנה לא נמצאה'));
    }

    const webOrigin = process.env['WEB_ORIGIN'] ?? 'http://localhost:5173';
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const paymentUrl = `${webOrigin}/pay?orderId=${body.orderId}&amount=${body.amount}`;

    res.json({
      paymentUrl,
      expiresAt,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /payments/open-balances
 * List delivered orders that have an open balance, including days overdue.
 */
export async function getOpenBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const now = Date.now();
    const openBalances: PublicQuoteSchemas.OpenBalanceItem[] = [];

    for (const o of orders) {
      const totals = o.totals as { total?: number; paid?: number; balance?: number };
      const balance = totals?.balance ?? 0;

      // Only orders with remaining balance
      if (balance > 0) {
        const customer = o.customer as { name?: string; phone?: string };
        const event = o.event as { startsAt?: string };
        const eventDate = event?.startsAt ? new Date(event.startsAt).getTime() : o.createdAt.getTime();

        const daysOverdue = eventDate < now
          ? Math.max(0, Math.floor((now - eventDate) / (1000 * 60 * 60 * 24)))
          : 0;

        openBalances.push(
          PublicQuoteSchemas.OpenBalanceItem.parse({
            orderId: o.id,
            orderNumber: o.number,
            customerName: customer?.name ?? '',
            customerPhone: customer?.phone ?? '',
            total: totals?.total ?? 0,
            paid: totals?.paid ?? 0,
            balance,
            daysOverdue,
          })
        );
      }
    }

    res.json({
      data: openBalances,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /payments/:id/refund
 * Refund a payment (ADMIN only).
 */
export async function refundPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const body = req.body as PublicQuoteSchemas.RefundPaymentBody;

    const payment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      return next(notFound('תשלום לא נמצא'));
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        status: 'REFUNDED',
        reference: payment.reference ? `${payment.reference} (זיכוי: ${body.reason})` : `זיכוי: ${body.reason}`,
      },
    });

    // Adjust order totals
    const order = await prisma.order.findUnique({
      where: { id: payment.orderId },
    });

    if (order) {
      const currentTotals = order.totals as {
        total: number;
        paid: number;
        balance: number;
        [key: string]: unknown;
      };
      const updatedPaid = Math.max(0, (currentTotals?.paid ?? 0) - body.amount);
      const updatedBalance = (currentTotals?.total ?? 0) - updatedPaid;

      await prisma.order.update({
        where: { id: order.id },
        data: {
          totals: {
            ...currentTotals,
            paid: updatedPaid,
            balance: updatedBalance,
          } as unknown as Prisma.InputJsonObject,
        },
      });
    }

    res.json({
      data: formatPaymentItem(updated, order),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /invoices
 * Invoices and receipts for orders.
 */
export async function getInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { orderId } = req.query as { orderId?: string };

    const where: Record<string, unknown> = {};
    if (orderId) where['orderId'] = orderId;

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const invoices = payments.map(p => ({
      id: `inv-${p.id}`,
      orderId: p.orderId,
      amount: p.amount,
      method: p.method,
      receiptUrl: p.receiptUrl,
      createdAt: p.createdAt.toISOString(),
    }));

    res.json({
      data: invoices,
    });
  } catch (err) {
    next(err);
  }
}
