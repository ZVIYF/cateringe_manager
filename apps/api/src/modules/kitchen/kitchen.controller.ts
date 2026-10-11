import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { InventoryKitchenSchemas } from '@catering/shared';
import { notFound, forbidden } from '../../lib/errors';
import { Prisma, type SaleUnit } from '@prisma/client';

function formatKitchenTask(raw: {
  id: string;
  date: string;
  status: unknown;
  dish: unknown;
  qty: number;
  unit: unknown;
  earliestDepartureAt: Date | null;
  assignee: unknown;
  orders: unknown;
  updatedAt: Date;
}) {
  const dish = raw.dish as { id: string; name: string; kashrut: 'MEAT' | 'DAIRY' | 'PARVE' };
  const assignee = raw.assignee as { id: string; name: string } | null;
  const orders = Array.isArray(raw.orders) ? raw.orders : [];

  return InventoryKitchenSchemas.KitchenTask.parse({
    id: raw.id,
    date: raw.date,
    status: raw.status,
    dish,
    qty: raw.qty,
    unit: raw.unit,
    earliestDepartureAt: raw.earliestDepartureAt?.toISOString() ?? undefined,
    assignee: assignee ?? undefined,
    orders,
    updatedAt: raw.updatedAt.toISOString(),
  });
}

/**
 * GET /kitchen/tasks?date=YYYY-MM-DD (§5.6)
 * RBAC: KITCHEN_STAFF sees only tasks assigned to them or unassigned.
 * Auto-populates tasks from scheduled orders if none exist for date.
 */
export async function getKitchenTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { date } = req.query as { date: string };
    const user = req.user;

    let tasks = await prisma.kitchenTask.findMany({
      where: { date },
      orderBy: { earliestDepartureAt: 'asc' },
    });

    // If no tasks exist for this date, generate from confirmed/in-production orders
    if (tasks.length === 0) {
      const orders = await prisma.order.findMany({
        where: {
          status: { in: ['CONFIRMED', 'IN_PRODUCTION', 'READY'] },
        },
      });

      const ordersForDate = orders.filter(o => {
        const event = o.event as { startsAt?: string } | null;
        return event?.startsAt && event.startsAt.slice(0, 10) === date;
      });

      // Group by dishId
      const taskMap = new Map<string, {
        dish: { id: string; name: string; kashrut: 'MEAT' | 'DAIRY' | 'PARVE' };
        qty: number;
        unit: SaleUnit;
        earliestDepartureAt: Date | null;
        orders: Array<{ id: string; number: number; customerName: string; qty: number }>;
      }>();

      for (const o of ordersForDate) {
        const event = o.event as { startsAt?: string } | null;
        const customer = o.customer as { name?: string } | null;
        const departure = event?.startsAt ? new Date(event.startsAt) : null;
        const items = Array.isArray(o.items) ? o.items : [];

        for (const it of items as Array<{ dishId?: string; dishName?: string; qty?: number; unit?: SaleUnit }>) {
          if (!it.dishId) continue;
          const current = taskMap.get(it.dishId) ?? {
            dish: { id: it.dishId, name: it.dishName ?? 'מנה', kashrut: 'MEAT' },
            qty: 0,
            unit: it.unit ?? 'PORTION',
            earliestDepartureAt: departure,
            orders: [],
          };
          current.qty += it.qty ?? 0;
          if (departure && (!current.earliestDepartureAt || departure < current.earliestDepartureAt)) {
            current.earliestDepartureAt = departure;
          }
          current.orders.push({
            id: o.id,
            number: o.number,
            customerName: customer?.name ?? '',
            qty: it.qty ?? 0,
          });
          taskMap.set(it.dishId, current);
        }
      }

      if (taskMap.size > 0) {
        for (const val of taskMap.values()) {
          const created = await prisma.kitchenTask.create({
            data: {
              date,
              status: 'TODO',
              dish: val.dish,
              qty: val.qty,
              unit: val.unit,
              earliestDepartureAt: val.earliestDepartureAt,
              orders: val.orders,
            },
          });
          tasks.push(created);
        }
      }
    }

    // CRITICAL RBAC CHECK:
    // If KITCHEN_STAFF, filter to only assigned to them or unassigned
    if (user?.role === 'KITCHEN_STAFF') {
      tasks = tasks.filter(t => t.assigneeId === user.sub || t.assigneeId === null);
    }

    const data = tasks.map(formatKitchenTask);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /kitchen/tasks/:id (§5.6)
 * RBAC: KITCHEN_STAFF can only update status. KITCHEN_MANAGER & ADMIN can update status and assigneeId.
 */
export async function updateKitchenTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const body = req.body as InventoryKitchenSchemas.KitchenTaskUpdate;
    const user = req.user;

    const task = await prisma.kitchenTask.findUnique({ where: { id } });
    if (!task) {
      return next(notFound('משימת מטבח לא נמצאה'));
    }

    // CRITICAL RBAC CHECK:
    // KITCHEN_STAFF is restricted to updating only status
    if (user?.role === 'KITCHEN_STAFF') {
      if (body.assigneeId !== undefined) {
        return next(forbidden('עובד מטבח רשאי לעדכן רק את סטטוס המשימה'));
      }
    }

    const data: Prisma.KitchenTaskUpdateInput = {};
    if (body.status) {
      data.status = body.status;
    }

    if (body.assigneeId !== undefined) {
      if (body.assigneeId) {
        const staff = await prisma.user.findUnique({ where: { id: body.assigneeId } });
        data.assigneeId = body.assigneeId;
        data.assignee = staff ? { id: staff.id, name: staff.name } : Prisma.DbNull;
      } else {
        data.assigneeId = null;
        data.assignee = Prisma.DbNull;
      }
    }

    const updated = await prisma.kitchenTask.update({
      where: { id },
      data,
    });

    res.json({ data: formatKitchenTask(updated) });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /kitchen/production-sheet?date= (§5.6)
 * ADMIN, KITCHEN_MANAGER
 */
export async function getProductionSheet(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { date } = req.query as { date: string };
    const pdfUrl = `/static/production-sheets/production-${date}.pdf`;
    res.json({ data: { pdfUrl } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /kitchen/updates?date=&since= (§5.6)
 * Poll endpoint for kitchen live display (refreshed every 15s).
 */
export async function getKitchenUpdates(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { date, since } = req.query as { date: string; since: string };
    const user = req.user;

    let tasks = await prisma.kitchenTask.findMany({
      where: {
        date,
        updatedAt: { gte: new Date(since) },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // CRITICAL RBAC CHECK:
    if (user?.role === 'KITCHEN_STAFF') {
      tasks = tasks.filter(t => t.assigneeId === user.sub || t.assigneeId === null);
    }

    res.json({ data: tasks.map(formatKitchenTask) });
  } catch (err) {
    next(err);
  }
}
