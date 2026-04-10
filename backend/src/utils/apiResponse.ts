import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const apiResponse = {
  success<T>(res: Response, data: T, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  },

  created<T>(res: Response, data: T, message = 'Created successfully') {
    return res.status(201).json({
      success: true,
      message,
      data,
    });
  },

  paginated<T>(res: Response, data: T[], meta: PaginationMeta, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data,
      meta,
    });
  },

  error(res: Response, message: string, statusCode = 500, errors?: unknown) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  },

  notFound(res: Response, message = 'Resource not found') {
    return res.status(404).json({
      success: false,
      message,
    });
  },

  unauthorized(res: Response, message = 'Unauthorized') {
    return res.status(401).json({
      success: false,
      message,
    });
  },

  forbidden(res: Response, message = 'Forbidden') {
    return res.status(403).json({
      success: false,
      message,
    });
  },

  badRequest(res: Response, message: string, errors?: unknown) {
    return res.status(400).json({
      success: false,
      message,
      errors,
    });
  },
};
