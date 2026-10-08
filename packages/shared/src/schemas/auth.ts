import { z } from 'zod';
import { Role } from '../enums';
import { Id, dataOf } from '../http';

// ── The user object returned by /auth/login and /auth/me ──────────────────────
export const AuthUser = z.object({
  id: Id,
  name: z.string(),
  email: z.string().email(),
  role: Role,
});
export type AuthUser = z.infer<typeof AuthUser>;

// ── POST /auth/login ──────────────────────────────────────────────────────────
export const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().optional(),
});
export type LoginBody = z.infer<typeof LoginBody>;

export const LoginResponse = dataOf(
  z.object({
    accessToken: z.string(),
    user: AuthUser,
  })
);
export type LoginResponse = z.infer<typeof LoginResponse>;

// ── POST /auth/refresh → same shape as LoginResponse ─────────────────────────
export const RefreshResponse = LoginResponse;
export type RefreshResponse = LoginResponse;

// ── GET /auth/me ──────────────────────────────────────────────────────────────
export const MeResponse = dataOf(
  z.object({
    user: AuthUser,
    permissions: z.array(z.string()),
  })
);
export type MeResponse = z.infer<typeof MeResponse>;

// ── POST /auth/forgot-password ────────────────────────────────────────────────
export const ForgotPasswordBody = z.object({
  email: z.string().email(),
});
export type ForgotPasswordBody = z.infer<typeof ForgotPasswordBody>;

// ── POST /auth/reset-password ─────────────────────────────────────────────────
export const ResetPasswordBody = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});
export type ResetPasswordBody = z.infer<typeof ResetPasswordBody>;

