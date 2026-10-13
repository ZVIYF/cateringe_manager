import type { Order, OrderListItem, Dish, Customer, PublicQuote } from '@catering/shared';

export const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    version: 1,
    name: 'משפחת כהן',
    type: 'PRIVATE',
    phone: '0527654321',
    email: 'cohen@example.com',
    taxId: null,
    billingAddress: 'הרצל 12, תל אביב',
    tags: ['VIP', 'שמחות'],
    notes: 'העדפה למנות בשריות ללא גלוטן',
    contacts: [{ id: 'cc-1', name: 'יוסי כהן', role: 'אב', phone: '0527654321', email: 'cohen@example.com' }],
    stats: { ordersCount: 3, totalRevenue: 1540000, openBalance: 0 },
    createdAt: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 'cust-2',
    version: 1,
    name: 'הייטק סולושנס בע"מ',
    type: 'BUSINESS',
    phone: '0541234567',
    email: 'office@hitech.co.il',
    taxId: '514234567',
    billingAddress: 'התדהר 4, רעננה',
    tags: ['עסקי', 'חברה'],
    notes: 'אירועי חברה והרמות כוסית',
    contacts: [{ id: 'cc-2', name: 'מיכל לוי', role: 'מנהלת רווחה', phone: '0541234567', email: 'office@hitech.co.il' }],
    stats: { ordersCount: 5, totalRevenue: 3450000, openBalance: 450000 },
    createdAt: '2026-02-15T09:30:00.000Z'
  },
  {
    id: 'cust-3',
    version: 1,
    name: 'ישראל ישראלי',
    type: 'PRIVATE',
    phone: '0509876543',
    email: 'israel@example.com',
    taxId: null,
    billingAddress: 'רוטשילד 45, פתח תקווה',
    tags: ['פרטי'],
    notes: '',
    contacts: [],
    stats: { ordersCount: 1, totalRevenue: 850000, openBalance: 250000 },
    createdAt: '2026-05-20T11:00:00.000Z'
  }
];

export const mockDishes: Dish[] = [
  {
    id: 'dish-1',
    version: 1,
    name: 'סיגרים אסאדו',
    category: 'STARTER',
    kashrut: 'MEAT',
    unit: 'PORTION',
    portionsPerUnit: 1,
    price: 3200,
    imageUrl: null,
    allergens: ['גלוטן'],
    active: true,
    recipe: [],
    cost: { perPortion: 1200, marginPercent: 62.5 }
  },
  {
    id: 'dish-2',
    version: 1,
    name: 'סטייק פרגית במרינדה',
    category: 'MAIN',
    kashrut: 'MEAT',
    unit: 'PORTION',
    portionsPerUnit: 1,
    price: 5500,
    imageUrl: null,
    allergens: [],
    active: true,
    recipe: [],
    cost: { perPortion: 2100, marginPercent: 61.8 }
  },
  {
    id: 'dish-3',
    version: 1,
    name: 'תפוחי אדמה אפויים ברוזמרין',
    category: 'SIDE',
    kashrut: 'PARVE',
    unit: 'PORTION',
    portionsPerUnit: 1,
    price: 1800,
    imageUrl: null,
    allergens: [],
    active: true,
    recipe: [],
    cost: { perPortion: 450, marginPercent: 75 }
  },
  {
    id: 'dish-4',
    version: 1,
    name: 'סלט שוק רענן עם שקדים',
    category: 'SALAD',
    kashrut: 'PARVE',
    unit: 'PORTION',
    portionsPerUnit: 1,
    price: 1500,
    imageUrl: null,
    allergens: ['אגוזים ושקדים'],
    active: true,
    recipe: [],
    cost: { perPortion: 350, marginPercent: 76.6 }
  },
  {
    id: 'dish-5',
    version: 1,
    name: 'פאי תפוחים חם עם גלידת וניל פרווה',
    category: 'DESSERT',
    kashrut: 'PARVE',
    unit: 'PORTION',
    portionsPerUnit: 1,
    price: 2400,
    imageUrl: null,
    allergens: ['גלוטן'],
    active: true,
    recipe: [],
    cost: { perPortion: 700, marginPercent: 70.8 }
  },
  {
    id: 'dish-6',
    version: 1,
    name: 'פסטה שמנת פטריות',
    category: 'MAIN',
    kashrut: 'DAIRY',
    unit: 'PORTION',
    portionsPerUnit: 1,
    price: 4800,
    imageUrl: null,
    allergens: ['חלב', 'גלוטן'],
    active: true,
    recipe: [],
    cost: { perPortion: 1600, marginPercent: 66.7 }
  }
];

