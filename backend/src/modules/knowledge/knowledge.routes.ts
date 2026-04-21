import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';
import { list, getById, create, update, remove, markHelpful } from './knowledge.controller';

const router = Router();
router.use(authMiddleware);

router.get('/', list);
router.get('/search', list);
router.get('/:id', getById);
router.post('/', rbacMiddleware(['ADMIN', 'IT_AGENT']), create);
router.patch('/:id', rbacMiddleware(['ADMIN', 'IT_AGENT']), update);
router.delete('/:id', rbacMiddleware(['ADMIN', 'IT_AGENT']), remove);
router.post('/:id/helpful', markHelpful);
router.post('/:id/not-helpful', markHelpful);

export default router;
