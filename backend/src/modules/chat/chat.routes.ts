import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import {
  getMyRooms,
  getOrCreateDirect,
  createGroup,
  getMessages,
  sendMessage,
  markRead,
  getUnreadCount,
  deleteMessage,
} from './chat.controller';

const router = Router();
router.use(authMiddleware);

router.get('/rooms', getMyRooms);
router.post('/rooms/direct/:userId', getOrCreateDirect);
router.post('/rooms/group', createGroup);
router.get('/rooms/:roomId/messages', getMessages);
router.post('/rooms/:roomId/messages', sendMessage);
router.patch('/rooms/:roomId/read', markRead);
router.get('/unread-count', getUnreadCount);
router.delete('/messages/:messageId', deleteMessage);

export default router;
