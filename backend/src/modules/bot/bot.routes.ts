import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';
import { sendMessage, getConversation, escalateConversation, getConversations } from './bot.controller';

const router = Router();
router.use(authMiddleware);

router.post('/message', sendMessage);
router.get('/conversation/:id', getConversation);
router.post('/conversation/:id/escalate', escalateConversation);
router.get('/conversations', rbacMiddleware(['ADMIN', 'IT_AGENT']), getConversations);

export default router;
