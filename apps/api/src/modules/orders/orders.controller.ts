import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { OrderSchemas, calcTotals, type OrderStatus, type DiscountType } from '@catering/shared';
import { notFound, versionConflict } from '../../lib/errors';
import type { Prisma } from '@prisma/client';

function formatOrder(raw: {
  id: string;
  number: number;
  status: unknown;
  version: number;
  customer: unknown;
  event: unknown;
  items: unknown;
  services: unknown;
  pricing: unknown;
  totals: unknown;
  allowedTransitions: unknown;
  isLocked: boolean;
  latestQuoteVersion: number | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: unknown;
}) {
  return OrderSchemas.Order.parse({
    id: raw.id,
    number: raw.number,
    status: raw.status,
    version: raw.version,
    customer: raw.customer,
    event: raw.event,
    items: Array.isArray(raw.items) ? raw.items : [],
    services: Array.isArray(raw.services) ? raw.services : [],
    pricing: raw.pricing,
    totals: raw.totals,
    allowedTransitions: Array.isArray(raw.allowedTransitions) ? raw.allowedTransitions : [],
    isLocked: raw.isLocked,
    latestQuoteVersion: raw.latestQuoteVersion ?? null,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
    createdBy: raw.createdBy,
  });
}

function formatOrderListItem(raw: {
  id: string;
  number: number;
  status: unknown;
  customer: unknown;
  event: unknown;
  totals: unknown;
  createdBy: unknown;
}) {
  const customer = raw.customer as { name?: string };
  const event = raw.event as { startsAt?: string; guests?: number };
  const totals = raw.totals as { total?: number; paid?: number; balance?: number };
  const createdBy = raw.createdBy as { name?: string };

  return OrderSchemas.OrderListItem.parse({
    id: raw.id,
    number: raw.number,
    status: raw.status,
    customerName: customer?.name ?? '',
    eventStartsAt: event?.startsAt ?? new Date().toISOString(),
    guests: event?.guests ?? 1,
    total: totals?.total ?? 0,
    paid: totals?.paid ?? 0,
    balance: totals?.balance ?? 0,
    driverName: null,
    createdByName: createdBy?.name ?? '',
  });
}

/**
 * GET /orders
 * List orders with filters and pagination.
 */
