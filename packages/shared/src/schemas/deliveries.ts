import { z } from 'zod';
import { DeliveryStatus } from '../enums';
import { Id, IsoDate, IsoDateTime, dataOf } from '../http';

// ── Delivery Item Schema (§5.7) ──────────────────────────────────────────────

export const Delivery = z.object({
  id: Id,
  orderId: Id,
  orderNumber: z.number().int(),
  customerName: z.string().trim().min(1),
  customerPhone: z.string().trim().min(1),
  address: z.string().trim().min(1),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  driverId: Id.nullable().optional(),
  driverName: z.string().nullable().optional(),
  sequence: z.number().int().min(1).nullable().optional(),
  plannedDepartureAt: IsoDateTime.nullable().optional(),
  status: DeliveryStatus,
  startedAt: IsoDateTime.nullable().optional(),
  completedAt: IsoDateTime.nullable().optional(),
  boxesCount: z.number().int().min(1).default(1),
  notes: z.string().nullable().optional(),
  receiverName: z.string().nullable().optional(),
  signatureUrl: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  deliveryNotes: z.string().nullable().optional(),
  createdAt: IsoDateTime.optional(),
  updatedAt: IsoDateTime.optional(),
});
export type Delivery = z.infer<typeof Delivery>;

export const DeliveryResponse = dataOf(Delivery);
export type DeliveryResponse = z.infer<typeof DeliveryResponse>;

export const DeliveriesListResponse = z.object({
  data: z.array(Delivery),
});
export type DeliveriesListResponse = z.infer<typeof DeliveriesListResponse>;

// ── Query Schemas (§5.7) ─────────────────────────────────────────────────────

export const DeliveriesQuery = z.object({
  date: IsoDate,
  driverId: Id.optional(),
  status: DeliveryStatus.optional(),
});
export type DeliveriesQuery = z.infer<typeof DeliveriesQuery>;

// ── Update / Dispatch Schemas (§5.7) ─────────────────────────────────────────

export const UpdateDeliveryBody = z.object({
  driverId: Id.nullable().optional(),
  sequence: z.number().int().min(1).nullable().optional(),
  plannedDepartureAt: IsoDateTime.nullable().optional(),
  notes: z.string().max(500).optional(),
});
export type UpdateDeliveryBody = z.infer<typeof UpdateDeliveryBody>;

// ── Driver Mobile Workflow Schemas (§5.7) ────────────────────────────────────

export const StartDeliveryResponse = dataOf(
  z.object({
    deliveryId: Id,
    status: z.literal('EN_ROUTE'),
    startedAt: IsoDateTime,
    smsSent: z.boolean(),
  })
);
export type StartDeliveryResponse = z.infer<typeof StartDeliveryResponse>;

export const CompleteDeliveryBody = z.object({
  receiverName: z.string().trim().min(1),
  signature: z.string().min(1), // base64 PNG data url or image string
  photo: z.string().optional(), // optional photo base64 or url
  notes: z.string().max(500).optional(),
  lat: z.number(),
  lng: z.number(),
  checkedBoxes: z.array(z.string()).default([]), // checked box barcodes or identifiers
  clientCompletedAt: IsoDateTime, // client timestamp for offline resilience
});
export type CompleteDeliveryBody = z.infer<typeof CompleteDeliveryBody>;

export const CompleteDeliveryResponse = dataOf(
  z.object({
    deliveryId: Id,
    status: z.literal('DELIVERED'),
    completedAt: IsoDateTime,
    receiverName: z.string(),
  })
);
export type CompleteDeliveryResponse = z.infer<typeof CompleteDeliveryResponse>;