export const mockOrders: Order[] = [
  {
    id: 'order-101',
    number: 1045,
    status: 'IN_PRODUCTION',
    version: 3,
    customer: { id: 'cust-1', name: 'משפחת כהן', phone: '0527654321' },
    event: {
      id: 'ev-101',
      title: 'בר מצווה — יונתן',
      type: 'BAR_MITZVAH',
      startsAt: '2026-10-15T15:00:00.000Z',
      address: 'אולם היכל שלמה, ירושלים',
      lat: 31.78,
      lng: 35.21,
      guests: 120,
      kashrut: 'MEAT',
      serviceType: 'DELIVERY_AND_SERVING',
      notes: 'נא להקפיד על הגשה חמה'
    },
    items: [
      {
        id: 'item-1',
        dishId: 'dish-1',
        dishName: 'סיגרים אסאדו',
        category: 'STARTER',
        unit: 'PORTION',
        qty: 120,
        unitPrice: 3200,
        priceOverridden: false,
        lineTotal: 384000,
        notes: null
      },
      {
        id: 'item-2',
        dishId: 'dish-2',
        dishName: 'סטייק פרגית במרינדה',
        category: 'MAIN',
        unit: 'PORTION',
        qty: 120,
        unitPrice: 5500,
        priceOverridden: false,
        lineTotal: 660000,
        notes: 'עשייה בינונית'
      },
      {
        id: 'item-3',
        dishId: 'dish-3',
        dishName: 'תפוחי אדמה אפויים ברוזמרין',
        category: 'SIDE',
        unit: 'PORTION',
        qty: 120,
        unitPrice: 1800,
        priceOverridden: false,
        lineTotal: 216000,
        notes: null
      }
    ],
    services: [
      {
        id: 'srv-1',
        serviceId: 'srv-waiters',
        name: 'מלצרים והגשה (4 מלצרים)',
        qty: 4,
        unitPrice: 35000,
        lineTotal: 140000
      }
    ],
    pricing: {
      discountType: 'PERCENT',
      discountValue: 5,
      vatPercent: 18,
      pricesIncludeVat: false,
      depositPercent: 30,
      paymentTerms: 'TRANSFER',
      validUntil: '2026-10-25'
    },
    totals: {
      subtotal: 1400000,
      discount: 70000,
      vat: 239400,
      total: 1569400,
      deposit: 470820,
      paid: 500000,
      balance: 1069400,
      perGuest: 13078
    },
    allowedTransitions: ['READY', 'CANCELLED'],
    isLocked: false,
    latestQuoteVersion: 2,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-12T14:30:00.000Z',
    createdBy: { id: 'usr-1', name: 'מנהל מערכת' }
  },
  {
    id: 'order-102',
    number: 1046,
    status: 'CONFIRMED',
    version: 2,
    customer: { id: 'cust-2', name: 'הייטק סולושנס בע"מ', phone: '0541234567' },
    event: {
      id: 'ev-102',
      title: 'הרמת כוסית חברה',
      type: 'CORPORATE',
      startsAt: '2026-10-16T18:00:00.000Z',
      address: 'התדהר 4, רעננה קומה 5',
      lat: 32.18,
      lng: 34.87,
      guests: 80,
      kashrut: 'DAIRY',
      serviceType: 'DELIVERY',
      notes: 'קוד כניסה לבניין 1234'
    },
    items: [
      {
        id: 'item-4',
        dishId: 'dish-6',
        dishName: 'פסטה שמנת פטריות',
        category: 'MAIN',
        unit: 'PORTION',
        qty: 80,
        unitPrice: 4800,
        priceOverridden: false,
        lineTotal: 384000,
        notes: null
      }
    ],
    services: [],
    pricing: {
      discountType: 'NONE',
      discountValue: 0,
      vatPercent: 18,
      pricesIncludeVat: false,
      depositPercent: 50,
      paymentTerms: 'NET_30',
      validUntil: '2026-10-20'
    },
    totals: {
      subtotal: 384000,
      discount: 0,
      vat: 69120,
      total: 453120,
      deposit: 226560,
      paid: 0,
      balance: 453120,
      perGuest: 5664
    },
    allowedTransitions: ['IN_PRODUCTION', 'CANCELLED'],
    isLocked: false,
    latestQuoteVersion: 1,
    createdAt: '2026-10-05T12:00:00.000Z',
    updatedAt: '2026-10-10T16:00:00.000Z',
    createdBy: { id: 'usr-2', name: 'שרה משרד' }
  },
  {
    id: 'order-103',
    number: 1047,
    status: 'DRAFT',
    version: 1,
    customer: { id: 'cust-3', name: 'ישראל ישראלי', phone: '0509876543' },
    event: {
      id: 'ev-103',
      title: 'ברית מילה — איתמר',
      type: 'BRIT',
      startsAt: '2026-10-20T11:30:00.000Z',
      address: 'בית כנסת אוהל מועד, פתח תקווה',
      lat: 32.09,
      lng: 34.88,
      guests: 60,
      kashrut: 'MEAT',
      serviceType: 'DELIVERY_AND_SERVING',
      notes: ''
    },
    items: [],
    services: [],
    pricing: {
      discountType: 'NONE',
      discountValue: 0,
      vatPercent: 18,
      pricesIncludeVat: false,
      depositPercent: 30,
      paymentTerms: 'CASH',
      validUntil: '2026-10-18'
    },
    totals: {
      subtotal: 0,
      discount: 0,
      vat: 0,
      total: 0,
      deposit: 0,
      paid: 0,
      balance: 0,
      perGuest: 0
    },
    allowedTransitions: ['QUOTE_SENT', 'CANCELLED'],
    isLocked: false,
    latestQuoteVersion: null,
    createdAt: '2026-10-12T09:00:00.000Z',
    updatedAt: '2026-10-12T09:00:00.000Z',
    createdBy: { id: 'usr-2', name: 'שרה משרד' }
  },
  {
    id: 'order-104',
    number: 1048,
    status: 'QUOTE_SENT',
    version: 1,
    customer: { id: 'cust-1', name: 'משפחת כהן', phone: '0527654321' },
    event: {
      id: 'ev-104',
      title: 'שבת חתן — אליהו',
      type: 'SHABBAT',
      startsAt: '2026-10-24T17:00:00.000Z',
      address: 'מלון ענבל, ירושלים',
      lat: 31.77,
      lng: 35.22,
      guests: 150,
      kashrut: 'MEAT',
      serviceType: 'DELIVERY',
      notes: 'ערב שבת + שבת בבוקר'
    },
    items: [
      {
        id: 'item-5',
        dishId: 'dish-2',
        dishName: 'סטייק פרגית במרינדה',
        category: 'MAIN',
        unit: 'PORTION',
        qty: 150,
        unitPrice: 5500,
        priceOverridden: false,
        lineTotal: 825000,
        notes: null
      }
    ],
    services: [],
    pricing: {
      discountType: 'NONE',
      discountValue: 0,
      vatPercent: 18,
      pricesIncludeVat: false,
      depositPercent: 30,
      paymentTerms: 'TRANSFER',
      validUntil: '2026-10-22'
    },
    totals: {
      subtotal: 825000,
      discount: 0,
      vat: 148500,
      total: 973500,
      deposit: 292050,
      paid: 0,
      balance: 973500,
      perGuest: 6490
    },
    allowedTransitions: ['CONFIRMED', 'LOST', 'CANCELLED'],
    isLocked: false,
    latestQuoteVersion: 1,
    createdAt: '2026-10-11T14:00:00.000Z',
    updatedAt: '2026-10-11T14:30:00.000Z',
    createdBy: { id: 'usr-1', name: 'מנהל מערכת' }
  }
];

export const mockOrderListItems: OrderListItem[] = mockOrders.map(o => ({
  id: o.id,
  number: o.number,
  status: o.status,
  customerName: o.customer.name,
  eventStartsAt: o.event.startsAt,
  guests: o.event.guests,
  total: o.totals.total,
  paid: o.totals.paid,
  balance: o.totals.balance,
  driverName: o.number === 1045 ? 'יוסי נהג' : null,
  createdByName: o.createdBy.name
}));

export const mockPublicQuote: PublicQuote = {
  token: 'quote-tok-12345',
  business: {
    name: 'קייטרינג שף גורמה',
    logoUrl: null,
    phone: '03-5551234',
    email: 'info@chefgourmet.co.il',
    address: 'דרך השלום 10, תל אביב'
  },
  event: mockOrders[0]!.event,
  items: mockOrders[0]!.items,
  services: mockOrders[0]!.services,
  totals: mockOrders[0]!.totals,
  validUntil: mockOrders[0]!.pricing.validUntil,
  status: 'PENDING_APPROVAL',
  terms: 'תנאי תשלום: מקדמה 30% עם אישור ההצעה. היתרה עד 3 ימי עסקים לפני מועד האירוע. ביטול עד 7 ימים מראש ללא דמי ביטול.'
};