export async function getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as {
      page?: number;
      pageSize?: number;
      status?: OrderStatus[];
      customerId?: string;
    };
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const { status, customerId } = query;

    const where: Record<string, unknown> = {};

    if (status && status.length > 0) {
      where['status'] = { in: status };
    }
    if (customerId) {
      where['customerId'] = customerId;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    const data = orders.map(o => formatOrderListItem(o));

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
 * POST /orders
 * Create an order in DRAFT status.
 */
export async function createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as OrderSchemas.OrderCreate;
    const user = req.user ?? { sub: 'unknown', name: 'מערכת' };

    // Default pricing structure
    const defaultPricing = {
      discountType: 'NONE' as const,
      discountValue: 0,
      vatPercent: 18,
      pricesIncludeVat: false,
      depositPercent: 30,
      paymentTerms: 'CREDIT_CARD' as const,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    const initialTotals = calcTotals({
      lines: [],
      discountType: 'NONE',
      discountValue: 0,
      vatPercent: 18,
      pricesIncludeVat: false,
      depositPercent: 30,
      guests: body.event.guests,
      paid: 0,
    });

    const eventWithId = {
      ...body.event,
      id: `cle-${Date.now()}`,
      title: body.event.title ?? null,
      lat: body.event.lat ?? null,
      lng: body.event.lng ?? null,
      notes: body.event.notes ?? null,
    };

    const created = await prisma.order.create({
      data: {
        status: 'DRAFT',
        version: 1,
        customerId: body.customerId,
        customer: {
          id: body.customerId,
          name: 'לקוח',
          phone: '0500000000',
        },
        event: eventWithId,
        items: [],
        services: [],
        pricing: defaultPricing,
        totals: initialTotals as unknown as Prisma.InputJsonObject,
        allowedTransitions: ['QUOTE_SENT', 'CANCELLED'] as OrderStatus[],
        isLocked: false,
        latestQuoteVersion: null,
        createdById: user.sub,
        createdBy: { id: user.sub, name: user.name },
      },
    });

    res.status(201).json({
      data: formatOrder(created),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /orders/:id
 * Retrieve order details.
 */
export async function getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return next(notFound('הזמנה לא נמצאה'));
    }

    res.json({
      data: formatOrder(order),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /orders/:id
 * Update order event details or pricing.
 */
export async function updateOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const body = req.body as OrderSchemas.OrderUpdate;

    const existing = await prisma.order.findUnique({
      where: { id },
    });

    if (!existing) {
      return next(notFound('הזמנה לא נמצאה'));
    }

    if (existing.version !== body.version) {
      return next(versionConflict('ההזמנה עודכנה על ידי משתמש אחר'));
    }

    const currentEvent = existing.event as Record<string, unknown>;
    const currentPricing = existing.pricing as Record<string, unknown>;
    const items = (existing.items as { qty: number; unitPrice: number }[]) || [];

    const updatedEvent = body.event ? { ...currentEvent, ...body.event } : currentEvent;
    const updatedPricing = body.pricing ? { ...currentPricing, ...body.pricing } : currentPricing;

    const newTotals = calcTotals({
      lines: items.map(it => ({ qty: it.qty, unitPrice: it.unitPrice })),
      discountType: (updatedPricing['discountType'] as DiscountType) ?? 'NONE',
      discountValue: (updatedPricing['discountValue'] as number) ?? 0,
      vatPercent: (updatedPricing['vatPercent'] as number) ?? 18,
      pricesIncludeVat: Boolean(updatedPricing['pricesIncludeVat']),
      depositPercent: (updatedPricing['depositPercent'] as number) ?? 30,
      guests: (updatedEvent['guests'] as number) ?? 1,
      paid: (existing.totals as { paid?: number })?.paid ?? 0,
    });

    const updated = await prisma.order.update({
      where: { id },
      data: {
        event: updatedEvent as unknown as Prisma.InputJsonObject,
        pricing: updatedPricing as unknown as Prisma.InputJsonObject,
        totals: newTotals as unknown as Prisma.InputJsonObject,
        version: existing.version + 1,
      },
    });

    res.json({
      data: formatOrder(updated),
    });
  } catch (err) {
    next(err);
  }
}

interface ItemInput {
  dishId: string;
  qty: number;
  unitPrice?: number;
  notes?: string;
}

/**
 * PUT /orders/:id/items
 * Replace the items list and recalculate totals.
 */
export async function updateOrderItems(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const body = req.body as { version: number; items: ItemInput[]; overrideReason?: string };

    const existing = await prisma.order.findUnique({
      where: { id },
    });

    if (!existing) {
      return next(notFound('הזמנה לא נמצאה'));
    }

    if (existing.version !== body.version) {
      return next(versionConflict('ההזמנה עודכנה על ידי משתמש אחר'));
    }

    // Build items with lineTotals
    const formattedItems = body.items.map((it: ItemInput, idx: number) => {
      const unitPrice = it.unitPrice ?? 3000;
      return {
        id: `cli-${Date.now()}-${idx}`,
        dishId: it.dishId,
        dishName: 'מנה',
        category: 'MAIN',
        unit: 'PORTION',
        qty: it.qty,
        unitPrice,
        priceOverridden: it.unitPrice !== undefined,
        lineTotal: Math.round(it.qty * unitPrice),
        notes: it.notes ?? null,
      };
    });

    const currentPricing = existing.pricing as Record<string, unknown>;
    const currentEvent = existing.event as Record<string, unknown>;

    const newTotals = calcTotals({
      lines: formattedItems.map(it => ({ qty: it.qty, unitPrice: it.unitPrice })),
      discountType: (currentPricing['discountType'] as DiscountType) ?? 'NONE',
      discountValue: (currentPricing['discountValue'] as number) ?? 0,
      vatPercent: (currentPricing['vatPercent'] as number) ?? 18,
      pricesIncludeVat: Boolean(currentPricing['pricesIncludeVat']),
      depositPercent: (currentPricing['depositPercent'] as number) ?? 30,
      guests: (currentEvent['guests'] as number) ?? 1,
      paid: (existing.totals as { paid?: number })?.paid ?? 0,
    });

    const updated = await prisma.order.update({
      where: { id },
      data: {
        items: formattedItems,
        totals: newTotals as unknown as Prisma.InputJsonObject,
        version: existing.version + 1,
      },
    });

    res.json({
      data: formatOrder(updated),
    });
  } catch (err) {
    next(err);
  }
}
