import { authHandlers } from './auth';
import { dashboardHandlers } from './dashboard';
import { ordersHandlers } from './orders';
import { customersHandlers } from './customers';
import { dishesHandlers } from './dishes';
import { inventoryHandlers } from './inventory';
import { paymentsHandlers } from './payments';
import { purchasingHandlers } from './purchasing';
import { kitchenHandlers } from './kitchen';
import { deliveriesHandlers } from './deliveries';
import { reportsHandlers } from './reports';
import { settingsHandlers } from './settings';

const modules = {
  auth: authHandlers,
  dashboard: dashboardHandlers,
  orders: ordersHandlers,
  customers: customersHandlers,
  dishes: dishesHandlers,
  inventory: inventoryHandlers,
  payments: paymentsHandlers,
  purchasing: purchasingHandlers,
  kitchen: kitchenHandlers,
  deliveries: deliveriesHandlers,
  reports: reportsHandlers,
  settings: settingsHandlers
};

/** `VITE_MOCK_MODULES` limits mocking to the listed modules; empty = all. */
export function getHandlers(only = import.meta.env.VITE_MOCK_MODULES as string | undefined) {
  const wanted = only?.split(',').map((m) => m.trim()).filter(Boolean) ?? [];
  return Object.entries(modules)
    .filter(([name]) => wanted.length === 0 || wanted.includes(name))
    .flatMap(([, handlers]) => handlers);
}
