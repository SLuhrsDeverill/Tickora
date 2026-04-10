import { Router } from 'express';
import { assetController } from './asset.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createAssetSchema, updateAssetSchema, assignAssetSchema, maintenanceSchema } from './asset.dto';

const router = Router();

router.use(authMiddleware);

router.get('/stats/summary', assetController.summary.bind(assetController));
router.get('/', assetController.index.bind(assetController));
router.get('/:id', assetController.show.bind(assetController));
router.post('/', requireRole('ADMIN', 'IT_AGENT'), validate(createAssetSchema), assetController.create.bind(assetController));
router.patch('/:id', requireRole('ADMIN', 'IT_AGENT'), validate(updateAssetSchema), assetController.update.bind(assetController));
router.delete('/:id', requireRole('ADMIN'), assetController.destroy.bind(assetController));
router.post('/:id/assign', requireRole('ADMIN', 'IT_AGENT'), validate(assignAssetSchema), assetController.assign.bind(assetController));
router.post('/:id/unassign', requireRole('ADMIN', 'IT_AGENT'), assetController.unassign.bind(assetController));
router.post('/:id/maintenance', requireRole('ADMIN', 'IT_AGENT'), validate(maintenanceSchema), assetController.maintenance.bind(assetController));

export default router;
