import { http, HttpResponse } from 'msw';
import { mockCustomers, mockOrders } from '../fixtures/orders';
import type { Customer, CustomerCreate, CustomerUpdate } from '@catering/shared';

let customersStore: Customer[] = [...mockCustomers];

export const customersHandlers = [
  // ── GET /api/v1/customers ───────────────────────────────────────────────────
  http.get('*/api/v1/customers', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase();
    const type = url.searchParams.get('type');
    const page = Number(url.searchParams.get('page') || '1');
    const pageSize = Number(url.searchParams.get('pageSize') || '20');

    let filtered = customersStore;
    if (type) {
      filtered = filtered.filter(c => c.type === type);
    }
    if (q) {
      filtered = filtered.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.taxId && c.taxId.includes(q))
      );
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    // Summary stats for directory header
    const stats = {
      totalCustomers: customersStore.length,
      totalRevenue: customersStore.reduce((acc, c) => acc + c.stats.totalRevenue, 0),
      openBalance: customersStore.reduce((acc, c) => acc + c.stats.openBalance, 0)
    };

    return HttpResponse.json({
      data: paginated,
      meta: { total, page, pageSize, totalPages },
      stats
    });
  }),

  // ── POST /api/v1/customers ──────────────────────────────────────────────────
  http.post('*/api/v1/customers', async ({ request }) => {
    const body = (await request.json()) as CustomerCreate;
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      version: 1,
      name: body.name,
      type: body.type,
      phone: body.phone,
      email: body.email ?? null,
      taxId: body.taxId ?? null,
      billingAddress: body.billingAddress ?? null,
      tags: body.tags ?? [],
      notes: body.notes ?? '',
      contacts: (body.contacts ?? []).map((cnt, idx) => ({
        id: `cnt-${Date.now()}-${idx}`,
        name: cnt.name,
        role: cnt.role,
        phone: cnt.phone,
        email: cnt.email ?? null
      })),
      stats: { ordersCount: 0, totalRevenue: 0, openBalance: 0 },
      createdAt: new Date().toISOString()
    };

    customersStore = [newCustomer, ...customersStore];
    return HttpResponse.json({ data: newCustomer }, { status: 201 });
  }),

  // ── GET /api/v1/customers/:id ───────────────────────────────────────────────
  http.get('*/api/v1/customers/:id', ({ params }) => {
    const { id } = params;
    const customer = customersStore.find(c => c.id === id);
    if (!customer) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'לקוח לא נמצא' } },
        { status: 404 }
      );
    }
    return HttpResponse.json({ data: customer });
  }),

  // ── PATCH /api/v1/customers/:id ─────────────────────────────────────────────
  http.patch('*/api/v1/customers/:id', async ({ params, request }) => {
    const { id } = params;
    const idx = customersStore.findIndex(c => c.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'לקוח לא נמצא' } },
        { status: 404 }
      );
    }

    const body = (await request.json()) as CustomerUpdate;
    const current = customersStore[idx]!;

    const updated: Customer = {
      ...current,
      version: current.version + 1,
      name: body.name ?? current.name,
      type: body.type ?? current.type,
      phone: body.phone ?? current.phone,
      email: body.email !== undefined ? body.email : current.email,
      taxId: body.taxId !== undefined ? body.taxId : current.taxId,
      billingAddress: body.billingAddress !== undefined ? body.billingAddress : current.billingAddress,
      tags: body.tags ?? current.tags,
      notes: body.notes !== undefined ? body.notes : current.notes,
      contacts: body.contacts
        ? body.contacts.map((cnt, i) => ({
            id: cnt.id ?? `cnt-${Date.now()}-${i}`,
            name: cnt.name,
            role: cnt.role,
            phone: cnt.phone,
            email: cnt.email ?? null
          }))
        : current.contacts
    };

    customersStore[idx] = updated;
    return HttpResponse.json({ data: updated });
  }),

  // ── GET /api/v1/customers/:id/orders ────────────────────────────────────────
  http.get('*/api/v1/customers/:id/orders', ({ params }) => {
    const { id } = params;
    const customerOrders = mockOrders.filter(o => o.customer.id === id);
    return HttpResponse.json({ data: customerOrders });
  })
];

export function resetCustomersMockStore() {
  customersStore = [...mockCustomers];
}

