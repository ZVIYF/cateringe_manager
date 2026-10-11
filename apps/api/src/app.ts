import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { requestIdMiddleware } from './lib/requestId';
import { AppError } from './lib/errors';
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { dishesRouter } from './modules/dishes/dishes.routes';
import { ordersRouter } from './modules/orders/orders.routes';
import { publicQuotesRouter } from './modules/publicQuotes/publicQuotes.routes';
import { paymentsRouter } from './modules/payments/payments.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { reportsRouter } from './modules/reports/reports.routes';
import { ingredientsRouter, inventoryRouter } from './modules/inventory/inventory.routes';
import { suppliersRouter, purchaseOrdersRouter } from './modules/purchasing/purchasing.routes';
import { kitchenRouter } from './modules/kitchen/kitchen.routes';

export function createApp(): Express {
  const app = express();

  // ── Security & parsing middleware ────────────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: process.env['WEB_ORIGIN'] ?? 'http://localhost:5173',
      credentials: true,  // needed for httpOnly cookie (refresh token)
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(requestIdMiddleware);

  // ── Routes ───────────────────────────────────────────────────────────────────
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/dishes', dishesRouter);
  app.use('/api/v1/orders', ordersRouter);
  app.use('/api/v1/public/quotes', publicQuotesRouter);
  app.use('/api/v1/payments', paymentsRouter);
  app.use('/api/v1/dashboard', dashboardRouter);
  app.use('/api/v1/reports', reportsRouter);
  app.use('/api/v1/ingredients', ingredientsRouter);
  app.use('/api/v1/inventory', inventoryRouter);
  app.use('/api/v1/suppliers', suppliersRouter);
  app.use('/api/v1/purchase-orders', purchaseOrdersRouter);
  app.use('/api/v1/kitchen', kitchenRouter);

  // Health check — used by Docker / CI
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── 404 handler ──────────────────────────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'הנתיב לא נמצא',
        requestId: (_req as Request & { requestId: string }).requestId ?? 'unknown',
      },
    });
  });

  // ── Global error handler ─────────────────────────────────────────────────────
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const requestId = (req as Request & { requestId?: string }).requestId ?? 'unknown';

    if (err instanceof AppError) {
      res.status(err.status).json({
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
          requestId,
        },
      });
      return;
    }

    // Unexpected errors — log and return generic 500
    console.error('[INTERNAL_ERROR]', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'אירעה שגיאה פנימית בשרת',
        requestId,
      },
    });
  });

  return app;
}

