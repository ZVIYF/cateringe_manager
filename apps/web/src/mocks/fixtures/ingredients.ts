import type { Ingredient } from '@catering/shared';

export const mockIngredients: Ingredient[] = [
  {
    id: 'ing-1',
    name: 'פרגית טרייה',
    category: 'בשר ועוף',
    unit: 'ק"ג',
    currentStock: 45,
    minStock: 20,
    costPerUnit: 3800, // 38 NIS/kg
    supplierId: 'sup-1',
    supplierName: 'עוף ירושלים'
  },
  {
    id: 'ing-2',
    name: 'בשר אסאדו מובחר',
    category: 'בשר ועוף',
    unit: 'ק"ג',
    currentStock: 30,
    minStock: 15,
    costPerUnit: 6500, // 65 NIS/kg
    supplierId: 'sup-1',
    supplierName: 'עוף ירושלים'
  },
  {
    id: 'ing-3',
    name: 'תפוחי אדמה',
    category: 'ירקות',
    unit: 'ק"ג',
    currentStock: 80,
    minStock: 25,
    costPerUnit: 450, // 4.5 NIS/kg
    supplierId: 'sup-2',
    supplierName: 'ירקות הדרום'
  },
  {
    id: 'ing-4',
    name: 'שמן זית כתית מעולה',
    category: 'שמנים ותבלינים',
    unit: 'ליטר',
    currentStock: 25,
    minStock: 10,
    costPerUnit: 4200, // 42 NIS/L
    supplierId: 'sup-3',
    supplierName: 'משק כרמל'
  },
  {
    id: 'ing-5',
    name: 'רוזמרין טרי',
    category: 'תבלינים ועשבי תיבול',
    unit: 'ק"ג',
    currentStock: 5,
    minStock: 2,
    costPerUnit: 2500, // 25 NIS/kg
    supplierId: 'sup-2',
    supplierName: 'ירקות הדרום'
  },
  {
    id: 'ing-6',
    name: 'עלי סיגר מרוקאי',
    category: 'יבשים וקפואים',
    unit: 'חבילה',
    currentStock: 40,
    minStock: 15,
    costPerUnit: 1200, // 12 NIS/pack
    supplierId: 'sup-4',
    supplierName: 'מעדני השף'
  },
  {
    id: 'ing-7',
    name: 'פטריות שמפיניון טריות',
    category: 'ירקות',
    unit: 'ק"ג',
    currentStock: 18,
    minStock: 8,
    costPerUnit: 2200, // 22 NIS/kg
    supplierId: 'sup-2',
    supplierName: 'ירקות הדרום'
  },
  {
    id: 'ing-8',
    name: 'שמנת לבישול 38%',
    category: 'מוצרי חלב',
    unit: 'ליטר',
    currentStock: 35,
    minStock: 12,
    costPerUnit: 1800, // 18 NIS/L
    supplierId: 'sup-5',
    supplierName: 'תנובה שף'
  },
  {
    id: 'ing-9',
    name: 'פסטה פנא איטלקית',
    category: 'יבשים',
    unit: 'ק"ג',
    currentStock: 50,
    minStock: 20,
    costPerUnit: 900, // 9 NIS/kg
    supplierId: 'sup-4',
    supplierName: 'מעדני השף'
  }
];

