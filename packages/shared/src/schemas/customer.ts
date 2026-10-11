import { z } from 'zod';
import { CustomerType } from '../enums';
import { Id, IsraeliPhone, IsoDateTime, Money, pageOf, dataOf } from '../http';

// ── Shared Sub-schemas ────────────────────────────────────────────────────────

export const CustomerContact = z.object({
  id: Id,
  name: z.string().trim().min(2),
  role: z.string().trim(),
  phone: IsraeliPhone,
  email: z.string().email().nullable(),
});
export type CustomerContact = z.infer<typeof CustomerContact>;

export const CustomerStats = z.object({
  ordersCount: z.number().int().min(0),
  totalRevenue: Money,
  openBalance: Money,
});
export type CustomerStats = z.infer<typeof CustomerStats>;

// ── Main Customer Schema ──────────────────────────────────────────────────────

export const Customer = z.object({
  id: Id,
  version: z.number().int().min(1),
  name: z.string().trim().min(2).max(100),
  type: CustomerType,
  phone: IsraeliPhone,
  email: z.string().email().nullable(),
  taxId: z.string().nullable(),
  billingAddress: z.string().nullable(),
  tags: z.array(z.string()),
  notes: z.string(),
  contacts: z.array(CustomerContact),
  stats: CustomerStats,
  createdAt: IsoDateTime,
});
export type Customer = z.infer<typeof Customer>;

// ── GET /customers (List items) ───────────────────────────────────────────────
export const CustomerPublic = Customer.omit({ contacts: true });
export type CustomerPublic = z.infer<typeof CustomerPublic>;

// ── POST /customers ───────────────────────────────────────────────────────────

export const CustomerCreate = z.object({
  name: z.string().trim().min(2).max(100),
  type: CustomerType,
  phone: IsraeliPhone,
  email: z.string().email().optional().nullable(),
  taxId: z.string().optional().nullable(),
  billingAddress: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().optional().default(''),
  contacts: z.array(CustomerContact.omit({ id: true })).optional().default([]),
}).superRefine((data, ctx) => {
  if (data.type === 'BUSINESS' && !data.taxId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['taxId'],
      message: 'ח"פ / עוסק מורשה הוא חובה עבור לקוח עסקי',
    });
  }
});
export type CustomerCreate = z.infer<typeof CustomerCreate>;

// ── PATCH /customers/:id ──────────────────────────────────────────────────────

export const CustomerUpdate = z.object({
  version: z.number().int().min(1),
  name: z.string().trim().min(2).max(100).optional(),
  type: CustomerType.optional(),
  phone: IsraeliPhone.optional(),
  email: z.string().email().optional().nullable(),
  taxId: z.string().optional().nullable(),
  billingAddress: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  // For nested contacts update, usually a full replacement or specific DTO is needed.
  // We allow replacing the whole list or just not passing it.
  contacts: z.array(
    z.object({
      id: Id.optional(), // if missing, it's a new contact
      name: z.string().trim().min(2),
      role: z.string().trim(),
      phone: IsraeliPhone,
      email: z.string().email().nullable().optional(),
    })
  ).optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'BUSINESS' && data.taxId === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['taxId'],
      message: 'ח"פ / עוסק מורשה הוא חובה עבור לקוח עסקי',
    });
  }
});
export type CustomerUpdate = z.infer<typeof CustomerUpdate>;

// ── Response Wrappers ─────────────────────────────────────────────────────────

export const CustomerResponse = dataOf(Customer);
export type CustomerResponse = z.infer<typeof CustomerResponse>;

export const CustomerListResponse = pageOf(CustomerPublic);
export type CustomerListResponse = z.infer<typeof CustomerListResponse>;
