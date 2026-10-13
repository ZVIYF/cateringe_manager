import type { StockMove, InventoryForecastItem } from '@catering/shared';
import { mockIngredients } from './ingredients';

export { mockIngredients };

export const mockStockMoves: StockMove[] = [
  {
    id: 'sm-1',
    ingredientId: 'ing-1',
    ingredientName: 'פרגית טרייה',
    type: 'IN',
    qty: 25,
    reason: 'קבלת סחורה מהזמנת רכש #5000',
    createdAt: '2026-10-12T08:30:00.000Z',
    createdById: 'usr-1',
    createdByName: 'מנהל מטבח'
  },
  {
    id: 'sm-2',
    ingredientId: 'ing-2',
    ingredientName: 'בשר אסאדו מובחר',
    type: 'OUT',
    qty: 12,
    reason: 'משיכה לייצור הזמנה #1045',
    createdAt: '2026-10-12T10:15:00.000Z',
    createdById: 'usr-2',
    createdByName: 'שף תפעול'
  },
  {
    id: 'sm-3',
    ingredientId: 'ing-3',
    ingredientName: 'תפוחי אדמה',
    type: 'ADJUST',
    qty: 5,
    reason: 'ספירת מלאי שבועית - התאמת יתרה',
    createdAt: '2026-10-11T16:00:00.000Z',
    createdById: 'usr-1',
    createdByName: 'מנהל מטבח'
  },
  {
    id: 'sm-4',
    ingredientId: 'ing-5',
    ingredientName: 'רוזמרין טרי',
    type: 'WASTE',
    qty: 1.5,
    reason: 'פחת בלאי וקלקול במקרר תבלינים',
    createdAt: '2026-10-10T14:20:00.000Z',
    createdById: 'usr-2',
    createdByName: 'שף תפעול'
  }
];

export const mockForecastItems: InventoryForecastItem[] = [
  {
    ingredientId: 'ing-1',
    name: 'פרגית טרייה',
    unit: 'ק"ג',
    stock: 45,
    minStock: 20,
    required: 85,
    incoming: 50,
    shortage: 0,
    supplier: { id: 'sup-1', name: 'עוף ירושלים' }
  },
  {
    ingredientId: 'ing-2',
    name: 'בשר אסאדו מובחר',
    unit: 'ק"ג',
    stock: 30,
    minStock: 15,
    required: 60,
    incoming: 25,
    shortage: 5,
    supplier: { id: 'sup-1', name: 'עוף ירושלים' }
  },
  {
    ingredientId: 'ing-5',
    name: 'רוזמרין טרי',
    unit: 'ק"ג',
    stock: 5,
    minStock: 2,
    required: 8,
    incoming: 0,
    shortage: 3,
    supplier: { id: 'sup-2', name: 'ירקות הדרום' }
  },
  {
    ingredientId: 'ing-7',
    name: 'פטריות שמפיניון טריות',
    unit: 'ק"ג',
    stock: 18,
    minStock: 8,
    required: 30,
    incoming: 15,
    shortage: 0,
    supplier: { id: 'sup-2', name: 'ירקות הדרום' }
  },
  {
    ingredientId: 'ing-8',
    name: 'שמנת לבישול 38%',
    unit: 'ליטר',
    stock: 35,
    minStock: 12,
    required: 55,
    incoming: 0,
    shortage: 20,
    supplier: { id: 'sup-5', name: 'תנובה שף' }
  }
];
