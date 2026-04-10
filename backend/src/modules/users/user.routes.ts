import { Router } from 'express';
import { userController } from './user.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createUserSchema, updateUserSchema, changePasswordSchema } from './user.dto';

const router = Router();

router.use(authMiddleware);

router.get('/', requireRole('ADMIN', 'IT_AGENT'), userController.index.bind(userController));
router.get('/:id', userController.show.bind(userController));
router.post('/', requireRole('ADMIN'), validate(createUserSchema), userController.create.bind(userController));
router.patch('/:id', validate(updateUserSchema), userController.update.bind(userController));
router.patch('/:id/password', validate(changePasswordSchema), userController.changePassword.bind(userController));
router.delete('/:id', requireRole('ADMIN'), userController.deactivate.bind(userController));
router.get('/:id/tickets', userController.userTickets.bind(userController));
router.get('/:id/assets', userController.userAssets.bind(userController));

export default router;
