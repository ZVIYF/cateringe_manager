import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { requestIdMiddleware } from './lib/requestId';
import { AppError } from './lib/errors';
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

