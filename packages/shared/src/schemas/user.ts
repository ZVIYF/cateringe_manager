import { z } from 'zod';
import { Role } from '../enums';
import { Id, IsraeliPhone, dataOf, pageOf } from '../http';

// ── User as returned by GET /users and PATCH /users/:id ──────────────────────
export const UserPublic = z.object({
  id: Id,
  name: z.string(),
  email: z.string().email(),
  role: Role,
  active: z.boolean(),
  phone: z.string().nullable(),
});
export type UserPublic = z.infer<typeof UserPublic>;

// ── POST /users ───────────────────────────────────────────────────────────────
export const CreateUserBody = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email(),
  role: Role,
  phone: IsraeliPhone.optional(),
});
export type CreateUserBody = z.infer<typeof CreateUserBody>;

// ── PATCH /users/:id — §5.10: role?, active?, name?, phone? ──────────────────
export const UpdateUserBody = z.object({
  role: Role.optional(),
  active: z.boolean().optional(),
  name: z.string().trim().min(2).max(100).optional(),
  phone: IsraeliPhone.nullable().optional(),
}).refine(
  (b) => Object.values(b).some((v) => v !== undefined),
  { message: 'חובה לשלוח לפחות שדה אחד לעדכון' }
);
export type UpdateUserBody = z.infer<typeof UpdateUserBody>;

// ── Response wrappers ─────────────────────────────────────────────────────────
export const UserResponse = dataOf(UserPublic);
export const UsersListResponse = pageOf(UserPublic);
export type UserResponse = z.infer<typeof UserResponse>;
export type UsersListResponse = z.infer<typeof UsersListResponse>;

