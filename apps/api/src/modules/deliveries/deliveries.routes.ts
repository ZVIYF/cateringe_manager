import { Router, type IRouter } from 'express';
import { DeliverySchemas } from '@catering/shared';
import { requireAuth, requireRole } from '../../lib/auth';
import { validate } from '../../lib/validate';
import * as controller from './deliveries.controller';

/**
 * Deliveries router - mounted at /api/v1/deliveries
 */
export const deliveriesRouter: IRouter = Router();

deliveriesRouter.use(requireAuth);

// GET /deliveries?date=YYYY-MM-DD
deliveriesRouter.get(
  '/',
  requireRole('ADMIN', 'OFFICE'),
  validate('query', DeliverySchemas.DeliveriesQuery),
  controller.getDeliveries
);

// POST /deliveries (manual creation)
deliveriesRouter.post(
  '/',
  requireRole('ADMIN', 'OFFICE'),
  controller.createDelivery
);

// GET /deliveries/:id
deliveriesRouter.get(
  '/:id',
  requireRole('ADMIN', 'OFFICE', 'DRIVER'),
  controller.getDeliveryById
);

// PATCH /deliveries/:id
deliveriesRouter.patch(
  '/:id',
  requireRole('ADMIN', 'OFFICE'),
  validate('body', DeliverySchemas.UpdateDeliveryBody),
  controller.updateDelivery
);

// POST /deliveries/:id/start
deliveriesRouter.post(
  '/:id/start',
  requireRole('DRIVER'),
  controller.startDelivery
);

// POST /deliveries/:id/complete
deliveriesRouter.post(
  '/:id/complete',
  requireRole('DRIVER'),
  validate('body', DeliverySchemas.CompleteDeliveryBody),
  controller.completeDelivery
);

/**
 * Driver mobile router - mounted at /api/v1/driver
 */
export const driverRouter: IRouter = Router();

driverRouter.use(requireAuth);

// GET /driver/deliveries/today
driverRouter.get(
  '/deliveries/today',
  requireRole('DRIVER'),
  controller.getDriverDeliveriesToday
);

