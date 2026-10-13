import { http, HttpResponse } from 'msw';
import { mockPayments, mockOpenBalances } from '../fixtures/payments';
import type {
  PaymentListItem,
  CreatePaymentBody,
  CreatePaymentLinkBody,
  OpenBalanceItem,
  RefundPaymentBody
} from '@catering/shared';

let paymentsStore: PaymentListItem[] = [...mockPayments];
let openBalancesStore: OpenBalanceItem[] = [...mockOpenBalances];

export const paymentsHandlers = [
  // ── GET /api/v1/payments ────────────────────────────────────────────────────
  http.get('*/api/v1/payments', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const method = url.searchParams.get('method');
    const q = url.searchParams.get('q')?.toLowerCase();
    const page = Number(url.searchParams.get('page') || '1');
    const pageSize = Number(url.searchParams.get('pageSize') || '20');

    let filtered = paymentsStore;
    if (status) {
      filtered = filtered.filter(p => p.status === status);
    }
    if (method) {
      filtered = filtered.filter(p => p.method === method);
    }
    if (q) {
      filtered = filtered.filter(
        p =>
          (p.customerName && p.customerName.toLowerCase().includes(q)) ||
          (p.orderNumber && String(p.orderNumber).includes(q)) ||
          (p.reference && p.reference.toLowerCase().includes(q))
      );
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    const stats = {
      totalCollected: paymentsStore
        .filter(p => p.status === 'SUCCEEDED')
        .reduce((sum, p) => sum + p.amount, 0),
      openBalancesTotal: openBalancesStore.reduce((sum, b) => sum + b.balance, 0),
      overdueCount: openBalancesStore.filter(b => b.daysOverdue > 0).length
    };

    return HttpResponse.json({
      data: paginated,
      meta: { total, page, pageSize, totalPages },
      stats
    });
  }),

  // ── POST /api/v1/payments ───────────────────────────────────────────────────
  http.post('*/api/v1/payments', async ({ request }) => {
    const body = (await request.json()) as CreatePaymentBody;
    const targetBalance = openBalancesStore.find(b => b.orderId === body.orderId);

    const newPayment: PaymentListItem = {
      id: `pay-${Date.now()}`,
      orderId: body.orderId,
      orderNumber: targetBalance?.orderNumber ?? 1099,
      customerName: targetBalance?.customerName ?? 'לקוח',
      amount: body.amount,
      method: body.method,
      status: 'SUCCEEDED',
      reference: body.reference ?? null,
      receiptUrl: `https://example.com/receipts/rec-${Date.now()}.pdf`,
      createdAt: new Date().toISOString()
    };

    paymentsStore = [newPayment, ...paymentsStore];

    // Update open balance
    if (targetBalance) {
      targetBalance.paid += body.amount;
      targetBalance.balance = Math.max(0, targetBalance.total - targetBalance.paid);
    }

    return HttpResponse.json({ data: newPayment }, { status: 201 });
  }),

  // ── POST /api/v1/payments/link ──────────────────────────────────────────────
  http.post('*/api/v1/payments/link', async ({ request }) => {
    const body = (await request.json()) as CreatePaymentLinkBody;
    return HttpResponse.json({
      data: {
        paymentUrl: `https://pay.example.com/checkout?order=${body.orderId}&amount=${body.amount}`,
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
      }
    });
  }),

  // ── GET /api/v1/payments/open-balances ──────────────────────────────────────
  http.get('*/api/v1/payments/open-balances', () => {
    return HttpResponse.json({ data: openBalancesStore });
  }),

  // ── POST /api/v1/payments/:id/refund ────────────────────────────────────────
  http.post('*/api/v1/payments/:id/refund', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as RefundPaymentBody;
    const payment = paymentsStore.find(p => p.id === id);
    if (!payment) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'תשלום לא נמצא' } },
        { status: 404 }
      );
    }

    payment.status = 'REFUNDED';
    return HttpResponse.json({ data: { ...payment, refundedAmount: body.amount } });
  })
];

export function resetPaymentsMockStore() {
  paymentsStore = [...mockPayments];
  openBalancesStore = [...mockOpenBalances];
}
