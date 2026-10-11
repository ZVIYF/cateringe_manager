import { Router, type IRouter } from 'express';
import { requireAuth, requireRole } from '../../lib/auth';
import * as controller from './dashboard.controller';

/**
 * Dashboard routes (§5.9)
 * Mounted at /api/v1/dashboard in app.ts
 */
export const dashboardRouter: IRouter = Router();

dashboardRouter.use(requireAuth);

// GET /dashboard - accessible by ADMIN and OFFICE (data filtered for OFFICE)
dashboardRouter.get(
  '/',
  requireRole('ADMIN', 'OFFICE'),
  controller.getDashboard
);
