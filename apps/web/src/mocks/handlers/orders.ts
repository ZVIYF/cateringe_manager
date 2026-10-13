import { http, HttpResponse } from 'msw';
import {
  mockOrders,
  mockDishes,
  mockCustomers,
  mockPublicQuote
} from '../fixtures/orders';
import { calcTotals, type Order, type OrderStatus, type DiscountType, type EventType } from '@catering/shared';

// In-memory clone for stateful test/dev workflows
let ordersStore = [...mockOrders];

export const ordersHandlers = [
  // ── GET /api/v1/orders ──────────────────────────────────────────────────────
  http.get('*/api/v1/orders', ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('view') === 'calendar') {
      return undefined; // Handled by dashboardHandlers
    }

    const statusParam = url.searchParams.get('status');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const customerId = url.searchParams.get('customerId');
    const q = url.searchParams.get('q')?.toLowerCase();
    const page = Number(url.searchParams.get('page') || '1');
    const pageSize = Number(url.searchParams.get('pageSize') || '20');

    let filtered = ordersStore;

    if (statusParam) {
      const statuses = statusParam.split(',').map(s => s.trim());
      filtered = filtered.filter(o => statuses.includes(o.status));
    }
    if (customerId) {
      filtered = filtered.filter(o => o.customer.id === customerId);
    }
    if (from) {
      filtered = filtered.filter(o => o.event.startsAt >= from);
    }
    if (to) {
      filtered = filtered.filter(o => o.event.startsAt <= to);
    }
    if (q) {
      filtered = filtered.filter(
        o =>
          String(o.number).includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          (o.event.title && o.event.title.toLowerCase().includes(q))
      );
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    const listItems = paginated.map(o => ({
      id: o.id,
      number: o.number,
      status: o.status,
      customerName: o.customer.name,
      eventStartsAt: o.event.startsAt,
      guests: o.event.guests,
      total: o.totals.total,
      paid: o.totals.paid,
      balance: o.totals.balance,
      driverName: o.number === 1045 ? 'יוסי נהג' : null,
      createdByName: o.createdBy.name
    }));

    return HttpResponse.json({
      data: listItems,
      meta: { total, page, pageSize, totalPages }
    });
  }),

  // ── POST /api/v1/orders ─────────────────────────────────────────────────────
  http.post('*/api/v1/orders', async ({ request }) => {
    const body = (await request.json()) as {
      customerId: string;
      event: {
        title?: string;
        type: string;
        startsAt: string;
        address: string;
        guests: number;
        kashrut: 'MEAT' | 'DAIRY' | 'PARVE';
        serviceType: 'DELIVERY' | 'DELIVERY_AND_SERVING' | 'PICKUP';
        notes?: string;
      };
    };

    const customer = mockCustomers.find(c => c.id === body.customerId) ?? {
      id: body.customerId,
      name: 'לקוח חדש',
      phone: '0500000000'
    };

    const nextNumber = Math.max(0, ...ordersStore.map(o => o.number)) + 1;
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      number: nextNumber,
      status: 'DRAFT',
      version: 1,
      customer: { id: customer.id, name: customer.name, phone: customer.phone },
      event: {
        id: `ev-${Date.now()}`,
        title: body.event.title ?? null,
        type: body.event.type as EventType,
        startsAt: body.event.startsAt,
        address: body.event.address,
        lat: null,
        lng: null,
        guests: body.event.guests,
        kashrut: body.event.kashrut,
        serviceType: body.event.serviceType,
        notes: body.event.notes ?? null
      },
      items: [],
      services: [],
      pricing: {
        discountType: 'NONE',
        discountValue: 0,
        vatPercent: 18,
        pricesIncludeVat: false,
        depositPercent: 30,
        paymentTerms: 'TRANSFER',
        validUntil: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0] ?? ''
      },
      totals: {
        subtotal: 0,
        discount: 0,
        vat: 0,
        total: 0,
        deposit: 0,
        paid: 0,
        balance: 0,
        perGuest: 0
      },
      allowedTransitions: ['QUOTE_SENT', 'CANCELLED'],
      isLocked: false,
      latestQuoteVersion: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: { id: 'usr-1', name: 'מנהל מערכת' }
    };

    ordersStore = [newOrder, ...ordersStore];
    return HttpResponse.json({ data: newOrder }, { status: 201 });
  }),

  // ── GET /api/v1/orders/:id ──────────────────────────────────────────────────
  http.get('*/api/v1/orders/:id', ({ params }) => {
    const { id } = params;
    const order = ordersStore.find(o => o.id === id);
    if (!order) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'ההזמנה לא נמצאה' } },
        { status: 404 }
      );
    }
    return HttpResponse.json({ data: order });
  }),

  // ── PATCH /api/v1/orders/:id ────────────────────────────────────────────────
  http.patch('*/api/v1/orders/:id', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as {
      version: number;
      event?: Partial<Order['event']>;
      pricing?: Partial<Order['pricing']>;
    };

    const orderIndex = ordersStore.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'ההזמנה לא נמצאה' } },
        { status: 404 }
      );
    }

    const order = ordersStore[orderIndex]!;
    const updatedPricing = { ...order.pricing, ...(body.pricing || {}) };
    const updatedEvent = { ...order.event, ...(body.event || {}) };

    const newTotals = calcTotals({
      lines: [
        ...order.items.map((it: { qty: number; unitPrice: number }) => ({ qty: it.qty, unitPrice: it.unitPrice })),
        ...order.services.map((s: { qty: number; unitPrice: number }) => ({ qty: s.qty, unitPrice: s.unitPrice }))
      ],
      discountType: updatedPricing.discountType as DiscountType,
      discountValue: updatedPricing.discountValue,
      vatPercent: updatedPricing.vatPercent,
      pricesIncludeVat: updatedPricing.pricesIncludeVat,
      depositPercent: updatedPricing.depositPercent,
      guests: updatedEvent.guests || 1,
      paid: order.totals.paid
    });

    const updatedOrder: Order = {
      ...order,
      event: updatedEvent,
      pricing: updatedPricing,
      totals: newTotals,
      version: order.version + 1,
      updatedAt: new Date().toISOString()
    };

    ordersStore[orderIndex] = updatedOrder;
    return HttpResponse.json({ data: updatedOrder });
  }),

  // ── PUT /api/v1/orders/:id/items ────────────────────────────────────────────
  http.put('*/api/v1/orders/:id/items', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as {
      version: number;
      items: Array<{ dishId: string; qty: number; unitPrice?: number; notes?: string }>;
    };

    const orderIndex = ordersStore.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'ההזמנה לא נמצאה' } },
        { status: 404 }
      );
    }

    const order = ordersStore[orderIndex]!;
    const formattedItems = body.items.map((it, idx) => {
      const dish = mockDishes.find(d => d.id === it.dishId);
      const unitPrice = it.unitPrice ?? (dish ? dish.price : 3000);
      return {
        id: `cli-${Date.now()}-${idx}`,
        dishId: it.dishId,
        dishName: dish ? dish.name : 'מנה',
        category: dish ? dish.category : ('MAIN' as const),
        unit: dish ? dish.unit : ('PORTION' as const),
        qty: it.qty,
        unitPrice,
        priceOverridden: it.unitPrice !== undefined,
        lineTotal: Math.round(it.qty * unitPrice),
        notes: it.notes ?? null
      };
    });

    const newTotals = calcTotals({
      lines: [
        ...formattedItems.map((it: { qty: number; unitPrice: number }) => ({ qty: it.qty, unitPrice: it.unitPrice })),
        ...order.services.map((s: { qty: number; unitPrice: number }) => ({ qty: s.qty, unitPrice: s.unitPrice }))
      ],
      discountType: order.pricing.discountType as DiscountType,
      discountValue: order.pricing.discountValue,
      vatPercent: order.pricing.vatPercent,
      pricesIncludeVat: order.pricing.pricesIncludeVat,
      depositPercent: order.pricing.depositPercent,
      guests: order.event.guests,
      paid: order.totals.paid
    });

    const updatedOrder: Order = {
      ...order,
      items: formattedItems,
      totals: newTotals,
      version: order.version + 1,
      updatedAt: new Date().toISOString()
    };

    ordersStore[orderIndex] = updatedOrder;
    return HttpResponse.json({ data: updatedOrder });
  }),

  // ── PUT /api/v1/orders/:id/services ─────────────────────────────────────────
  http.put('*/api/v1/orders/:id/services', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as {
      version: number;
      services: Array<{ serviceId: string; qty: number; unitPrice?: number; name?: string }>;
    };

    const orderIndex = ordersStore.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'ההזמנה לא נמצאה' } },
        { status: 404 }
      );
    }

    const order = ordersStore[orderIndex]!;
    const formattedServices = body.services.map((s, idx) => ({
      id: `srv-${Date.now()}-${idx}`,
      serviceId: s.serviceId,
      name: s.name ?? 'שירות נוסף',
      qty: s.qty,
      unitPrice: s.unitPrice ?? 25000,
      lineTotal: Math.round(s.qty * (s.unitPrice ?? 25000))
    }));

    const newTotals = calcTotals({
      lines: [
        ...order.items.map((it: { qty: number; unitPrice: number }) => ({ qty: it.qty, unitPrice: it.unitPrice })),
        ...formattedServices.map((s: { qty: number; unitPrice: number }) => ({ qty: s.qty, unitPrice: s.unitPrice }))
      ],
      discountType: order.pricing.discountType as DiscountType,
      discountValue: order.pricing.discountValue,
      vatPercent: order.pricing.vatPercent,
      pricesIncludeVat: order.pricing.pricesIncludeVat,
      depositPercent: order.pricing.depositPercent,
      guests: order.event.guests,
      paid: order.totals.paid
    });

    const updatedOrder: Order = {
      ...order,
      services: formattedServices,
      totals: newTotals,
      version: order.version + 1,
      updatedAt: new Date().toISOString()
    };

    ordersStore[orderIndex] = updatedOrder;
    return HttpResponse.json({ data: updatedOrder });
  }),

  // ── POST /api/v1/orders/:id/transition ──────────────────────────────────────
  http.post('*/api/v1/orders/:id/transition', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as { to: OrderStatus; reason?: string };

    const orderIndex = ordersStore.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'ההזמנה לא נמצאה' } },
        { status: 404 }
      );
    }

    const order = ordersStore[orderIndex]!;
    let nextTransitions: OrderStatus[] = [];
    if (body.to === 'QUOTE_SENT') nextTransitions = ['CONFIRMED', 'LOST', 'CANCELLED'];
    else if (body.to === 'CONFIRMED') nextTransitions = ['IN_PRODUCTION', 'CANCELLED'];
    else if (body.to === 'IN_PRODUCTION') nextTransitions = ['READY', 'CANCELLED'];
    else if (body.to === 'READY') nextTransitions = ['OUT_FOR_DELIVERY', 'DELIVERED', 'CLOSED'];
    else if (body.to === 'OUT_FOR_DELIVERY') nextTransitions = ['DELIVERED'];
    else if (body.to === 'DELIVERED') nextTransitions = ['CLOSED'];
    else nextTransitions = [];

    const updatedOrder: Order = {
      ...order,
      status: body.to,
      allowedTransitions: nextTransitions,
      updatedAt: new Date().toISOString()
    };

    ordersStore[orderIndex] = updatedOrder;
    return HttpResponse.json({ data: updatedOrder });
  }),

  // ── POST /api/v1/orders/:id/duplicate ───────────────────────────────────────
  http.post('*/api/v1/orders/:id/duplicate', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as { startsAt: string };
    const order = ordersStore.find(o => o.id === id);
    if (!order) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'ההזמנה לא נמצאה' } },
        { status: 404 }
      );
    }

    const nextNumber = Math.max(0, ...ordersStore.map(o => o.number)) + 1;
    const duplicated: Order = {
      ...order,
      id: `order-${Date.now()}`,
      number: nextNumber,
      status: 'DRAFT',
      version: 1,
      event: { ...order.event, id: `ev-${Date.now()}`, startsAt: body.startsAt },
      totals: { ...order.totals, paid: 0, balance: order.totals.total },
      allowedTransitions: ['QUOTE_SENT', 'CANCELLED'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    ordersStore = [duplicated, ...ordersStore];
    return HttpResponse.json({ data: duplicated }, { status: 201 });
  }),

  // ── POST /api/v1/orders/:id/quote/preview ───────────────────────────────────
  http.post('*/api/v1/orders/:id/quote/preview', () => {
    return HttpResponse.json({
      data: { pdfUrl: 'https://example.com/mock-quote-preview.pdf' }
    });
  }),

  // ── POST /api/v1/orders/:id/quote/send ──────────────────────────────────────
  http.post('*/api/v1/orders/:id/quote/send', async ({ params }) => {
    const { id } = params;
    const orderIndex = ordersStore.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'ההזמנה לא נמצאה' } },
        { status: 404 }
      );
    }

    const order = ordersStore[orderIndex]!;
    const updatedOrder: Order = {
      ...order,
      status: order.status === 'DRAFT' ? 'QUOTE_SENT' : order.status,
      latestQuoteVersion: (order.latestQuoteVersion ?? 0) + 1,
      allowedTransitions: ['CONFIRMED', 'LOST', 'CANCELLED']
    };
    ordersStore[orderIndex] = updatedOrder;

    return HttpResponse.json({
      data: {
        order: updatedOrder,
        quoteVersion: updatedOrder.latestQuoteVersion ?? 1,
        publicUrl: `${window.location.origin}/p/quote-tok-12345`
      }
    });
  }),

  // ── GET /api/v1/dishes ──────────────────────────────────────────────────────
  http.get('*/api/v1/dishes', ({ request }) => {
    const url = new URL(request.url);
    const kashrut = url.searchParams.get('kashrut');
    const category = url.searchParams.get('category');
    const q = url.searchParams.get('q')?.toLowerCase();

    let list = mockDishes;
    if (kashrut) list = list.filter(d => d.kashrut === kashrut || d.kashrut === 'PARVE');
    if (category) list = list.filter(d => d.category === category);
    if (q) list = list.filter(d => d.name.toLowerCase().includes(q));

    return HttpResponse.json({ data: list });
  }),

  // ── GET /api/v1/customers ───────────────────────────────────────────────────
  http.get('*/api/v1/customers', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase();

    let list = mockCustomers;
    if (q) {
      list = list.filter(
        c => c.name.toLowerCase().includes(q) || c.phone.includes(q)
      );
    }

    return HttpResponse.json({ data: list });
  }),

  // ── GET /api/v1/public/quotes/:token ────────────────────────────────────────
  http.get('*/api/v1/public/quotes/:token', ({ params }) => {
    const { token } = params;
    if (token === 'not-found') {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'הצעת המחיר לא נמצאה או פגה תוקפה' } },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      data: { ...mockPublicQuote, token: String(token) }
    });
  }),

  // ── POST /api/v1/public/quotes/:token/approve ───────────────────────────────
  http.post('*/api/v1/public/quotes/:token/approve', async () => {
    return HttpResponse.json({
      data: {
        paymentUrl: 'https://mock-gateway.example.com/checkout?token=mock-pay-123'
      }
    });
  }),

  // ── POST /api/v1/public/quotes/:token/request-change ────────────────────────
  http.post('*/api/v1/public/quotes/:token/request-change', async () => {
    return new HttpResponse(null, { status: 204 });
  })
];

export function resetOrdersMockStore() {
  ordersStore = [...mockOrders];
}
