import { Router, type IRouter } from 'express';
import { UserSchemas, ListQuery } from '@catering/shared';
import { requireAuth, requireRole } from '../../lib/auth';
import { validate } from '../../lib/validate';
import * as controller from './users.controller';

/**
 * Users management routes
 * Mounted at /api/v1/users in app.ts
 */
export const usersRouter: IRouter = Router();

// Protect all user management routes with ADMIN role
usersRouter.use(requireAuth, requireRole('ADMIN'));

usersRouter.get(
  '/',
  validate('query', ListQuery),
  controller.getUsers
);

usersRouter.post(
  '/',
  validate('body', UserSchemas.CreateUserBody),
  controller.createUser
);

usersRouter.patch(
  '/:id',
  validate('body', UserSchemas.UpdateUserBody),
  controller.updateUser
);

usersRouter.post(
  '/:id/reset-password',
  controller.resetPassword
);

