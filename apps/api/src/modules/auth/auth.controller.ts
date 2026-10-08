import type { Request, Response, NextFunction } from 'express';

/**
 * Auth controller stubs — full implementation is Week 1 be/auth-impl task.
 * All endpoints return 501 Not Implemented until the service layer is wired up.
 */

export function login(_req: Request, res: Response, _next: NextFunction): void {
  // TODO(be/auth-impl): validate LoginBody, verify password, issue JWT + set refresh cookie
  res.status(501).json({ error: { code: 'INTERNAL_ERROR', message: 'טרם מומש', requestId: _req.requestId } });
}

export function refresh(_req: Request, res: Response, _next: NextFunction): void {
  // TODO(be/auth-impl): read httpOnly cookie, verify refresh token, issue new access token
  res.status(501).json({ error: { code: 'INTERNAL_ERROR', message: 'טרם מומש', requestId: _req.requestId } });
}

export function logout(_req: Request, res: Response, _next: NextFunction): void {
  // TODO(be/auth-impl): clear refresh cookie, invalidate token in Redis
  res.status(501).json({ error: { code: 'INTERNAL_ERROR', message: 'טרם מומש', requestId: _req.requestId } });
}

export function me(_req: Request, res: Response, _next: NextFunction): void {
  // TODO(be/auth-impl): return req.user + computed permissions
  res.status(501).json({ error: { code: 'INTERNAL_ERROR', message: 'טרם מומש', requestId: _req.requestId } });
}

export function forgotPassword(_req: Request, res: Response, _next: NextFunction): void {
  // TODO(be/auth-impl): send reset email (always 204, never reveal existence)
  res.sendStatus(204);
}

export function resetPassword(_req: Request, res: Response, _next: NextFunction): void {
  // TODO(be/auth-impl): verify reset token, hash new password, clear token
  res.status(501).json({ error: { code: 'INTERNAL_ERROR', message: 'טרם מומש', requestId: _req.requestId } });
}

