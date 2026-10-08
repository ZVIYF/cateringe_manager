import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { Role } from '@catering/shared';
import { unauthenticated, tokenExpired, forbidden } from './errors';

interface JwtPayload {
  sub: string;   // user id
  email: string;
  role: Role;
  iat: number;
  exp: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}

/**
 * Verifies the Bearer JWT and attaches `req.user`.
 * Returns 401 UNAUTHENTICATED if missing, 401 TOKEN_EXPIRED if expired.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) return next(unauthenticated());

  try {
    const secret = process.env['JWT_ACCESS_SECRET'];
    if (!secret) throw new Error('JWT_ACCESS_SECRET not configured');
    req.user = jwt.verify(token, secret) as JwtPayload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) return next(tokenExpired());
    next(unauthenticated());
  }
}

/**
 * Role-based access control guard. Must be used after requireAuth.
 * Usage: requireRole('ADMIN', 'OFFICE')
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(unauthenticated());
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  };
}

