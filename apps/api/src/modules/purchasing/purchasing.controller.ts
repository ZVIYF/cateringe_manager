import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { InventoryKitchenSchemas } from '@catering/shared';
import { notFound } from '../../lib/errors';
import type { Prisma, PurchaseOrderStatus } from '@prisma/client';

function formatSupplier(raw: {
  id: string;
  name: string;
  contactName: string | null;
  phone: string;
  email: string | null;
  categories: string[];
  leadTimeDays: number;
  notes: string | null;
  createdAt: Date;
}) {
  return InventoryKitchenSchemas.Supplier.parse({
    id: raw.id,
    name: raw.name,
    contactName: raw.contactName ?? undefined,
    phone: raw.phone,
    email: raw.email ?? undefined,
    categories: raw.categories,
    leadTimeDays: raw.leadTimeDays,
    notes: raw.notes ?? undefined,
    createdAt: raw.createdAt.toISOString(),
  });
}

function formatPurchaseOrder(raw: {
  id: string;
  number: number;
  supplierId: string;
  supplierName: string;
  status: unknown;
  lines: Array<{
    id: string;
    ingredientId: string;
    ingredientName: string;
    unit: string;
    qty: number;
    receivedQty: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  total: number;
  expectedDeliveryDate: string | null;
  sentAt: Date | null;
  receivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return InventoryKitchenSchemas.PurchaseOrder.parse({
    id: raw.id,
    number: raw.number,
    supplierId: raw.supplierId,
    supplierName: raw.supplierName,
    status: raw.status,
    lines: raw.lines.map(l => ({
      id: l.id,
      ingredientId: l.ingredientId,
      ingredientName: l.ingredientName,
      unit: l.unit,
      qty: l.qty,
      receivedQty: l.receivedQty,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
    })),
    total: raw.total,
    expectedDeliveryDate: raw.expectedDeliveryDate ?? undefined,
    sentAt: raw.sentAt?.toISOString(),
    receivedAt: raw.receivedAt?.toISOString(),
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
  });
}

/**
 * GET /suppliers (§5.5)
 */
export async function getSuppliers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as { q?: string; page?: number; pageSize?: number };
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;

    const where: Prisma.SupplierWhereInput = {};
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { contactName: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: 'asc' },
      }),
      prisma.supplier.count({ where }),
    ]);

    res.json({
      data: suppliers.map(formatSupplier),
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
 * POST /suppliers (§5.5)
 */
export async function createSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as InventoryKitchenSchemas.SupplierCreate;

    const created = await prisma.supplier.create({
      data: {
        name: body.name,
        contactName: body.contactName,
        phone: body.phone,
        email: body.email,
        categories: body.categories ?? [],
        leadTimeDays: body.leadTimeDays ?? 1,
        notes: body.notes,
      },
    });

    res.status(201).json({
      data: formatSupplier(created),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /suppliers/:id (§5.5)
 */
export async function getSupplierById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      return next(notFound('ספק לא נמצא'));
    }
    res.json({ data: formatSupplier(supplier) });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /suppliers/:id (§5.5)
 */
export async function updateSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const body = req.body as InventoryKitchenSchemas.SupplierUpdate;

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        name: body.name,
        contactName: body.contactName,
        phone: body.phone,
        email: body.email,
        categories: body.categories,
        leadTimeDays: body.leadTimeDays,
        notes: body.notes,
      },
    });

    res.json({ data: formatSupplier(updated) });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /purchase-orders (§5.5)
 */
