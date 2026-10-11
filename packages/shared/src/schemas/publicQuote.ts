import { z } from 'zod';
import { Event, OrderItem, OrderService, Totals } from './order';
import { IsoDate, IsoDateTime, Money, dataOf, pageOf } from '../http';
import { PaymentMethod, PaymentStatus } from '../enums';

// ── Public Quote Portal Schemas (§5.3) ────────────────────────────────────────

export const BusinessInfo = z.object({
  name: z.string().trim().min(1),
  logoUrl: z.string().nullable().optional(),
  phone: z.string(),
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
});
export type BusinessInfo = z.infer<typeof BusinessInfo>;

export const PublicQuote = z.object({
  token: z.string().min(1),
  business: BusinessInfo,
  event: Event,
  items: z.array(OrderItem),
  services: z.array(OrderService),
  totals: Totals,
  validUntil: IsoDate,
  status: z.string(),
  terms: z.string().nullable().optional(),
});
export type PublicQuote = z.infer<typeof PublicQuote>;

export const ApproveQuoteBody = z.object({
  signerName: z.string().trim().min(2),
  signaturePng: z.string().min(10), // Base64 encoded PNG
});
export type ApproveQuoteBody = z.infer<typeof ApproveQuoteBody>;

export const ApproveQuoteResponse = z.object({
  paymentUrl: z.string().url(),
});
export type ApproveQuoteResponse = z.infer<typeof ApproveQuoteResponse>;

export const RequestChangeBody = z.object({
  message: z.string().trim().min(3).max(2000),
});
export type RequestChangeBody = z.infer<typeof RequestChangeBody>;

// ── Payments & Invoices Schemas (§5.8) ────────────────────────────────────────

export const PaymentListItem = z.object({
  id: z.string().min(1),
  orderId: z.string().min(1),
  orderNumber: z.number().int().optional(),
  customerName: z.string().optional(),
  amount: Money,
  method: PaymentMethod,
  status: PaymentStatus,
  reference: z.string().nullable().optional(),
  receiptUrl: z.string().nullable().optional(),
  createdAt: IsoDateTime,
});
export type PaymentListItem = z.infer<typeof PaymentListItem>;

export const CreatePaymentBody = z.object({
  orderId: z.string().min(1),
  amount: Money,
  method: PaymentMethod,
  reference: z.string().trim().max(100).optional(),
});
export type CreatePaymentBody = z.infer<typeof CreatePaymentBody>;

export const CreatePaymentLinkBody = z.object({
  orderId: z.string().min(1),
  amount: Money,
});
export type CreatePaymentLinkBody = z.infer<typeof CreatePaymentLinkBody>;

export const PaymentLinkResponse = z.object({
  paymentUrl: z.string().url(),
  expiresAt: IsoDateTime,
});
export type PaymentLinkResponse = z.infer<typeof PaymentLinkResponse>;

export const OpenBalanceItem = z.object({
  orderId: z.string().min(1),
  orderNumber: z.number().int(),
  customerName: z.string(),
  customerPhone: z.string(),
  total: Money,
  paid: Money,
  balance: Money,
  daysOverdue: z.number().int().min(0),
});
export type OpenBalanceItem = z.infer<typeof OpenBalanceItem>;

export const RefundPaymentBody = z.object({
  amount: Money,
  reason: z.string().trim().min(3).max(500),
});
export type RefundPaymentBody = z.infer<typeof RefundPaymentBody>;

// ── Response Wrappers ─────────────────────────────────────────────────────────

export const PublicQuoteResponse = dataOf(PublicQuote);
export type PublicQuoteResponse = z.infer<typeof PublicQuoteResponse>;

export const PaymentsListResponse = pageOf(PaymentListItem);
export type PaymentsListResponse = z.infer<typeof PaymentsListResponse>;
