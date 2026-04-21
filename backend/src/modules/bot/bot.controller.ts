import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { botService } from './bot.service';

export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { message, conversationId } = req.body as { message: string; conversationId?: string };
    const result = await botService.sendMessage(req.user!.userId, conversationId, message);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const getConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const conv = await botService.getConversation(
      req.user!.userId,
      req.params['id'],
      req.user!.role,
    );
    res.json({ success: true, data: conv });
  } catch (err) { next(err); }
};

export const escalateConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { summary } = req.body as { summary: string };
    const ticket = await botService.escalateManually(req.user!.userId, req.params['id'], summary);
    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
};

export const getConversations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const convs = await botService.getConversations(req.user!.role, req.user!.userId);
    res.json({ success: true, data: convs });
  } catch (err) { next(err); }
};
