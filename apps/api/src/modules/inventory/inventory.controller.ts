import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { InventoryKitchenSchemas } from '@catering/shared';
import { notFound } from '../../lib/errors';
import type { Prisma, StockMoveType } from '@prisma/client';

function formatIngredient(raw: {
  id: string;
  name: string;
  category: string | null;
  unit: string;
  currentStock: number;
  minStock: number;
  costPerUnit: number;
  supplierId: string | null;
  supplierName: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return InventoryKitchenSchemas.Ingredient.parse({
    id: raw.id,
    name: raw.name,
    category: raw.category ?? undefined,
    unit: raw.unit,
    currentStock: raw.currentStock,
    minStock: raw.minStock,
    costPerUnit: raw.costPerUnit,
    supplierId: raw.supplierId,
    supplierName: raw.supplierName ?? undefined,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
  });
}

function formatStockMove(raw: {
  id: string;
  ingredientId: string;
  ingredientName: string | null;
  type: unknown;
  qty: number;
  reason: string;
  createdAt: Date;
  createdById: string | null;
  createdByName: string | null;
}) {
  return InventoryKitchenSchemas.StockMove.parse({
    id: raw.id,
    ingredientId: raw.ingredientId,
    ingredientName: raw.ingredientName ?? undefined,
    type: raw.type,
    qty: raw.qty,
    reason: raw.reason,
    createdAt: raw.createdAt.toISOString(),
    createdById: raw.createdById ?? undefined,
    createdByName: raw.createdByName ?? undefined,
  });
}

/**
 * GET /ingredients (§5.5)
 */
export async function getIngredients(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as {
      q?: string;
      category?: string;
      belowMin?: string | boolean;
      page?: number;
      pageSize?: number;
    };
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const { q, category } = query;
    const belowMin = query.belowMin === true || query.belowMin === 'true';

    const where: Prisma.IngredientWhereInput = {};
    if (q) {
      where.name = { contains: q, mode: 'insensitive' };
    }
    if (category) {
      where.category = category;
    }

    const [allIngredients, total] = await Promise.all([
      prisma.ingredient.findMany({
        where,
        orderBy: { name: 'asc' },
      }),
      prisma.ingredient.count({ where }),
    ]);

    // Handle belowMin filter in JS if requested
    const filtered = belowMin
      ? allIngredients.filter(i => i.currentStock < i.minStock)
      : allIngredients;

    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
    const data = paginated.map(formatIngredient);

    res.json({
      data,
      meta: {
        page,
        pageSize,
        total: belowMin ? filtered.length : total,
        totalPages: Math.ceil((belowMin ? filtered.length : total) / pageSize),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /ingredients (§5.5)
 */
export async function createIngredient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as InventoryKitchenSchemas.IngredientCreate;

    let supplierName: string | undefined;
    if (body.supplierId) {
      const supplier = await prisma.supplier.findUnique({ where: { id: body.supplierId } });
      supplierName = supplier?.name;
    }

    const created = await prisma.ingredient.create({
      data: {
        name: body.name,
        category: body.category,
        unit: body.unit,
        currentStock: body.currentStock ?? 0,
        minStock: body.minStock ?? 0,
        costPerUnit: body.costPerUnit,
        supplierId: body.supplierId,
        supplierName,
      },
    });

    res.status(201).json({
      data: formatIngredient(created),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /ingredients/:id (§5.5)
 */
export async function getIngredientById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const ingredient = await prisma.ingredient.findUnique({ where: { id } });
    if (!ingredient) {
      return next(notFound('חומר גלם לא נמצא'));
    }
    res.json({ data: formatIngredient(ingredient) });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /ingredients/:id (§5.5)
 */
export async function updateIngredient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const body = req.body as InventoryKitchenSchemas.IngredientUpdate;

    const existing = await prisma.ingredient.findUnique({ where: { id } });
    if (!existing) {
      return next(notFound('חומר גלם לא נמצא'));
    }

    let supplierName = existing.supplierName;
    if (body.supplierId !== undefined) {
      if (body.supplierId) {
        const supplier = await prisma.supplier.findUnique({ where: { id: body.supplierId } });
        supplierName = supplier?.name ?? null;
      } else {
        supplierName = null;
      }
    }

    const updated = await prisma.ingredient.update({
      where: { id },
      data: {
        name: body.name,
        category: body.category,
        unit: body.unit,
        currentStock: body.currentStock,
        minStock: body.minStock,
        costPerUnit: body.costPerUnit,
        supplierId: body.supplierId,
        supplierName,
      },
    });

    res.json({ data: formatIngredient(updated) });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /inventory/forecast?days=7 (§5.5)
 */
export async function getInventoryForecast(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as { days?: string | number };
    const days = query.days ? Number(query.days) : 7;

    const fromDate = new Date();
    const toDate = new Date();
    toDate.setDate(fromDate.getDate() + days);

    const fromStr = fromDate.toISOString().slice(0, 10);
    const toStr = toDate.toISOString().slice(0, 10);

    const [ingredients, orders, openPOs] = await Promise.all([
      prisma.ingredient.findMany({ orderBy: { name: 'asc' } }),
      prisma.order.findMany({
        where: {
          status: { in: ['CONFIRMED', 'IN_PRODUCTION', 'READY'] },
        },
      }),
      prisma.purchaseOrder.findMany({
        where: {
          status: { in: ['DRAFT', 'SENT', 'PARTIAL'] },
        },
        include: { lines: true },
      }),
    ]);

    // Map dishes recipe if available
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

    // Calculate required ingredient quantities from orders in window
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

    // Calculate incoming from open purchase orders
    const incomingMap = new Map<string, number>();
    for (const po of openPOs) {
      for (const line of po.lines) {
        const remaining = Math.max(0, line.qty - line.receivedQty);
        const current = incomingMap.get(line.ingredientId) ?? 0;
        incomingMap.set(line.ingredientId, current + remaining);
      }
    }

    const data: InventoryKitchenSchemas.InventoryForecastItem[] = ingredients.map(ing => {
      const required = Math.round((requiredMap.get(ing.id) ?? 0) * 1000) / 1000;
      const incoming = Math.round((incomingMap.get(ing.id) ?? 0) * 1000) / 1000;
      const available = ing.currentStock + incoming;
      const shortage = Math.max(0, Math.round((required + ing.minStock - available) * 1000) / 1000);

      return {
        ingredientId: ing.id,
        name: ing.name,
        unit: ing.unit,
        stock: ing.currentStock,
        minStock: ing.minStock,
        required,
        incoming,
        shortage,
        supplier: ing.supplierId
          ? {
              id: ing.supplierId,
              name: ing.supplierName ?? 'ספק',
            }
          : null,
      };
    });

    const response = InventoryKitchenSchemas.InventoryForecastResponse.parse({
      data,
      meta: {
        from: fromStr,
        to: toStr,
      },
    });

    res.json(response);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /inventory/moves (§5.5)
 */
export async function getStockMoves(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as {
      ingredientId?: string;
      type?: StockMoveType;
      from?: string;
      to?: string;
      page?: number;
      pageSize?: number;
    };
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;

    const where: Prisma.StockMoveWhereInput = {};
    if (query.ingredientId) where.ingredientId = query.ingredientId;
    if (query.type) where.type = query.type;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to + 'T23:59:59.999Z');
    }

    const [moves, total] = await Promise.all([
      prisma.stockMove.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockMove.count({ where }),
    ]);

    const data = moves.map(formatStockMove);

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
 * POST /inventory/moves (§5.5)
 */
export async function createStockMove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as InventoryKitchenSchemas.CreateStockMoveBody;
    const user = req.user ?? { sub: 'system', name: 'מערכת' };

    const ingredient = await prisma.ingredient.findUnique({ where: { id: body.ingredientId } });
    if (!ingredient) {
      return next(notFound('חומר גלם לא נמצא'));
    }

    let newStock = ingredient.currentStock;
    if (body.type === 'IN') {
      newStock += body.qty;
    } else if (body.type === 'OUT' || body.type === 'WASTE') {
      newStock = Math.max(0, newStock - body.qty);
    } else if (body.type === 'ADJUST') {
      newStock = body.qty;
    }

    const [move] = await prisma.$transaction([
      prisma.stockMove.create({
        data: {
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          type: body.type,
          qty: body.qty,
          reason: body.reason,
          createdById: user.sub,
          createdByName: user.name,
        },
      }),
      prisma.ingredient.update({
        where: { id: ingredient.id },
        data: { currentStock: Math.round(newStock * 1000) / 1000 },
      }),
    ]);

    res.status(201).json({
      data: formatStockMove(move),
    });
  } catch (err) {
    next(err);
  }
}
