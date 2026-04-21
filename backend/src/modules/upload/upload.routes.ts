import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { ticketUpload, avatarUpload, chatUpload } from '../../config/upload';
import {
  uploadTicketFiles,
  uploadAvatar,
  uploadChatFile,
  serveFile,
} from './upload.controller';

const router = Router();

// Protected uploads
router.post('/ticket/:ticketId', authMiddleware, ticketUpload.array('files'), uploadTicketFiles);
router.post('/avatar', authMiddleware, avatarUpload.single('avatar'), uploadAvatar);
router.post('/chat/:roomId', authMiddleware, chatUpload.single('file'), uploadChatFile);

// Serve files (auth required)
router.get('/*', authMiddleware, serveFile);

export default router;
