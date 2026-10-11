import { Router, type IRouter } from 'express';
import { requireAuth, requireRole } from '../../lib/auth';
import * as controller from './jobs.controller';

export const jobsRouter: IRouter = Router();

jobsRouter.use(requireAuth);
jobsRouter.use(requireRole('ADMIN'));

// POST /jobs/reminders/trigger
jobsRouter.post('/reminders/trigger', controller.triggerReminders);

// GET /jobs/status
jobsRouter.get('/status', controller.getJobsStatus);

