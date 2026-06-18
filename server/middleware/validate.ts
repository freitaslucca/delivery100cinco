import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

type Source = 'body' | 'query' | 'params';

export function validate<T>(schema: ZodSchema<T>, source: Source = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const flat = result.error.flatten();
      return res.status(400).json({
        error: 'Dados inválidos',
        details: flat.fieldErrors,
        formErrors: flat.formErrors,
      });
    }
    (req as Request & { validated: T }).validated = result.data;
    next();
  };
}

export function getValidated<T>(req: Request): T {
  return (req as Request & { validated: T }).validated;
}
