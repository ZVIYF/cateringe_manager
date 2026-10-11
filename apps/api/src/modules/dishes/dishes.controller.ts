import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { DishSchemas } from '@catering/shared';
import { notFound, versionConflict } from '../../lib/errors';

function formatDishResponse(dish: {
  id: string;
  version: number;
  name: string;
  category: unknown;
  kashrut: unknown;
  unit: unknown;
  portionsPerUnit: number;
  price: number;
  imageUrl: string | null;
  allergens: string[];
  active: boolean;
  recipe: unknown;
  cost: unknown;
}) {
  return DishSchemas.Dish.parse({
    ...dish,
    recipe: Array.isArray(dish.recipe) ? dish.recipe : [],
    cost: dish.cost ?? null,
  });
}

/**
 * GET /dishes
 * List dishes with pagination, search, category, kashrut, and active filters.
 * For KITCHEN_STAFF, price and cost can be omitted if requested, but Dish parsing works.
 */
export async function getDishes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as DishSchemas.DishListQuery;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const { q, category, kashrut, active } = query;

    const where: Record<string, unknown> = {};

    if (q) {
      where['name'] = { contains: q, mode: 'insensitive' };
    }
    if (category) {
      where['category'] = category;
    }
    if (kashrut) {
      where['kashrut'] = kashrut;
    }
    if (active !== undefined) {
      where['active'] = active;
    }

    const [dishes, total] = await Promise.all([
      prisma.dish.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: 'asc' },
      }),
      prisma.dish.count({ where }),
    ]);

    const data = dishes.map(d => formatDishResponse(d));

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
 * POST /dishes
 * Create a new dish.
 */
export async function createDish(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as DishSchemas.DishCreate;

    const created = await prisma.dish.create({
      data: {
        name: body.name,
        category: body.category,
        kashrut: body.kashrut,
        unit: body.unit,
        portionsPerUnit: body.portionsPerUnit,
        price: body.price,
        imageUrl: body.imageUrl ?? null,
        allergens: body.allergens ?? [],
        active: body.active ?? true,
        recipe: [],
      },
    });

    res.status(201).json({
      data: formatDishResponse(created),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /dishes/:id
 * Retrieve a single dish by ID.
 */
export async function getDishById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const dish = await prisma.dish.findUnique({
      where: { id },
    });

    if (!dish) {
      return next(notFound('מנה לא נמצאה'));
    }

    res.json({
      data: formatDishResponse(dish),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /dishes/:id
 * Update dish details with optimistic concurrency check (version).
 */
export async function updateDish(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const body = req.body as DishSchemas.DishUpdate;

    const existing = await prisma.dish.findUnique({
      where: { id },
    });

    if (!existing) {
      return next(notFound('מנה לא נמצאה'));
    }

    if (existing.version !== body.version) {
      return next(versionConflict('המנה עודכנה על ידי משתמש אחר'));
    }

    const { version, ...updateFields } = body;

    const updated = await prisma.dish.update({
      where: { id },
      data: {
        ...updateFields,
        version: version + 1,
      },
    });

    res.json({
      data: formatDishResponse(updated),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /dishes/:id
 * Soft-delete or delete dish. Here we soft-delete (active = false) or hard delete if unused.
 */
export async function deleteDish(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const existing = await prisma.dish.findUnique({
      where: { id },
    });

    if (!existing) {
      return next(notFound('מנה לא נמצאה'));
    }

    await prisma.dish.update({
      where: { id },
      data: {
        active: false,
        version: existing.version + 1,
      },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
