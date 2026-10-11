import { Router, type IRouter } from 'express';
import { InventoryKitchenSchemas } from '@catering/shared';
import { requireAuth, requireRole } from '../../lib/auth';
import { validate } from '../../lib/validate';
import * as controller from './kitchen.controller';

/**
 * Kitchen display & production routes (§5.6)
 * Mounted at /api/v1/kitchen in app.ts
 */
export const kitchenRouter: IRouter = Router();

kitchenRouter.use(requireAuth);

// GET /kitchen/tasks?date=YYYY-MM-DD
// Accessible by ADMIN, KITCHEN_MANAGER, and KITCHEN_STAFF (staff sees only their own/unassigned)
kitchenRouter.get(
  '/tasks',
  requireRole('ADMIN', 'KITCHEN_MANAGER', 'KITCHEN_STAFF'),
  validate('query', InventoryKitchenSchemas.KitchenTasksQuery),
  controller.getKitchenTasks
);

// PATCH /kitchen/tasks/:id
// Accessible by ADMIN, KITCHEN_MANAGER, and KITCHEN_STAFF (staff can only update status)
kitchenRouter.patch(
  '/tasks/:id',
  requireRole('ADMIN', 'KITCHEN_MANAGER', 'KITCHEN_STAFF'),
  validate('body', InventoryKitchenSchemas.KitchenTaskUpdate),
  controller.updateKitchenTask
);

// GET /kitchen/production-sheet?date=YYYY-MM-DD
// Accessible by ADMIN, KITCHEN_MANAGER
kitchenRouter.get(
  '/production-sheet',
  requireRole('ADMIN', 'KITCHEN_MANAGER'),
  validate('query', InventoryKitchenSchemas.ProductionSheetQuery),
  controller.getProductionSheet
);

// GET /kitchen/updates?date=&since=
// Accessible by ADMIN, KITCHEN_MANAGER, and KITCHEN_STAFF
kitchenRouter.get(
  '/updates',
  requireRole('ADMIN', 'KITCHEN_MANAGER', 'KITCHEN_STAFF'),
  validate('query', InventoryKitchenSchemas.KitchenUpdatesQuery),
  controller.getKitchenUpdates
);
