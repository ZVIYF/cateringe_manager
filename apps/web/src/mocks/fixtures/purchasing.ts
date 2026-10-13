import type { Supplier, PurchaseOrder } from '@catering/shared';

export const mockSuppliers: Supplier[] = [
  {
    id: 'sup-1',
    name: 'עוף ירושלים',
    contactName: 'דוד כהן',
    phone: '02-6543210',
    email: 'orders@jerusalem-poultry.co.il',
    categories: ['בשר ועוף'],
    leadTimeDays: 1,
    notes: 'הספקה יומית עד השעה 09:00',
    createdAt: '2026-01-01T08:00:00.000Z'
  },
  {
    id: 'sup-2',
    name: 'ירקות הדרום',
    contactName: 'אבי לוי',
    phone: '08-8543210',
    email: 'shuk@darom-veg.co.il',
    categories: ['ירקות', 'תבלינים ועשבי תיבול'],
    leadTimeDays: 1,
    notes: 'תוצרת חקלאית טרייה',
    createdAt: '2026-01-02T08:00:00.000Z'
  },
  {
    id: 'sup-3',
    name: 'משק כרמל',
    contactName: 'יוסי כרמלי',
    phone: '04-8543210',
    email: 'sales@carmel-farm.co.il',
    categories: ['שמנים ותבלינים'],
    leadTimeDays: 2,
    notes: 'שמני זית בפיקוח איכות',
    createdAt: '2026-01-03T08:00:00.000Z'
  },
  {
    id: 'sup-4',
    name: 'מעדני השף',
    contactName: 'דני גולן',
    phone: '03-5543210',
    email: 'orders@chef-delicacies.co.il',
    categories: ['יבשים וקפואים', 'יבשים'],
    leadTimeDays: 3,
    notes: 'מוצרי אפייה, פסטות ורטבים',
    createdAt: '2026-01-04T08:00:00.000Z'
  },
  {
    id: 'sup-5',
    name: 'תנובה שף',
    contactName: 'שרון שחר',
    phone: '03-6900000',
    email: 'chef@tnuva.co.il',
    categories: ['מוצרי חלב'],
    leadTimeDays: 1,
    notes: 'הספקה בקירור',
    createdAt: '2026-01-05T08:00:00.000Z'
  }
];

export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po-1',
    number: 5001,
    supplierId: 'sup-1',
    supplierName: 'עוף ירושלים',
    status: 'SENT',
    lines: [
      {
        id: 'pol-1',
        ingredientId: 'ing-1',
        ingredientName: 'פרגית טרייה',
        unit: 'ק"ג',
        qty: 50,
        receivedQty: 0,
        unitPrice: 3800,
        lineTotal: 190000
      },
      {
        id: 'pol-2',
        ingredientId: 'ing-2',
        ingredientName: 'בשר אסאדו מובחר',
        unit: 'ק"ג',
        qty: 25,
        receivedQty: 0,
        unitPrice: 6500,
        lineTotal: 162500
      }
    ],
    total: 352500,
    expectedDeliveryDate: '2026-10-15',
    sentAt: '2026-10-13T10:30:00.000Z',
    createdAt: '2026-10-13T09:00:00.000Z',
    updatedAt: '2026-10-13T10:30:00.000Z'
  },
  {
    id: 'po-2',
    number: 5002,
    supplierId: 'sup-2',
    supplierName: 'ירקות הדרום',
    status: 'DRAFT',
    lines: [
      {
        id: 'pol-3',
        ingredientId: 'ing-3',
        ingredientName: 'תפוחי אדמה',
        unit: 'ק"ג',
        qty: 100,
        receivedQty: 0,
        unitPrice: 450,
        lineTotal: 45000
      },
      {
        id: 'pol-4',
        ingredientId: 'ing-7',
        ingredientName: 'פטריות שמפיניון טריות',
        unit: 'ק"ג',
        qty: 15,
        receivedQty: 0,
        unitPrice: 2200,
        lineTotal: 33000
      }
    ],
    total: 78000,
    expectedDeliveryDate: '2026-10-16',
    createdAt: '2026-10-13T11:00:00.000Z',
    updatedAt: '2026-10-13T11:00:00.000Z'
  },
  {
    id: 'po-3',
    number: 5003,
    supplierId: 'sup-4',
    supplierName: 'מעדני השף',
    status: 'RECEIVED',
    lines: [
      {
        id: 'pol-5',
        ingredientId: 'ing-6',
        ingredientName: 'עלי סיגר מרוקאי',
        unit: 'חבילה',
        qty: 30,
        receivedQty: 30,
        unitPrice: 1200,
        lineTotal: 36000
      },
      {
        id: 'pol-6',
        ingredientId: 'ing-9',
        ingredientName: 'פסטה פנא איטלקית',
        unit: 'ק"ג',
        qty: 40,
        receivedQty: 40,
        unitPrice: 900,
        lineTotal: 36000
      }
    ],
    total: 72000,
    expectedDeliveryDate: '2026-10-12',
    sentAt: '2026-10-11T09:00:00.000Z',
    receivedAt: '2026-10-12T13:45:00.000Z',
    createdAt: '2026-10-10T14:00:00.000Z',
    updatedAt: '2026-10-12T13:45:00.000Z'
  }
];
