import { Router } from 'express';
import { ticketController } from './ticket.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createTicketSchema,
  updateTicketSchema,
  changeStatusSchema,
  assignTicketSchema,
  addCommentSchema,
} from './ticket.dto';

const router = Router();

router.use(authMiddleware);

router.get('/', ticketController.index.bind(ticketController));
router.get('/:id', ticketController.show.bind(ticketController));
router.post('/', validate(createTicketSchema), ticketController.create.bind(ticketController));
router.patch('/:id', validate(updateTicketSchema), ticketController.update.bind(ticketController));
router.delete('/:id', requireRole('ADMIN'), ticketController.destroy.bind(ticketController));
router.patch(
  '/:id/status',
  requireRole('ADMIN', 'IT_AGENT'),
  validate(changeStatusSchema),
  ticketController.changeStatus.bind(ticketController)
);
router.patch(
  '/:id/assign',
  requireRole('ADMIN', 'IT_AGENT'),
  validate(assignTicketSchema),
  ticketController.assign.bind(ticketController)
);
router.post('/:id/comments', validate(addCommentSchema), ticketController.addComment.bind(ticketController));

export default router;
