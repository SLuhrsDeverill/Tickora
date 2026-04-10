import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { apiResponse } from '../utils/apiResponse';

export function validate(schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      apiResponse.badRequest(res, 'Validation error', result.error.errors);
      return;
    }
    req[target] = result.data;
    next();
  };
}
