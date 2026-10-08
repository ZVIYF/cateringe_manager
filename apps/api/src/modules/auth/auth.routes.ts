import { Router, type IRouter } from 'express';
import { AuthSchemas } from '@catering/shared';
import { requireAuth } from '../../lib/auth';
import { validate } from '../../lib/validate';
import * as controller from './auth.controller';

/**
 * Auth routes — all endpoints from §2.2 of API_CONTRACT.md
 * Mounted at /api/v1/auth in app.ts
 */
export const authRouter: IRouter = Router();

// Public endpoints
authRouter.post(
  '/login',
  validate('body', AuthSchemas.LoginBody),
  controller.login
);

authRouter.post('/refresh', controller.refresh);

authRouter.post(
  '/forgot-password',
  validate('body', AuthSchemas.ForgotPasswordBody),
  controller.forgotPassword
);

authRouter.post(
  '/reset-password',
  validate('body', AuthSchemas.ResetPasswordBody),
  controller.resetPassword
);

// Protected endpoints
authRouter.post('/logout', requireAuth, controller.logout);
authRouter.get('/me', requireAuth, controller.me);

