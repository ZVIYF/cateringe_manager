import { Router, type IRouter } from 'express';
import { PublicQuoteSchemas } from '@catering/shared';
import { requireAuth, requireRole } from '../../lib/auth';
import { validate } from '../../lib/validate';
import * as controller from './payments.controller';

/**
 * Payments & Invoices routes (§5.8)
 * Mounted at /api/v1/payments in app.ts
 * Protected by requireAuth and RBAC.
 */
export const paymentsRouter: IRouter = Router();

paymentsRouter.use(requireAuth);

// GET /payments - ADMIN, OFFICE
paymentsRouter.get(
  '/',
  requireRole('ADMIN', 'OFFICE'),
  controller.getPayments
);

// POST /payments - ADMIN, OFFICE
paymentsRouter.post(
  '/',
  requireRole('ADMIN', 'OFFICE'),
  validate('body', PublicQuoteSchemas.CreatePaymentBody),
  controller.createPayment
);

// POST /payments/link - ADMIN, OFFICE
paymentsRouter.post(
  '/link',
  requireRole('ADMIN', 'OFFICE'),
  validate('body', PublicQuoteSchemas.CreatePaymentLinkBody),
  controller.createPaymentLink
);

// GET /payments/open-balances - ADMIN, OFFICE
paymentsRouter.get(
  '/open-balances',
  requireRole('ADMIN', 'OFFICE'),
  controller.getOpenBalances
);

// POST /payments/:id/refund - ADMIN only
paymentsRouter.post(
  '/:id/refund',
  requireRole('ADMIN'),
  validate('body', PublicQuoteSchemas.RefundPaymentBody),
  controller.refundPayment
);
