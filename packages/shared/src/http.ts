import { z } from 'zod';

export const ErrorCode = z.enum([
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'TOKEN_EXPIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VERSION_CONFLICT',
  'INVALID_STATUS_TRANSITION',
  'ORDER_LOCKED',
  'DUPLICATE',
  'KASHRUT_CONFLICT',
  'DISCOUNT_REQUIRES_APPROVAL',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'PROVIDER_ERROR'
]);
export type ErrorCode = z.infer<typeof ErrorCode>;

export const errorStatus: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  TOKEN_EXPIRED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VERSION_CONFLICT: 409,
  INVALID_STATUS_TRANSITION: 409,
  ORDER_LOCKED: 409,
  DUPLICATE: 409,
  KASHRUT_CONFLICT: 422,
  DISCOUNT_REQUIRES_APPROVAL: 422,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  PROVIDER_ERROR: 502
};

export const ApiErrorSchema = z.object({
  error: z.object({
    code: ErrorCode,
    message: z.string(),
    details: z.object({ fields: z.record(z.string()).optional() }).passthrough().optional(),
    requestId: z.string()
  })
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

export const PageMeta = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0)
});

export const dataOf = <T extends z.ZodTypeAny>(item: T) => z.object({ data: item });
export const pageOf = <T extends z.ZodTypeAny>(item: T) => z.object({ data: z.array(item), meta: PageMeta });

export const ListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.string().optional(),
  q: z.string().trim().optional()
});

export const Id = z.string().min(1);
export const Money = z.number().int();
export const IsoDateTime = z.string().datetime();
export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const IsraeliPhone = z.string().regex(/^0(5\d|[2-489]|7\d)\d{7}$/, 'מספר טלפון לא תקין');
export const csvEnum = <T extends z.ZodEnum<[string, ...string[]]>>(en: T) =>
  z.string().transform(s => s.split(',').filter(Boolean)).pipe(z.array(en)).optional();
