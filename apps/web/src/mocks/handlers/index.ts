import { authHandlers } from './auth';
import { dashboardHandlers } from './dashboard';
import { ordersHandlers } from './orders';
import { customersHandlers } from './customers';
import { dishesHandlers } from './dishes';
import { ingredientsHandlers } from './ingredients';
import { paymentsHandlers } from './payments';

const modules = {
  auth: authHandlers,
  dashboard: dashboardHandlers,
  orders: ordersHandlers,
  customers: customersHandlers,
  dishes: dishesHandlers,
  ingredients: ingredientsHandlers,
  payments: paymentsHandlers
};

/** `VITE_MOCK_MODULES` limits mocking to the listed modules; empty = all. */
export function getHandlers(only = import.meta.env.VITE_MOCK_MODULES as string | undefined) {
  const wanted = only?.split(',').map((m) => m.trim()).filter(Boolean) ?? [];
  return Object.entries(modules)
    .filter(([name]) => wanted.length === 0 || wanted.includes(name))
    .flatMap(([, handlers]) => handlers);
}
