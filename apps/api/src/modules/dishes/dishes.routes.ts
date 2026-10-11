import { Router, type IRouter } from 'express';
import { DishSchemas } from '@catering/shared';
import { requireAuth, requireRole } from '../../lib/auth';
import { validate } from '../../lib/validate';
import * as controller from './dishes.controller';

/**
 * Dishes routes
 * Mounted at /api/v1/dishes in app.ts
 */
export const dishesRouter: IRouter = Router();

// All dish endpoints require authentication and ADMIN or KITCHEN_MANAGER role
dishesRouter.use(requireAuth, requireRole('ADMIN', 'KITCHEN_MANAGER'));

dishesRouter.get(
  '/',
  validate('query', DishSchemas.DishListQuery),
  controller.getDishes
);

dishesRouter.post(
  '/',
  validate('body', DishSchemas.DishCreate),
  controller.createDish
);

dishesRouter.get(
  '/:id',
  controller.getDishById
);

dishesRouter.patch(
  '/:id',
  validate('body', DishSchemas.DishUpdate),
  controller.updateDish
);

dishesRouter.delete(
  '/:id',
  controller.deleteDish
);
