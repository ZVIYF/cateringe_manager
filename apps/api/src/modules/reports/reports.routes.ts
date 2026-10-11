import { Router, type IRouter } from 'express';
import { requireAuth, requireRole } from '../../lib/auth';
import * as controller from './reports.controller';

/**
 * Reports routes (§5.9)
 * Mounted at /api/v1/reports in app.ts
 * Restricted to ADMIN role.
 */
export const reportsRouter: IRouter = Router();

reportsRouter.use(requireAuth);
reportsRouter.use(requireRole('ADMIN'));

// GET /reports/revenue
reportsRouter.get('/revenue', controller.getRevenueReport);

// GET /reports/profitability
reportsRouter.get('/profitability', controller.getProfitabilityReport);

// GET /reports/top-dishes
reportsRouter.get('/top-dishes', controller.getTopDishesReport);

// GET /reports/conversion
reportsRouter.get('/conversion', controller.getConversionReport);
