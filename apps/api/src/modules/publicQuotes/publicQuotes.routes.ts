import { Router, type IRouter } from 'express';
import { PublicQuoteSchemas } from '@catering/shared';
import { validate } from '../../lib/validate';
import * as controller from './publicQuotes.controller';

/**
 * Public Quote Portal routes (§5.3)
 * Mounted at /api/v1/public/quotes in app.ts
 * NO authentication required (public customer access).
 */
export const publicQuotesRouter: IRouter = Router();

publicQuotesRouter.get(
  '/:token',
  controller.getPublicQuote
);

publicQuotesRouter.post(
  '/:token/approve',
  validate('body', PublicQuoteSchemas.ApproveQuoteBody),
  controller.approvePublicQuote
);

publicQuotesRouter.post(
  '/:token/request-change',
  validate('body', PublicQuoteSchemas.RequestChangeBody),
  controller.requestQuoteChange
);

publicQuotesRouter.get(
  '/:token/pdf',
  controller.getQuotePdf
);
