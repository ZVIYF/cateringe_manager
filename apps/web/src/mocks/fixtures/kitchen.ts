import type { KitchenTask } from '@catering/shared';

const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

export const mockKitchenTasks: KitchenTask[] = [
  {
    id: 'kt-1',
    date: today,
    status: 'IN_PROGRESS',
    dish: {
      id: 'dish-1',
      name: 'סיגרים אסאדו',
      kashrut: 'MEAT'
    },
    qty: 60,
    unit: 'PORTION',
    earliestDepartureAt: `${today}T15:30:00.000Z`,
    assignee: {
      id: 'usr-3',
      name: 'יוסי כהן (טבח)'
    },
    orders: [
      { id: 'order-101', number: 1045, customerName: 'משפחת כהן', qty: 35 },
      { id: 'order-102', number: 1046, customerName: 'הייטק סולושנס בע"מ', qty: 25 }
    ],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'kt-2',
    date: today,
    status: 'TODO',
    dish: {
      id: 'dish-2',
      name: 'סטייק פרגית במרינדה',
      kashrut: 'MEAT'
    },
    qty: 80,
    unit: 'PORTION',
    earliestDepartureAt: `${today}T16:00:00.000Z`,
    assignee: null,
    orders: [
      { id: 'order-101', number: 1045, customerName: 'משפחת כהן', qty: 50 },
      { id: 'order-103', number: 1047, customerName: 'ישראל ישראלי', qty: 30 }
    ],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'kt-3',
    date: today,
    status: 'DONE',
    dish: {
      id: 'dish-3',
      name: 'תפוחי אדמה אפויים ברוזמרין',
      kashrut: 'PARVE'
    },
    qty: 100,
    unit: 'PORTION',
    earliestDepartureAt: `${today}T15:30:00.000Z`,
    assignee: {
      id: 'usr-4',
      name: 'אבי סרוסי (עוזר טבח)'
    },
    orders: [
      { id: 'order-101', number: 1045, customerName: 'משפחת כהן', qty: 60 },
      { id: 'order-102', number: 1046, customerName: 'הייטק סולושנס בע"מ', qty: 40 }
    ],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'kt-4',
    date: today,
    status: 'PACKED',
    dish: {
      id: 'dish-4',
      name: 'סלט שוק רענן עם שקדים',
      kashrut: 'PARVE'
    },
    qty: 50,
    unit: 'PORTION',
    earliestDepartureAt: `${today}T15:00:00.000Z`,
    assignee: {
      id: 'usr-4',
      name: 'אבי סרוסי (עוזר טבח)'
    },
    orders: [
      { id: 'order-101', number: 1045, customerName: 'משפחת כהן', qty: 50 }
    ],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'kt-5',
    date: tomorrow,
    status: 'TODO',
    dish: {
      id: 'dish-8',
      name: 'פסטה שמנת ופטריות',
      kashrut: 'DAIRY'
    },
    qty: 40,
    unit: 'PORTION',
    earliestDepartureAt: `${tomorrow}T12:00:00.000Z`,
    assignee: null,
    orders: [
      { id: 'order-104', number: 1048, customerName: 'אירוע בר מצווה', qty: 40 }
    ],
    updatedAt: new Date().toISOString()
  }
];
