import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';
import {
  getAll,
  setMany,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getBotStats,
} from './settings.controller';

const router = Router();
router.use(authMiddleware);

const adminOnly = rbacMiddleware(['ADMIN']);
const itAndAdmin = rbacMiddleware(['ADMIN', 'IT_AGENT']);

router.get('/', getAll);
router.put('/', adminOnly, setMany);
router.get('/departments', getDepartments);
router.post('/departments', adminOnly, createDepartment);
router.patch('/departments/:id', adminOnly, updateDepartment);
router.delete('/departments/:id', adminOnly, deleteDepartment);
router.get('/bot/stats', itAndAdmin, getBotStats);

export default router;
