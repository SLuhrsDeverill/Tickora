import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { chatService } from './chat.service';
import { io } from '../../config/socket';

export const getMyRooms = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rooms = await chatService.getMyRooms(req.user!.userId);
    res.json({ success: true, data: rooms });
  } catch (err) { next(err); }
};

export const getOrCreateDirect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const room = await chatService.getOrCreateDirect(req.user!.userId, req.params['userId']);
    res.json({ success: true, data: room });
  } catch (err) { next(err); }
};

export const createGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, memberIds } = req.body as { name: string; memberIds: string[] };
    const room = await chatService.createGroup(req.user!.userId, name, memberIds);
    res.status(201).json({ success: true, data: room });
  } catch (err) { next(err); }
};

export const getMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { cursor } = req.query as { cursor?: string };
    const messages = await chatService.getMessages(req.user!.userId, req.params['roomId'], cursor);
    res.json({ success: true, data: messages });
  } catch (err) { next(err); }
};

export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { content, type, replyToId } = req.body as { content: string; type?: string; replyToId?: string };
    const message = await chatService.sendMessage(
      req.user!.userId,
      req.params['roomId'],
      content,
      type,
      replyToId,
    );
    // Broadcast via Socket.IO
    if (io) {
      io.to(`room:${req.params['roomId']}`).emit('new_message', message);
    }
    res.status(201).json({ success: true, data: message });
  } catch (err) { next(err); }
};

export const markRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await chatService.markRead(req.user!.userId, req.params['roomId']);
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const count = await chatService.getUnreadCount(req.user!.userId);
    res.json({ success: true, data: count });
  } catch (err) { next(err); }
};

export const deleteMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const message = await chatService.deleteMessage(req.user!.userId, req.params['messageId']);
    res.json({ success: true, data: message });
  } catch (err) { next(err); }
};