export async function getPurchaseOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as {
      status?: PurchaseOrderStatus;
      supplierId?: string;
      page?: number;
      pageSize?: number;
    };
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;

    const where: Prisma.PurchaseOrderWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.supplierId) where.supplierId = query.supplierId;

    const [pos, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: { lines: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    res.json({
      data: pos.map(formatPurchaseOrder),
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
 * POST /purchase-orders (§5.5)
 */
export async function createPurchaseOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as InventoryKitchenSchemas.CreatePurchaseOrderBody;

    const supplier = await prisma.supplier.findUnique({ where: { id: body.supplierId } });
    if (!supplier) {
      return next(notFound('ספק לא נמצא'));
    }

    const ingredientIds = body.lines.map(l => l.ingredientId);
    const ingredients = await prisma.ingredient.findMany({
      where: { id: { in: ingredientIds } },
    });
    const ingMap = new Map(ingredients.map(i => [i.id, i]));

    let total = 0;
    const lineData = body.lines.map(l => {
      const ing = ingMap.get(l.ingredientId);
      const unitPrice = l.unitPrice ?? ing?.costPerUnit ?? 1000;
      const lineTotal = Math.round(l.qty * unitPrice);
      total += lineTotal;
      return {
        ingredientId: l.ingredientId,
        ingredientName: ing?.name ?? 'חומר גלם',
        unit: ing?.unit ?? 'KG',
        qty: l.qty,
        unitPrice,
        lineTotal,
      };
    });

    const created = await prisma.purchaseOrder.create({
      data: {
        supplierId: supplier.id,
        supplierName: supplier.name,
        status: 'DRAFT',
        total,
        expectedDeliveryDate: body.expectedDeliveryDate,
        lines: {
          create: lineData,
        },
      },
      include: { lines: true },
    });

    res.status(201).json({
      data: formatPurchaseOrder(created),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /purchase-orders/:id (§5.5)
 */
export async function getPurchaseOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!po) {
      return next(notFound('הזמנת רכש לא נמצאה'));
    }
    res.json({ data: formatPurchaseOrder(po) });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /purchase-orders/from-shortages (§5.5)
 * Generates draft POs grouped by supplier for all detected shortages.
 */
export async function createPOsFromShortages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as InventoryKitchenSchemas.CreatePOsFromShortagesBody;
    const days = body.days ?? 7;

    const fromDate = new Date();
    const toDate = new Date();
    toDate.setDate(fromDate.getDate() + days);
    const fromStr = fromDate.toISOString().slice(0, 10);
    const toStr = toDate.toISOString().slice(0, 10);

    const [ingredients, orders, openPOs] = await Promise.all([
      prisma.ingredient.findMany({ where: { supplierId: { not: null } } }),
      prisma.order.findMany({
        where: { status: { in: ['CONFIRMED', 'IN_PRODUCTION', 'READY'] } },
      }),
      prisma.purchaseOrder.findMany({
        where: { status: { in: ['DRAFT', 'SENT', 'PARTIAL'] } },
        include: { lines: true },
      }),
    ]);

    // Calculate demand from orders
    const dishIds: string[] = [];
    for (const o of orders) {
      const items = Array.isArray(o.items) ? o.items : [];
      for (const it of items as Array<{ dishId?: string }>) {
        if (it.dishId) dishIds.push(it.dishId);
      }
    }

    const dishes = await prisma.dish.findMany({
      where: { id: { in: [...new Set(dishIds)] } },
    });
    const dishMap = new Map(dishes.map(d => [d.id, d]));

    const requiredMap = new Map<string, number>();
    for (const o of orders) {
      const event = o.event as { startsAt?: string } | null;
      const eventDate = event?.startsAt ? event.startsAt.slice(0, 10) : '';
      if (eventDate < fromStr || eventDate > toStr) continue;

      const items = Array.isArray(o.items) ? o.items : [];
      for (const it of items as Array<{ dishId?: string; qty?: number }>) {
        if (!it.dishId || !it.qty) continue;
        const dish = dishMap.get(it.dishId);
        if (!dish || !Array.isArray(dish.recipe)) continue;

        for (const line of dish.recipe as Array<{ ingredientId?: string; qtyPerPortion?: number }>) {
          if (!line.ingredientId || !line.qtyPerPortion) continue;
          const current = requiredMap.get(line.ingredientId) ?? 0;
          requiredMap.set(line.ingredientId, current + it.qty * line.qtyPerPortion);
        }
      }
    }

    // Incoming from open POs
    const incomingMap = new Map<string, number>();
    for (const po of openPOs) {
      for (const line of po.lines) {
        const remaining = Math.max(0, line.qty - line.receivedQty);
        const current = incomingMap.get(line.ingredientId) ?? 0;
        incomingMap.set(line.ingredientId, current + remaining);
      }
    }

    // Group shortages by supplierId
    const supplierShortageMap = new Map<string, Array<{ ingredient: typeof ingredients[0]; shortage: number }>>();

    for (const ing of ingredients) {
      if (!ing.supplierId) continue;
      const required = requiredMap.get(ing.id) ?? 0;
      const incoming = incomingMap.get(ing.id) ?? 0;
      const available = ing.currentStock + incoming;
      const shortage = Math.max(0, Math.round((required + ing.minStock - available) * 1000) / 1000);

      if (shortage > 0) {
        const list = supplierShortageMap.get(ing.supplierId) ?? [];
        list.push({ ingredient: ing, shortage });
        supplierShortageMap.set(ing.supplierId, list);
      }
    }

    const createdPOs: Array<InventoryKitchenSchemas.PurchaseOrder> = [];

    for (const [supplierId, items] of supplierShortageMap.entries()) {
      const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
      if (!supplier) continue;

      let total = 0;
      const lineData = items.map(it => {
        const lineTotal = Math.round(it.shortage * it.ingredient.costPerUnit);
        total += lineTotal;
        return {
          ingredientId: it.ingredient.id,
          ingredientName: it.ingredient.name,
          unit: it.ingredient.unit,
          qty: it.shortage,
          unitPrice: it.ingredient.costPerUnit,
          lineTotal,
        };
      });

      const po = await prisma.purchaseOrder.create({
        data: {
          supplierId,
          supplierName: supplier.name,
          status: 'DRAFT',
          total,
          lines: {
            create: lineData,
          },
        },
        include: { lines: true },
      });

      createdPOs.push(formatPurchaseOrder(po));
    }

    res.status(201).json({
      data: createdPOs,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /purchase-orders/:id/send (§5.5)
 */
export async function sendPurchaseOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!po) {
      return next(notFound('הזמנת רכש לא נמצאה'));
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
      include: { lines: true },
    });

    res.json({ data: formatPurchaseOrder(updated) });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /purchase-orders/:id/receive (§5.5)
 * Updates received quantities, updates stock with StockMove IN, updates PO status.
 */
export async function receivePurchaseOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const body = req.body as InventoryKitchenSchemas.ReceivePurchaseOrderBody;
    const user = req.user ?? { sub: 'system', name: 'מערכת' };

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!po) {
      return next(notFound('הזמנת רכש לא נמצאה'));
    }

    const lineMap = new Map(po.lines.map(l => [l.id, l]));

    for (const rec of body.lines) {
      const line = lineMap.get(rec.lineId);
      if (!line) continue;

      const newReceivedQty = line.receivedQty + rec.receivedQty;

      await prisma.$transaction([
        prisma.purchaseOrderLine.update({
          where: { id: line.id },
          data: {
            receivedQty: newReceivedQty,
            unitPrice: rec.price ?? line.unitPrice,
            lineTotal: rec.price ? Math.round(line.qty * rec.price) : line.lineTotal,
          },
        }),
        prisma.stockMove.create({
          data: {
            ingredientId: line.ingredientId,
            ingredientName: line.ingredientName,
            type: 'IN',
            qty: rec.receivedQty,
            reason: `קבלת הזמנת רכש #${po.number}`,
            createdById: user.sub,
            createdByName: user.name,
          },
        }),
        prisma.ingredient.update({
          where: { id: line.ingredientId },
          data: {
            currentStock: { increment: rec.receivedQty },
          },
        }),
      ]);
    }

    // Refresh PO to check total completion
    const refreshed = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!refreshed) {
      return next(notFound('הזמנת רכש לא נמצאה'));
    }

    const allCompleted = refreshed.lines.every(l => l.receivedQty >= l.qty);
    const anyReceived = refreshed.lines.some(l => l.receivedQty > 0);

    const newStatus: PurchaseOrderStatus = allCompleted
      ? 'RECEIVED'
      : anyReceived
        ? 'PARTIAL'
        : refreshed.status;

    const finalPO = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: newStatus,
        receivedAt: allCompleted ? new Date() : refreshed.receivedAt,
      },
      include: { lines: true },
    });

    res.json({ data: formatPurchaseOrder(finalPO) });
  } catch (err) {
    next(err);
  }
}
