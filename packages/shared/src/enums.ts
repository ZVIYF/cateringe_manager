import { z } from 'zod';

const e = <T extends readonly [string, ...string[]]>(values: T) => z.enum(values);

export const Role = e(['ADMIN', 'OFFICE', 'KITCHEN_MANAGER', 'KITCHEN_STAFF', 'DRIVER'] as const);
export const OrderStatus = e(['DRAFT', 'QUOTE_SENT', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CLOSED', 'LOST', 'CANCELLED'] as const);
export const Kashrut = e(['MEAT', 'DAIRY', 'PARVE'] as const);
export const EventType = e(['CELEBRATION', 'BRIT', 'BAR_MITZVAH', 'CORPORATE', 'SHABBAT', 'OTHER'] as const);
export const ServiceType = e(['DELIVERY', 'DELIVERY_AND_SERVING', 'PICKUP'] as const);
export const CustomerType = e(['PRIVATE', 'BUSINESS', 'INSTITUTION'] as const);
export const DishCategory = e(['STARTER', 'MAIN', 'SIDE', 'SALAD', 'DESSERT', 'DRINK'] as const);
export const SaleUnit = e(['PORTION', 'TRAY', 'KG', 'UNIT'] as const);
export const DiscountType = e(['NONE', 'FIXED', 'PERCENT'] as const);
export const PaymentMethod = e(['CASH', 'TRANSFER', 'CHECK', 'CREDIT_CARD'] as const);
export const PaymentStatus = e(['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'] as const);
export const KitchenTaskStatus = e(['TODO', 'IN_PROGRESS', 'DONE', 'PACKED'] as const);
export const DeliveryStatus = e(['UNASSIGNED', 'ASSIGNED', 'EN_ROUTE', 'DELIVERED'] as const);
export const StockMoveType = e(['IN', 'OUT', 'ADJUST', 'WASTE'] as const);
export const PurchaseOrderStatus = e(['DRAFT', 'SENT', 'PARTIAL', 'RECEIVED'] as const);

export type Role = z.infer<typeof Role>;
export type OrderStatus = z.infer<typeof OrderStatus>;
export type Kashrut = z.infer<typeof Kashrut>;
export type DiscountType = z.infer<typeof DiscountType>;

export const labels = {
  Role: { ADMIN: 'מנהל', OFFICE: 'משרד', KITCHEN_MANAGER: 'מנהל מטבח', KITCHEN_STAFF: 'עובד מטבח', DRIVER: 'נהג' },
  OrderStatus: {
    DRAFT: 'טיוטה', QUOTE_SENT: 'הצעה נשלחה', CONFIRMED: 'מאושר', IN_PRODUCTION: 'בייצור', READY: 'מוכן',
    OUT_FOR_DELIVERY: 'במשלוח', DELIVERED: 'נמסר', CLOSED: 'סגור', LOST: 'לא נסגר', CANCELLED: 'בוטל'
  },
  Kashrut: { MEAT: 'בשרי', DAIRY: 'חלבי', PARVE: 'פרווה' },
  EventType: { CELEBRATION: 'שמחה', BRIT: 'ברית', BAR_MITZVAH: 'בר מצווה', CORPORATE: 'אירוע חברה', SHABBAT: 'שבת', OTHER: 'אחר' },
  ServiceType: { DELIVERY: 'משלוח בלבד', DELIVERY_AND_SERVING: 'משלוח + הגשה', PICKUP: 'איסוף עצמי' },
  CustomerType: { PRIVATE: 'פרטי', BUSINESS: 'עסקי', INSTITUTION: 'מוסד' },
  DishCategory: { STARTER: 'ראשונות', MAIN: 'עיקריות', SIDE: 'תוספות', SALAD: 'סלטים', DESSERT: 'קינוחים', DRINK: 'שתייה' },
  SaleUnit: { PORTION: 'מנה', TRAY: 'מגש', KG: 'ק"ג', UNIT: 'יחידה' },
  PaymentMethod: { CASH: 'מזומן', TRANSFER: 'העברה', CHECK: 'צ\'ק', CREDIT_CARD: 'אשראי' },
  KitchenTaskStatus: { TODO: 'לביצוע', IN_PROGRESS: 'בהכנה', DONE: 'מוכן', PACKED: 'נארז' }
} as const;
