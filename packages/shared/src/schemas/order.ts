import { z } from 'zod';
import { DiscountType, DishCategory, EventType, Kashrut, OrderStatus, PaymentMethod, SaleUnit, ServiceType } from '../enums';
import { Id, IsoDate, IsoDateTime, ListQuery, Money, csvEnum, dataOf, pageOf } from '../http';

export const EventInput = z.object({
  title: z.string().trim().max(120).optional(),
  type: EventType,
  startsAt: IsoDateTime,
  address: z.string().trim().min(2),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  guests: z.number().int().min(1).max(5000),
  kashrut: Kashrut,
  serviceType: ServiceType,
  notes: z.string().max(2000).optional()
});

export const Event = EventInput.extend({
  id: Id,
  title: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  notes: z.string().nullable()
});

export const OrderItem = z.object({
  id: Id,
  dishId: Id,
  dishName: z.string(),
  category: DishCategory,
  unit: SaleUnit,
  qty: z.number().positive(),
  unitPrice: Money,
  priceOverridden: z.boolean(),
  lineTotal: Money,
  notes: z.string().nullable()
});

export const OrderService = z.object({
  id: Id,
  serviceId: Id,
  name: z.string(),
  qty: z.number().positive(),
  unitPrice: Money,
  lineTotal: Money
});

export const Pricing = z.object({
  discountType: DiscountType,
  discountValue: z.number().min(0),
  vatPercent: z.number().min(0).max(100),
  pricesIncludeVat: z.boolean(),
  depositPercent: z.number().min(0).max(100),
  paymentTerms: PaymentMethod.or(z.literal('NET_30')),
  validUntil: IsoDate
});

export const Totals = z.object({
  subtotal: Money,
  discount: Money,
  vat: Money,
  total: Money,
  deposit: Money,
  paid: Money,
  balance: Money,
  perGuest: Money
});

export const Order = z.object({
  id: Id,
  number: z.number().int(),
  status: OrderStatus,
  version: z.number().int(),
  customer: z.object({ id: Id, name: z.string(), phone: z.string() }),
  event: Event,
  items: z.array(OrderItem),
  services: z.array(OrderService),
  pricing: Pricing,
  totals: Totals,
  allowedTransitions: z.array(OrderStatus),
  isLocked: z.boolean(),
  latestQuoteVersion: z.number().int().nullable(),
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
  createdBy: z.object({ id: Id, name: z.string() })
});
export type Order = z.infer<typeof Order>;

export const OrderListItem = z.object({
  id: Id,
  number: z.number().int(),
  status: OrderStatus,
  customerName: z.string(),
  eventStartsAt: IsoDateTime,
  guests: z.number().int(),
  total: Money,
  paid: Money,
  balance: Money,
  driverName: z.string().nullable(),
  createdByName: z.string()
});
export type OrderListItem = z.infer<typeof OrderListItem>;

export const OrdersListQuery = ListQuery.extend({
  status: csvEnum(OrderStatus),
  from: IsoDate.optional(),
  to: IsoDate.optional(),
  customerId: Id.optional(),
  minTotal: z.coerce.number().int().optional(),
  maxTotal: z.coerce.number().int().optional(),
  hasBalance: z.coerce.boolean().optional()
});

export const CreateOrderBody = z.object({ customerId: Id, event: EventInput });

export const UpdateOrderBody = z.object({
  version: z.number().int(),
  event: EventInput.partial().optional(),
  pricing: Pricing.partial().optional()
});

export const PutItemsBody = z.object({
  version: z.number().int(),
  items: z.array(z.object({
    dishId: Id,
    qty: z.number().positive(),
    unitPrice: Money.optional(),
    notes: z.string().max(500).optional()
  })),
  overrideReason: z.string().min(3).optional()
});

export const TransitionBody = z.object({ to: OrderStatus, reason: z.string().min(3).optional() });

export const OrderResponse = dataOf(Order);
export const OrdersListResponse = pageOf(OrderListItem);
