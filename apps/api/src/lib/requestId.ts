import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

/**
 * Attaches a unique request ID to every incoming request.
 * Checks for an existing X-Request-Id header first (useful in tests / proxies).
 * The ID is exposed on req.requestId and echoed back in X-Request-Id response header.
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const id =
    (req.headers['x-request-id'] as string | undefined) ?? `req_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}

