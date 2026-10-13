import { DashboardSchemas } from '@catering/shared';

export const mockDashboardData: DashboardSchemas.DashboardData = {
  kpis: {
    eventsThisWeek: 12,
    pendingQuotes: 5,
    revenueThisMonth: 18450000,
    openBalances: 3720000,
  },
  upcoming: [
    {
      orderId: 'clo45',
      number: 1045,
      startsAt: '2026-10-15T15:00:00.000Z',
      customerName: 'משפחת כהן',
      guests: 120,
      status: 'IN_PRODUCTION',
      paymentState: 'DEPOSIT',
    },
    {
      orderId: 'clo46',
      number: 1046,
      startsAt: '2026-10-16T18:00:00.000Z',
      customerName: 'ישראל ישראלי',
      guests: 80,
      status: 'CONFIRMED',
      paymentState: 'PENDING',
    },
  ],
  alerts: [
    {
      type: 'LOW_STOCK',
      message: 'מלאי נמוך: שוק עוף (3 ק"ג)',
      link: '/inventory?ingredientId=cig7',
    },
    {
      type: 'NO_DRIVER',
      message: 'למשלוח הזמנה #1045 טרם שובץ נהג',
      link: '/deliveries',
    },
  ],
  revenueChart: [
    { month: '2026-05', revenue: 15200000 },
    { month: '2026-06', revenue: 16800000 },
    { month: '2026-07', revenue: 14100000 },
    { month: '2026-08', revenue: 19500000 },
    { month: '2026-09', revenue: 17300000 },
    { month: '2026-10', revenue: 18450000 },
  ],
};

export const mockCalendarOrders: DashboardSchemas.CalendarOrderItem[] = [
  {
    id: 'clo45',
    number: 1045,
    status: 'IN_PRODUCTION',
    customerName: 'משפחת כהן',
    startsAt: '2026-10-15T15:00:00.000Z',
    guests: 120,
    kashrut: 'MEAT',
  },
  {
    id: 'clo46',
    number: 1046,
    status: 'CONFIRMED',
    customerName: 'משפחת לוי',
    startsAt: '2026-10-16T11:00:00.000Z',
    guests: 50,
    kashrut: 'DAIRY',
  },
  {
    id: 'clo47',
    number: 1047,
    status: 'CONFIRMED',
    customerName: 'חברת הייטק בע"מ',
    startsAt: '2026-10-18T12:30:00.000Z',
    guests: 200,
    kashrut: 'PARVE',
  },
];

