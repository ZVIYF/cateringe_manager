import { errorStatus, type ErrorCode } from '@catering/shared';

interface ErrorDetails {
  fields?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Structured application error.
 * Throw this from any service or controller — the global error handler picks it up.
 * The `code` must be a value from ErrorCode (packages/shared/src/http.ts).
 * The HTTP status is derived automatically from errorStatus[code].
 * Messages must be in Hebrew (per CLAUDE.md rule 8).
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: ErrorDetails;

  constructor(code: ErrorCode, message: string, details?: ErrorDetails) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = errorStatus[code];
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** Convenience factories for the most common errors */
export const notFound = (message = 'הרשומה לא נמצאה') =>
  new AppError('NOT_FOUND', message);

export const forbidden = (message = 'אין הרשאה לפעולה זו') =>
  new AppError('FORBIDDEN', message);

export const unauthenticated = (message = 'נדרשת התחברות') =>
  new AppError('UNAUTHENTICATED', message);

export const tokenExpired = (message = 'פג תוקף הטוקן') =>
  new AppError('TOKEN_EXPIRED', message);

export const versionConflict = (message = 'הנתונים השתנו — אנא טען מחדש') =>
  new AppError('VERSION_CONFLICT', message);

export const duplicate = (message: string, field?: string) =>
  new AppError('DUPLICATE', message, field ? { fields: { [field]: message } } : undefined);

export const validationError = (
  message: string,
  fields: Record<string, string>
) => new AppError('VALIDATION_ERROR', message, { fields });

