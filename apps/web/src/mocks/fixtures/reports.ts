import type {
  RevenueReportItem,
  ProfitabilityReportItem,
  TopDishReportItem,
  ConversionReport
} from '@catering/shared';

export const mockRevenueReport: RevenueReportItem[] = [
  { period: '2026-05', revenue: 14500000, ordersCount: 18, prevYearRevenue: 12000000 },
  { period: '2026-06', revenue: 18200000, ordersCount: 22, prevYearRevenue: 14000000 },
  { period: '2026-07', revenue: 21500000, ordersCount: 26, prevYearRevenue: 17500000 },
  { period: '2026-08', revenue: 19800000, ordersCount: 24, prevYearRevenue: 16200000 },
  { period: '2026-09', revenue: 24500000, ordersCount: 29, prevYearRevenue: 19800000 },
  { period: '2026-10', revenue: 22000000, ordersCount: 25, prevYearRevenue: 18000000 }
];

export const mockProfitabilityReport: ProfitabilityReportItem[] = [
  {
    orderId: 'order-101',
    number: 1045,
    customerName: 'משפחת כהן',
    revenue: 1250000,
    ingredientCost: 430000,
    grossProfit: 820000,
    marginPercent: 65.6
  },
  {
    orderId: 'order-102',
    number: 1046,
    customerName: 'הייטק סולושנס בע"מ',
    revenue: 2800000,
    ingredientCost: 950000,
    grossProfit: 1850000,
    marginPercent: 66.1
  },
  {
    orderId: 'order-103',
    number: 1047,
    customerName: 'ישראל ישראלי',
    revenue: 650000,
    ingredientCost: 240000,
    grossProfit: 410000,
    marginPercent: 63.1
  },
  {
    orderId: 'order-104',
    number: 1048,
    customerName: 'מרכז רפואי מדיקל',
    revenue: 1950000,
    ingredientCost: 620000,
    grossProfit: 1330000,
    marginPercent: 68.2
  }
];

export const mockTopDishesReport: TopDishReportItem[] = [
  {
    dishId: 'dish-1',
    name: 'סיגרים אסאדו מובחר',
    qty: 450,
    revenue: 2700000,
    profit: 1750000
  },
  {
    dishId: 'dish-2',
    name: 'סטייק פרגית במרינדה',
    qty: 380,
    revenue: 3040000,
    profit: 1900000
  },
  {
    dishId: 'dish-3',
    name: 'תפוחי אדמה אפויים ברוזמרין',
    qty: 520,
    revenue: 1040000,
    profit: 780000
  },
  {
    dishId: 'dish-4',
    name: 'סלמון נורווגי צרוב',
    qty: 210,
    revenue: 2520000,
    profit: 1470000
  }
];

export const mockConversionReport: ConversionReport = {
  quotesSent: 48,
  quotesApproved: 33,
  rate: 68.75
};

