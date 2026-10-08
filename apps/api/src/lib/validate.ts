import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny } from 'zod';
import { AppError } from './errors';

type Target = 'body' | 'query' | 'params';

/**
 * Zod validation middleware factory.
 *
 * Usage in a route:
 *   router.post('/', validate('body', LoginBody), controller.login)
 *
 * On failure: 400 VALIDATION_ERROR with details.fields mapping dot-path → message.
 * On success: replaces req[target] with the parsed (coerced + stripped) value.
 */
export function validate(target: Target, schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        // Keep the first error per field
        if (!fields[path]) {
          fields[path] = issue.message;
        }
      }
      return next(
        new AppError('VALIDATION_ERROR', 'שדות לא תקינים', { fields })
      );
    }

    // Replace with parsed value so controllers get typed, coerced data
    (req as unknown as Record<string, unknown>)[target] = result.data;
    next();
  };
}

