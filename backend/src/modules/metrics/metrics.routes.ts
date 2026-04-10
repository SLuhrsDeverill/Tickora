import { Router } from 'express';
import { metricsController } from './metrics.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('ADMIN', 'IT_AGENT'));

router.get('/dashboard', metricsController.dashboard.bind(metricsController));
router.get('/tickets/by-category', metricsController.ticketsByCategory.bind(metricsController));
router.get('/tickets/by-status', metricsController.ticketsByStatus.bind(metricsController));
router.get('/tickets/trend', metricsController.ticketsTrend.bind(metricsController));
router.get('/tickets/resolution-time', metricsController.resolutionTime.bind(metricsController));
router.get('/agents/performance', metricsController.agentPerformance.bind(metricsController));
router.get('/sla/compliance', metricsController.slaCompliance.bind(metricsController));
router.get('/assets/inventory', metricsController.assetsInventory.bind(metricsController));

export default router;
