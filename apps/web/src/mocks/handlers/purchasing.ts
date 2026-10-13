import { http, HttpResponse } from 'msw';
import { mockSuppliers, mockPurchaseOrders } from '../fixtures/purchasing';
import { mockForecastItems } from '../fixtures/inventory';
import type {
  Supplier,
  SupplierCreate,
  SupplierUpdate,
  PurchaseOrder,
  CreatePurchaseOrderBody,
  ReceivePurchaseOrderBody,
  SendPurchaseOrderBody
} from '@catering/shared';

let suppliersStore: Supplier[] = [...mockSuppliers];
let purchaseOrdersStore: PurchaseOrder[] = [...mockPurchaseOrders];

export const purchasingHandlers = [
  // ── GET /api/v1/suppliers ──────────────────────────────────────────────────
  http.get('*/api/v1/suppliers', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase();

    let list = suppliersStore;
    if (q) {
      list = list.filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          (s.contactName && s.contactName.toLowerCase().includes(q)) ||
          s.phone.includes(q) ||
          s.categories.some(c => c.toLowerCase().includes(q))
      );
    }
    return HttpResponse.json({ data: list });
  }),

  // ── POST /api/v1/suppliers ─────────────────────────────────────────────────
  http.post('*/api/v1/suppliers', async ({ request }) => {
    const body = (await request.json()) as SupplierCreate;
    const newSupplier: Supplier = {
      id: `sup-${Date.now()}`,
      name: body.name,
      contactName: body.contactName ?? null,
      phone: body.phone,
      email: body.email ?? null,
      categories: body.categories ?? [],
      leadTimeDays: body.leadTimeDays ?? 1,
      notes: body.notes ?? null,
      createdAt: new Date().toISOString()
    };

    suppliersStore = [newSupplier, ...suppliersStore];
    return HttpResponse.json({ data: newSupplier }, { status: 201 });
  }),

  // ── GET /api/v1/suppliers/:id ──────────────────────────────────────────────
  http.get('*/api/v1/suppliers/:id', ({ params }) => {
    const { id } = params;
    const s = suppliersStore.find(sup => sup.id === id);
    if (!s) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'ספק לא נמצא' } },
        { status: 404 }
      );
    }
    return HttpResponse.json({ data: s });
  }),

  // ── PATCH /api/v1/suppliers/:id ────────────────────────────────────────────
  http.patch('*/api/v1/suppliers/:id', async ({ params, request }) => {
    const { id } = params;
    const idx = suppliersStore.findIndex(s => s.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'ספק לא נמצא' } },
        { status: 404 }
      );
    }

    const body = (await request.json()) as SupplierUpdate;
    suppliersStore[idx] = {
      ...suppliersStore[idx],
      ...body
    };

    return HttpResponse.json({ data: suppliersStore[idx] });
  }),

  // ── GET /api/v1/purchase-orders ────────────────────────────────────────────
  http.get('*/api/v1/purchase-orders', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const supplierId = url.searchParams.get('supplierId');
    const page = Number(url.searchParams.get('page') || '1');
    const pageSize = Number(url.searchParams.get('pageSize') || '20');

    let filtered = purchaseOrdersStore;
    if (status) {
      filtered = filtered.filter(po => po.status === status);
    }
    if (supplierId) {
      filtered = filtered.filter(po => po.supplierId === supplierId);
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    return HttpResponse.json({
      data: paginated,
      meta: { total, page, pageSize, totalPages }
    });
  }),

  // ── POST /api/v1/purchase-orders ───────────────────────────────────────────
  http.post('*/api/v1/purchase-orders', async ({ request }) => {
    const body = (await request.json()) as CreatePurchaseOrderBody;
    const sup = suppliersStore.find(s => s.id === body.supplierId);

    const lines = body.lines.map((l, idx) => ({
      id: `pol-${Date.now()}-${idx}`,
      ingredientId: l.ingredientId,
      ingredientName: 'חומר גלם',
      unit: 'יח',
      qty: l.qty,
      receivedQty: 0,
      unitPrice: l.unitPrice ?? 1000,
      lineTotal: Math.round(l.qty * (l.unitPrice ?? 1000))
    }));

    const total = lines.reduce((acc, l) => acc + l.lineTotal, 0);

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      number: 5000 + purchaseOrdersStore.length + 1,
      supplierId: body.supplierId,
      supplierName: sup?.name ?? 'ספק',
      status: 'DRAFT',
      lines,
      total,
      expectedDeliveryDate: body.expectedDeliveryDate ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    purchaseOrdersStore = [newPO, ...purchaseOrdersStore];
    return HttpResponse.json({ data: newPO }, { status: 201 });
  }),

  // ── POST /api/v1/purchase-orders/from-shortages ────────────────────────────
  http.post('*/api/v1/purchase-orders/from-shortages', () => {
    // Generate POs for items with shortages grouped by supplier
    const shortagesWithSupplier = mockForecastItems.filter(
      f => f.shortage > 0 && f.supplier
    );

    const createdPOs: PurchaseOrder[] = [];
    const supplierGroups = new Map<string, typeof shortagesWithSupplier>();

    for (const item of shortagesWithSupplier) {
      const supId = item.supplier!.id;
      if (!supplierGroups.has(supId)) {
        supplierGroups.set(supId, []);
      }
      supplierGroups.get(supId)!.push(item);
    }

    supplierGroups.forEach((items, supId) => {
      const sup = suppliersStore.find(s => s.id === supId);
      const lines = items.map((it, idx) => ({
        id: `pol-auto-${Date.now()}-${idx}`,
        ingredientId: it.ingredientId,
        ingredientName: it.name,
        unit: it.unit,
        qty: it.shortage,
        receivedQty: 0,
        unitPrice: 3000,
        lineTotal: Math.round(it.shortage * 3000)
      }));

      const total = lines.reduce((acc, l) => acc + l.lineTotal, 0);
      const po: PurchaseOrder = {
        id: `po-${Date.now()}-${supId}`,
        number: 5000 + purchaseOrdersStore.length + createdPOs.length + 1,
        supplierId: supId,
        supplierName: sup?.name ?? items[0].supplier!.name,
        status: 'DRAFT',
        lines,
        total,
        expectedDeliveryDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      createdPOs.push(po);
    });

    purchaseOrdersStore = [...createdPOs, ...purchaseOrdersStore];
    return HttpResponse.json({ data: createdPOs }, { status: 201 });
  }),

  // ── GET /api/v1/purchase-orders/:id ────────────────────────────────────────
  http.get('*/api/v1/purchase-orders/:id', ({ params }) => {
    const { id } = params;
    const po = purchaseOrdersStore.find(p => p.id === id);
    if (!po) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'הזמנת רכש לא נמצאה' } },
        { status: 404 }
      );
    }
    return HttpResponse.json({ data: po });
  }),

  // ── POST /api/v1/purchase-orders/:id/send ──────────────────────────────────
  http.post('*/api/v1/purchase-orders/:id/send', async ({ params, request }) => {
    const { id } = params;
    const idx = purchaseOrdersStore.findIndex(p => p.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'הזמנת רכש לא נמצאה' } },
        { status: 404 }
      );
    }

    const body = (await request.json()) as SendPurchaseOrderBody;
    purchaseOrdersStore[idx] = {
      ...purchaseOrdersStore[idx],
      status: 'SENT',
      sentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return HttpResponse.json({
      data: {
        ...purchaseOrdersStore[idx],
        sentVia: body.channel ?? 'EMAIL'
      }
    });
  }),

  // ── POST /api/v1/purchase-orders/:id/receive ───────────────────────────────
  http.post('*/api/v1/purchase-orders/:id/receive', async ({ params, request }) => {
    const { id } = params;
    const idx = purchaseOrdersStore.findIndex(p => p.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'הזמנת רכש לא נמצאה' } },
        { status: 404 }
      );
    }

    const body = (await request.json()) as ReceivePurchaseOrderBody;
    const po = purchaseOrdersStore[idx];

    // Reconcile lines
    const updatedLines = po.lines.map(line => {
      const rec = body.lines.find(l => l.lineId === line.id);
      if (rec) {
        return {
          ...line,
          receivedQty: rec.receivedQty,
          unitPrice: rec.price ?? line.unitPrice,
          lineTotal: Math.round(rec.receivedQty * (rec.price ?? line.unitPrice))
        };
      }
      return line;
    });

    const isFullyReceived = updatedLines.every(l => l.receivedQty >= l.qty);
    const newStatus = isFullyReceived ? 'RECEIVED' : 'PARTIAL';

    purchaseOrdersStore[idx] = {
      ...po,
      lines: updatedLines,
      status: newStatus,
      receivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return HttpResponse.json({ data: purchaseOrdersStore[idx] });
  })
];

export function resetPurchasingMockStore() {
  suppliersStore = [...mockSuppliers];
  purchaseOrdersStore = [...mockPurchaseOrders];
}
