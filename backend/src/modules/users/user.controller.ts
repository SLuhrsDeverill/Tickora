import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';
import { apiResponse } from '../../utils/apiResponse';

export class UserController {
  async index(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { users, meta } = await userService.findAll(req);
      apiResponse.paginated(res, users, meta);
    } catch (err) {
      next(err);
    }
  }

  async show(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.findById(req.params['id']!);
      apiResponse.success(res, user);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.create(req.body);
      apiResponse.created(res, user, 'User created successfully');
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.update(req.params['id']!, req.body, req.user!.userId, req.user!.role);
      apiResponse.success(res, user, 'User updated');
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.changePassword(req.params['id']!, req.body, req.user!.userId, req.user!.role);
      apiResponse.success(res, null, 'Password changed successfully');
    } catch (err) {
      next(err);
    }
  }

  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.deactivate(req.params['id']!);
      apiResponse.success(res, user, 'User deactivated');
    } catch (err) {
      next(err);
    }
  }

  async userTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tickets, meta } = await userService.getUserTickets(req.params['id']!, req);
      apiResponse.paginated(res, tickets, meta);
    } catch (err) {
      next(err);
    }
  }

  async userAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const assets = await userService.getUserAssets(req.params['id']!);
      apiResponse.success(res, assets);
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();
