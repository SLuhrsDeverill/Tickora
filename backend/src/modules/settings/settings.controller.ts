import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { settingsService } from './settings.service';

export const getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const settings = await settingsService.getAll();
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

export const setMany = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const settings = await settingsService.setMany(req.body as Record<string, string>);
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

export const getDepartments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const depts = await settingsService.getDepartments();
    res.json({ success: true, data: depts });
  } catch (err) { next(err); }
};

export const createDepartment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, code, managerId } = req.body as { name: string; code: string; managerId?: string };
    const dept = await settingsService.createDepartment(name, code, managerId);
    res.status(201).json({ success: true, data: dept });
  } catch (err) { next(err); }
};

export const updateDepartment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const dept = await settingsService.updateDepartment(req.params['id'], req.body);
    res.json({ success: true, data: dept });
  } catch (err) { next(err); }
};

export const deleteDepartment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await settingsService.deleteDepartment(req.params['id']);
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const getBotStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await settingsService.getBotStats();
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
};
