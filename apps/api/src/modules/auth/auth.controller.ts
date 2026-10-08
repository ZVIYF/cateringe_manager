import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { generateTokens, setRefreshTokenCookie, clearRefreshTokenCookie, type JwtPayload } from '../../lib/auth';
import { unauthenticated } from '../../lib/errors';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) {
      return next(unauthenticated('אימייל או סיסמה שגויים'));
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return next(unauthenticated('אימייל או סיסמה שגויים'));
    }

    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    const { accessToken, refreshToken } = generateTokens(payload, rememberMe);

    setRefreshTokenCookie(res, refreshToken, rememberMe);

    res.json({
      data: {
        accessToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return next(unauthenticated());
    }

    const refreshSecret = process.env['JWT_REFRESH_SECRET'];
    if (!refreshSecret) throw new Error('JWT_REFRESH_SECRET not configured');

    let payload: JwtPayload;
    try {
      payload = jwt.verify(refreshToken, refreshSecret) as JwtPayload;
    } catch (err) {
      return next(unauthenticated('הטוקן פג תוקף או שגוי'));
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.active) {
      return next(unauthenticated('משתמש לא קיים או לא פעיל'));
    }

    // Refresh payload in case user details changed
    const newPayload: JwtPayload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    const accessSecret = process.env['JWT_ACCESS_SECRET'];
    if (!accessSecret) throw new Error('JWT_ACCESS_SECRET not configured');

    const accessToken = jwt.sign(newPayload, accessSecret, { expiresIn: '15m' });

    res.json({
      data: {
        accessToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      }
    });
  } catch (err) {
    next(err);
  }
}

export function logout(_req: Request, res: Response, next: NextFunction): void {
  try {
    clearRefreshTokenCookie(res);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      return next(unauthenticated());
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
    if (!user || !user.active) {
      return next(unauthenticated());
    }

    // Temporarily hardcode permissions until full RBAC implementation
    const permissions = user.role === 'ADMIN' ? ['*'] : [];

    res.json({
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        permissions
      }
    });
  } catch (err) {
    next(err);
  }
}

export function forgotPassword(_req: Request, res: Response, _next: NextFunction): void {
  // TODO(be/auth-impl): send reset email (always 204, never reveal existence)
  res.sendStatus(204);
}

export function resetPassword(_req: Request, res: Response, _next: NextFunction): void {
  // TODO(be/auth-impl): verify reset token, hash new password, clear token
  res.status(501).json({ error: { code: 'INTERNAL_ERROR', message: 'טרם מומש', requestId: (_req as any).requestId } });
}

