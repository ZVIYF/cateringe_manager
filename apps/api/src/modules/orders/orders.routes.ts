import { Router, type IRouter } from 'express';
import { OrderSchemas } from '@catering/shared';
import { requireAuth, requireRole } from '../../lib/auth';
import { validate } from '../../lib/validate';
import * as controller from './orders.controller';

/**
 * Orders management routes
 * Mounted at /api/v1/orders in app.ts
 */
export const ordersRouter: IRouter = Router();

// Global auth requirement
ordersRouter.use(requireAuth);

// GET /orders - accessible by ADMIN and OFFICE
ordersRouter.get(
  '/',
  requireRole('ADMIN', 'OFFICE'),
  validate('query', OrderSchemas.OrdersListQuery),
  controller.getOrders
);

// POST /orders - accessible by ADMIN and OFFICE
ordersRouter.post(
  '/',
  requireRole('ADMIN', 'OFFICE'),
  validate('body', OrderSchemas.CreateOrderBody),
  controller.createOrder
);

// GET /orders/:id - accessible by ADMIN, OFFICE, and KITCHEN_MANAGER (view)
ordersRouter.get(
  '/:id',
  requireRole('ADMIN', 'OFFICE', 'KITCHEN_MANAGER'),
  controller.getOrderById
);

// PATCH /orders/:id - accessible by ADMIN and OFFICE
ordersRouter.patch(
  '/:id',
  requireRole('ADMIN', 'OFFICE'),
  validate('body', OrderSchemas.UpdateOrderBody),
  controller.updateOrder
);

// PUT /orders/:id/items - accessible by ADMIN and OFFICE
ordersRouter.put(
  '/:id/items',
  requireRole('ADMIN', 'OFFICE'),
  validate('body', OrderSchemas.PutItemsBody),
  controller.updateOrderItems
);
