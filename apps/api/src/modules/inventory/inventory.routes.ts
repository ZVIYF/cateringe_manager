import { Router, type IRouter } from 'express';
import { InventoryKitchenSchemas } from '@catering/shared';
import { requireAuth, requireRole } from '../../lib/auth';
import { validate } from '../../lib/validate';
import * as controller from './inventory.controller';

/**
 * Ingredients routes (§5.5)
 * Mounted at /api/v1/ingredients in app.ts
 */
export const ingredientsRouter: IRouter = Router();

ingredientsRouter.use(requireAuth);
ingredientsRouter.use(requireRole('ADMIN', 'KITCHEN_MANAGER'));

ingredientsRouter.get('/', controller.getIngredients);
ingredientsRouter.post(
  '/',
  validate('body', InventoryKitchenSchemas.IngredientCreate),
  controller.createIngredient
);
ingredientsRouter.get('/:id', controller.getIngredientById);
ingredientsRouter.patch(
  '/:id',
  validate('body', InventoryKitchenSchemas.IngredientUpdate),
  controller.updateIngredient
);

/**
 * Inventory forecasting & stock moves routes (§5.5)
 * Mounted at /api/v1/inventory in app.ts
 */
export const inventoryRouter: IRouter = Router();

inventoryRouter.use(requireAuth);
inventoryRouter.use(requireRole('ADMIN', 'KITCHEN_MANAGER'));

inventoryRouter.get(
  '/forecast',
  validate('query', InventoryKitchenSchemas.InventoryForecastQuery),
  controller.getInventoryForecast
);

inventoryRouter.get('/moves', controller.getStockMoves);
inventoryRouter.post(
  '/moves',
  validate('body', InventoryKitchenSchemas.CreateStockMoveBody),
  controller.createStockMove
);
