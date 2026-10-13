import type { PaymentListItem, OpenBalanceItem } from '@catering/shared';

export const mockPayments: PaymentListItem[] = [
  {
    id: 'pay-1',
    orderId: 'order-101',
    orderNumber: 1045,
    customerName: 'משפחת כהן',
    amount: 500000,
    method: 'CREDIT_CARD',
    status: 'SUCCEEDED',
    reference: 'AUTH-9921',
    receiptUrl: 'https://example.com/receipts/rec-1045-1.pdf',
    createdAt: '2026-10-02T11:15:00.000Z'
  },
  {
    id: 'pay-2',
    orderId: 'order-102',
    orderNumber: 1046,
    customerName: 'הייטק סולושנס בע"מ',
    amount: 1500000,
    method: 'TRANSFER',
    status: 'SUCCEEDED',
    reference: 'HAAVARA-44810',
    receiptUrl: 'https://example.com/receipts/rec-1046-1.pdf',
    createdAt: '2026-10-05T14:20:00.000Z'
  },
  {
    id: 'pay-3',
    orderId: 'order-102',
    orderNumber: 1046,
    customerName: 'הייטק סולושנס בע"מ',
    amount: 500000,
    method: 'CHECK',
    status: 'SUCCEEDED',
    reference: 'CHK-0012984',
    receiptUrl: null,
    createdAt: '2026-10-10T09:00:00.000Z'
  },
  {
    id: 'pay-4',
    orderId: 'order-103',
    orderNumber: 1047,
    customerName: 'ישראל ישראלי',
    amount: 600000,
    method: 'CASH',
    status: 'SUCCEEDED',
    reference: 'CASH-REC-771',
    receiptUrl: 'https://example.com/receipts/rec-1047-1.pdf',
    createdAt: '2026-10-12T16:45:00.000Z'
  }
];

export const mockOpenBalances: OpenBalanceItem[] = [
  {
    orderId: 'order-101',
    orderNumber: 1045,
    customerName: 'משפחת כהן',
    customerPhone: '0527654321',
    total: 1569400,
    paid: 500000,
    balance: 1069400,
    daysOverdue: 0
  },
  {
    orderId: 'order-102',
    orderNumber: 1046,
    customerName: 'הייטק סולושנס בע"מ',
    customerPhone: '0541234567',
    total: 2450000,
    paid: 2000000,
    balance: 450000,
    daysOverdue: 5
  },
  {
    orderId: 'order-103',
    orderNumber: 1047,
    customerName: 'ישראל ישראלי',
    customerPhone: '0509876543',
    total: 850000,
    paid: 600000,
    balance: 250000,
    daysOverdue: 12
  }
];

