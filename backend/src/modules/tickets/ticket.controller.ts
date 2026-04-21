import { Request, Response, NextFunction } from 'express';
import { ticketService } from './ticket.service';
import { apiResponse } from '../../utils/apiResponse';

export class TicketController {
  async index(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tickets, meta } = await ticketService.findAll(req, req.user!.userId, req.user!.role);
      apiResponse.paginated(res, tickets, meta);
    } catch (err) {
      next(err);
    }
  }

  async show(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await ticketService.findById(req.params['id']!, req.user!.userId, req.user!.role);
      apiResponse.success(res, ticket);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await ticketService.create(req.body, req.user!.userId);
      apiResponse.created(res, ticket, 'Ticket created successfully');
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await ticketService.update(req.params['id']!, req.body, req.user!.userId, req.user!.role);
      apiResponse.success(res, ticket, 'Ticket updated');
    } catch (err) {
      next(err);
    }
  }

  async changeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await ticketService.changeStatus(req.params['id']!, req.body, req.user!.userId);
      apiResponse.success(res, ticket, 'Status updated');
    } catch (err) {
      next(err);
    }
  }

  async assign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await ticketService.assign(req.params['id']!, req.body, req.user!.userId);
      apiResponse.success(res, ticket, 'Ticket assigned');
    } catch (err) {
      next(err);
    }
  }

  async addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const comment = await ticketService.addComment(
        req.params['id']!,
        req.body,
        req.user!.userId,
        req.user!.role
      );
      apiResponse.created(res, comment, 'Comment added');
    } catch (err) {
      next(err);
    }
  }

  async destroy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ticketService.delete(req.params['id']!);
      apiResponse.success(res, null, 'Ticket deleted');
    } catch (err) {
      next(err);
    }
  }

  async addTimeEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entry = await ticketService.addTimeEntry(req.params['id']!, req.body, req.user!.userId);
      apiResponse.created(res, entry, 'Time entry added');
    } catch (err) { next(err); }
  }

  async getTimeEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entries = await ticketService.getTimeEntries(req.params['id']!);
      apiResponse.success(res, entries);
    } catch (err) { next(err); }
  }

  async addWatcher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ticketService.addWatcher(req.params['id']!, req.user!.userId);
      apiResponse.success(res, result, 'Watcher added');
    } catch (err) { next(err); }
  }

  async removeWatcher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ticketService.removeWatcher(req.params['id']!, req.params['userId']!);
      apiResponse.success(res, null, 'Watcher removed');
    } catch (err) { next(err); }
  }

  async submitSatisfaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await ticketService.submitSatisfaction(
        req.params['id']!,
        req.user!.userId,
        req.body,
      );
      apiResponse.success(res, ticket, 'Satisfaction submitted');
    } catch (err) { next(err); }
  }

  async exportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const csv = await ticketService.exportCsv(req, req.user!.role);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="tickets.csv"');
      res.send(csv);
    } catch (err) { next(err); }
  }

  async escalate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await ticketService.escalate(req.params['id']!, req.user!.userId);
      apiResponse.success(res, ticket, 'Ticket escalated');
    } catch (err) { next(err); }
  }
}

export const ticketController = new TicketController();
