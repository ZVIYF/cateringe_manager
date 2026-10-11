import { z } from 'zod';
import { Kashrut, OrderStatus } from '../enums';
import { Id, IsoDate, IsoDateTime, Money, dataOf } from '../http';

// ── Calendar View Schemas (§5.2) ──────────────────────────────────────────────

export const CalendarOrderItem = z.object({
  id: Id,
  number: z.number().int(),
  status: OrderStatus,
  customerName: z.string(),
  startsAt: IsoDateTime,
  guests: z.number().int().min(1),
  kashrut: Kashrut,
});
export type CalendarOrderItem = z.infer<typeof CalendarOrderItem>;

export const CalendarViewQuery = z.object({
  view: z.literal('calendar'),
  from: IsoDate,
  to: IsoDate,
});
export type CalendarViewQuery = z.infer<typeof CalendarViewQuery>;

export const CalendarViewResponse = z.object({
  data: z.array(CalendarOrderItem),
});
export type CalendarViewResponse = z.infer<typeof CalendarViewResponse>;

// ── Dashboard Schemas (§5.9) ──────────────────────────────────────────────────

export const DashboardAlertType = z.enum([
  'LOW_STOCK',
  'QUOTE_EXPIRING',
  'NO_DRIVER',
  'PAYMENT_RECEIVED',
  'CHANGE_REQUESTED',
]);
export type DashboardAlertType = z.infer<typeof DashboardAlertType>;

export const DashboardKpis = z.object({
  eventsThisWeek: z.number().int().min(0),
  pendingQuotes: z.number().int().min(0),
  revenueThisMonth: Money.optional(), // Omitted for OFFICE per §5.9
  openBalances: Money,
});
export type DashboardKpis = z.infer<typeof DashboardKpis>;

export const DashboardUpcomingItem = z.object({
  orderId: Id,
  number: z.number().int(),
  startsAt: IsoDateTime,
  customerName: z.string(),
  guests: z.number().int().min(1),
  status: OrderStatus,
  paymentState: z.string(),
});
export type DashboardUpcomingItem = z.infer<typeof DashboardUpcomingItem>;

export const DashboardAlert = z.object({
  type: DashboardAlertType,
  message: z.string(),
  link: z.string(),
});
export type DashboardAlert = z.infer<typeof DashboardAlert>;

export const RevenueChartItem = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  revenue: Money,
});
export type RevenueChartItem = z.infer<typeof RevenueChartItem>;

export const DashboardData = z.object({
  kpis: DashboardKpis,
  upcoming: z.array(DashboardUpcomingItem),
  alerts: z.array(DashboardAlert),
  revenueChart: z.array(RevenueChartItem).optional(), // Omitted for OFFICE per §5.9
});
export type DashboardData = z.infer<typeof DashboardData>;

export const DashboardResponse = dataOf(DashboardData);
export type DashboardResponse = z.infer<typeof DashboardResponse>;

// ── Reports Schemas (§5.9) ────────────────────────────────────────────────────

export const RevenueReportItem = z.object({
  period: z.string(),
  revenue: Money,
  ordersCount: z.number().int(),
  prevYearRevenue: Money.optional(),
});
export type RevenueReportItem = z.infer<typeof RevenueReportItem>;

export const ProfitabilityReportItem = z.object({
  orderId: Id,
  number: z.number().int(),
  customerName: z.string(),
  revenue: Money,
  ingredientCost: Money,
  grossProfit: Money,
  marginPercent: z.number(),
});
export type ProfitabilityReportItem = z.infer<typeof ProfitabilityReportItem>;

export const TopDishReportItem = z.object({
  dishId: Id,
  name: z.string(),
  qty: z.number(),
  revenue: Money,
  profit: Money,
});
export type TopDishReportItem = z.infer<typeof TopDishReportItem>;

export const ConversionReport = z.object({
  quotesSent: z.number().int(),
  quotesApproved: z.number().int(),
  rate: z.number(),
});
export type ConversionReport = z.infer<typeof ConversionReport>;
