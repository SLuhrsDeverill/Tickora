import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { knowledgeService } from './knowledge.service';

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { q, category } = req.query as { q?: string; category?: string };
    const articles = await knowledgeService.list(q, category);
    res.json({ success: true, data: articles });
  } catch (err) { next(err); }
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const article = await knowledgeService.getById(req.params['id'], req.user!.role);
    res.json({ success: true, data: article });
  } catch (err) { next(err); }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const article = await knowledgeService.create(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: article });
  } catch (err) { next(err); }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const article = await knowledgeService.update(req.params['id'], req.body);
    res.json({ success: true, data: article });
  } catch (err) { next(err); }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await knowledgeService.delete(req.params['id']);
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const markHelpful = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const helpful = req.path.includes('helpful') && !req.path.includes('not-helpful');
    const article = await knowledgeService.markHelpful(req.params['id'], helpful);
    res.json({ success: true, data: article });
  } catch (err) { next(err); }
};
