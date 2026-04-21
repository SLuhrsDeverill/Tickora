import { Request, Response, NextFunction } from 'express';
import { apiResponse } from '../utils/apiResponse';

/** Alias that accepts an array (used in new modules) */
export function rbacMiddleware(roles: string[]) {
  return requireRole(...roles);
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      apiResponse.unauthorized(res);
      return;
    }

    if (!roles.includes(req.user.role)) {
      apiResponse.forbidden(res, `Access restricted to: ${roles.join(', ')}`);
      return;
    }

    next();
  };
}
