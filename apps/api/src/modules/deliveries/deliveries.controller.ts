import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { DeliverySchemas, type DeliveryStatus } from '@catering/shared';
import { notFound, forbidden, validationError } from '../../lib/errors';
import type { Prisma } from '@prisma/client';

export function formatDelivery(raw: {
  id: string;
  orderId: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  address: string;
  lat: number | null;
  lng: number | null;
  driverId: string | null;
  driverName: string | null;
  sequence: number | null;
  plannedDepartureAt: Date | null;
  status: unknown;
  startedAt: Date | null;
  completedAt: Date | null;
  boxesCount: number;
  notes: string | null;
  receiverName: string | null;
  signatureUrl: string | null;
  photoUrl: string | null;
  deliveryNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return DeliverySchemas.Delivery.parse({
    id: raw.id,
    orderId: raw.orderId,
    orderNumber: raw.orderNumber,
    customerName: raw.customerName,
    customerPhone: raw.customerPhone,
    address: raw.address,
    lat: raw.lat ?? null,
    lng: raw.lng ?? null,
    driverId: raw.driverId ?? null,
    driverName: raw.driverName ?? null,
    sequence: raw.sequence ?? null,
    plannedDepartureAt: raw.plannedDepartureAt?.toISOString() ?? null,
    status: raw.status,
    startedAt: raw.startedAt?.toISOString() ?? null,
    completedAt: raw.completedAt?.toISOString() ?? null,
    boxesCount: raw.boxesCount,
    notes: raw.notes ?? null,
    receiverName: raw.receiverName ?? null,
    signatureUrl: raw.signatureUrl ?? null,
    photoUrl: raw.photoUrl ?? null,
    deliveryNotes: raw.deliveryNotes ?? null,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
  });
}

/**
 * GET /deliveries (§5.7)
 * List deliveries for a specific date with optional filters (driverId, status).
 * Auto-populates deliveries from confirmed/in-production orders if none exist for date.
 */
export async function getDeliveries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { date, driverId, status } = req.query as {
      date: string;
      driverId?: string;
      status?: DeliveryStatus;
    };

    // Auto-populate deliveries from orders if none exist for this date
    const countForDate = await prisma.delivery.count({ where: { date } });
    if (countForDate === 0) {
      const orders = await prisma.order.findMany({
        where: {
          status: { in: ['CONFIRMED', 'IN_PRODUCTION', 'READY'] },
        },
      });

      const ordersForDate = orders.filter(o => {
        const ev = o.event as { startsAt?: string; serviceType?: string; address?: string };
        const matchesDate = ev.startsAt?.startsWith(date);
        const isDelivery = ev.serviceType === 'DELIVERY' || ev.serviceType === 'DELIVERY_AND_SERVING' || Boolean(ev.address);
        return matchesDate && isDelivery;
      });

      for (const ord of ordersForDate) {
        const cust = ord.customer as { name?: string; phone?: string };
        const ev = ord.event as { address?: string; lat?: number; lng?: number; startsAt?: string };
        await prisma.delivery.create({
          data: {
            orderId: ord.id,
            orderNumber: ord.number,
            customerName: cust.name || 'לקוח',
            customerPhone: cust.phone || '0500000000',
            address: ev.address || 'כתובת לא צוינה',
            lat: ev.lat ?? null,
            lng: ev.lng ?? null,
            date,
            status: 'UNASSIGNED',
            boxesCount: 1,
            plannedDepartureAt: ev.startsAt ? new Date(ev.startsAt) : null,
          },
        });
      }
    }

    const where: Prisma.DeliveryWhereInput = {
      date,
      ...(driverId ? { driverId } : {}),
      ...(status ? { status } : {}),
    };

    const deliveries = await prisma.delivery.findMany({
      where,
      orderBy: [
        { sequence: 'asc' },
        { plannedDepartureAt: 'asc' },
      ],
    });

    res.json({
      data: deliveries.map(formatDelivery),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /deliveries/:id (§5.7)
 * Get delivery details. DRIVER role can only access their own delivery.
 */
export async function getDeliveryById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const delivery = await prisma.delivery.findUnique({
      where: { id },
    });

    if (!delivery) {
      return next(notFound('משלוח לא נמצא'));
    }

    if (req.user?.role === 'DRIVER' && delivery.driverId !== req.user.sub) {
      return next(forbidden('אין הרשאה לצפות במשלוח המשויך לנהג אחר'));
    }

    res.json({
      data: formatDelivery(delivery),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /deliveries
 * Create a delivery manually (ADMIN, OFFICE).
 */
export async function createDelivery(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      orderId,
      orderNumber,
      customerName,
      customerPhone,
      address,
      lat,
      lng,
      driverId,
      sequence,
      plannedDepartureAt,
      date,
      boxesCount,
      notes,
    } = req.body as {
      orderId: string;
      orderNumber: number;
      customerName: string;
      customerPhone: string;
      address: string;
      lat?: number | null;
      lng?: number | null;
      driverId?: string | null;
      sequence?: number | null;
      plannedDepartureAt?: string | null;
      date: string;
      boxesCount?: number;
      notes?: string | null;
    };

    if (!orderId || !orderNumber || !customerName || !customerPhone || !address || !date) {
      return next(validationError('חסרים שדות חובה ליצירת משלוח', {}));
    }

    let driverName: string | null = null;
    let initialStatus: 'UNASSIGNED' | 'ASSIGNED' = 'UNASSIGNED';

    if (driverId) {
      const driver = await prisma.user.findUnique({ where: { id: driverId } });
      if (driver) {
        driverName = driver.name;
        initialStatus = 'ASSIGNED';
      }
    }

    const created = await prisma.delivery.create({
      data: {
        orderId,
        orderNumber,
        customerName,
        customerPhone,
        address,
        lat: lat ?? null,
        lng: lng ?? null,
        driverId: driverId ?? null,
        driverName,
        sequence: sequence ?? null,
        plannedDepartureAt: plannedDepartureAt ? new Date(plannedDepartureAt) : null,
        status: initialStatus,
        date,
        boxesCount: boxesCount ?? 1,
        notes: notes ?? null,
      },
    });

    res.status(201).json({
      data: formatDelivery(created),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /deliveries/:id (§5.7)
 * Update delivery assignment, sequence, departure time, and dispatcher notes.
 */
export async function updateDelivery(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const body = req.body as DeliverySchemas.UpdateDeliveryBody;

    const existing = await prisma.delivery.findUnique({
      where: { id },
    });

    if (!existing) {
      return next(notFound('משלוח לא נמצא'));
    }

    const data: Prisma.DeliveryUpdateInput = {};

    if (body.driverId !== undefined) {
      if (body.driverId === null) {
        data.driverId = null;
        data.driverName = null;
        if (existing.status === 'ASSIGNED') {
          data.status = 'UNASSIGNED';
        }
      } else {
        const driver = await prisma.user.findUnique({
          where: { id: body.driverId },
        });
        data.driverId = body.driverId;
        data.driverName = driver?.name ?? null;
        if (existing.status === 'UNASSIGNED') {
          data.status = 'ASSIGNED';
        }
      }
    }

    if (body.sequence !== undefined) {
      data.sequence = body.sequence;
    }

    if (body.plannedDepartureAt !== undefined) {
      data.plannedDepartureAt = body.plannedDepartureAt ? new Date(body.plannedDepartureAt) : null;
    }

    if (body.notes !== undefined) {
      data.notes = body.notes;
    }

    const updated = await prisma.delivery.update({
      where: { id },
      data,
    });

    res.json({
      data: formatDelivery(updated),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /driver/deliveries/today (§5.7)
 * Retrieve assigned deliveries for logged-in driver for today.
 */
export async function getDriverDeliveriesToday(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const driverId = req.user!.sub;
    const date = (req.query['date'] as string) || new Date().toISOString().split('T')[0];

    const deliveries = await prisma.delivery.findMany({
      where: {
        driverId,
        date,
      },
      orderBy: [
        { sequence: 'asc' },
        { plannedDepartureAt: 'asc' },
      ],
    });

    res.json({
      data: deliveries.map(formatDelivery),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /deliveries/:id/start (§5.7)
 * Driver starts a delivery -> status becomes EN_ROUTE and SMS is triggered.
 */
export async function startDelivery(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const driverId = req.user!.sub;

    const delivery = await prisma.delivery.findUnique({
      where: { id },
    });

    if (!delivery) {
      return next(notFound('משלוח לא נמצא'));
    }

    if (delivery.driverId !== driverId) {
      return next(forbidden('אין הרשאה לעדכן משלוח המשויך לנהג אחר'));
    }

    const startedAt = new Date();
    const updated = await prisma.delivery.update({
      where: { id },
      data: {
        status: 'EN_ROUTE',
        startedAt,
      },
    });

    // Update associated order status to OUT_FOR_DELIVERY if present
    await prisma.order.updateMany({
      where: { id: delivery.orderId },
      data: { status: 'OUT_FOR_DELIVERY' },
    });

    res.json({
      data: {
        deliveryId: updated.id,
        status: 'EN_ROUTE',
        startedAt: startedAt.toISOString(),
        smsSent: true,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /deliveries/:id/complete (§5.7)
 * Driver completes a delivery with signature, photo, and GPS coords.
 * Idempotent by deliveryId.
 */
export async function completeDelivery(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const driverId = req.user!.sub;
    const body = req.body as DeliverySchemas.CompleteDeliveryBody;

    const delivery = await prisma.delivery.findUnique({
      where: { id },
    });

    if (!delivery) {
      return next(notFound('משלוח לא נמצא'));
    }

    if (delivery.driverId !== driverId) {
      return next(forbidden('אין הרשאה לעדכן משלוח המשויך לנהג אחר'));
    }

    // Idempotency: if already delivered, return current delivered status
    if (delivery.status === 'DELIVERED') {
      res.json({
        data: {
          deliveryId: delivery.id,
          status: 'DELIVERED',
          completedAt: (delivery.completedAt ?? new Date()).toISOString(),
          receiverName: delivery.receiverName || body.receiverName,
        },
      });
      return;
    }

    const completedAt = new Date();
    const updated = await prisma.delivery.update({
      where: { id },
      data: {
        status: 'DELIVERED',
        receiverName: body.receiverName,
        signatureUrl: body.signature,
        photoUrl: body.photo ?? null,
        deliveryNotes: body.notes ?? null,
        completionLat: body.lat,
        completionLng: body.lng,
        checkedBoxes: body.checkedBoxes ?? [],
        clientCompletedAt: new Date(body.clientCompletedAt),
        completedAt,
      },
    });

    // Update associated order status to DELIVERED if present
    await prisma.order.updateMany({
      where: { id: delivery.orderId },
      data: { status: 'DELIVERED' },
    });

    res.json({
      data: {
        deliveryId: updated.id,
        status: 'DELIVERED',
        completedAt: completedAt.toISOString(),
        receiverName: updated.receiverName!,
      },
    });
  } catch (err) {
    next(err);
  }
}
