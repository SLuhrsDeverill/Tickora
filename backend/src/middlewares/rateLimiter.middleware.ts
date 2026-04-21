import rateLimit from 'express-rate-limit';
import { RequestHandler } from 'express';

const isDev = process.env['NODE_ENV'] === 'development';

// No-op middleware used in development to skip rate limiting entirely
const noopLimiter: RequestHandler = (_req, _res, next) => next();

export const globalRateLimiter: RequestHandler = isDev
  ? noopLimiter
  : rateLimit({
      windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'),
      max: parseInt(process.env['RATE_LIMIT_MAX'] || '100'),
      message: { success: false, message: 'Too many requests, please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    });

export const loginRateLimiter: RequestHandler = isDev
  ? noopLimiter
  : rateLimit({
      windowMs: 2 * 60 * 1000, // 2 minutes
      max: 20,
      message: { success: false, message: 'Too many login attempts, please try again in 2 minutes.' },
      standardHeaders: true,
      legacyHeaders: false,
    });
