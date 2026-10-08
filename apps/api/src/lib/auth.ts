import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { Role } from '@catering/shared';
import { unauthenticated, tokenExpired, forbidden } from './errors';

export interface JwtPayload {
  sub: string;   // user id
  email: string;
  role: Role;
  name: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload & { iat: number; exp: number };
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
    req.user = jwt.verify(token, secret) as JwtPayload & { iat: number; exp: number };
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

export function generateTokens(payload: JwtPayload, rememberMe: boolean = false) {
  const accessSecret = process.env['JWT_ACCESS_SECRET'];
  const refreshSecret = process.env['JWT_REFRESH_SECRET'];

  if (!accessSecret || !refreshSecret) {
    throw new Error('JWT secrets not configured');
  }

  const accessToken = jwt.sign(payload, accessSecret, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: rememberMe ? '30d' : '7d' });

  return { accessToken, refreshToken };
}

export function setRefreshTokenCookie(res: Response, token: string, rememberMe: boolean = false) {
  const maxAge = (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000; // in milliseconds
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge,
  });
}

export function clearRefreshTokenCookie(res: Response) {
  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
}

