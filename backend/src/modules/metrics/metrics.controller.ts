import { Request, Response, NextFunction } from 'express';
import { metricsService } from './metrics.service';
import { apiResponse } from '../../utils/apiResponse';

export class MetricsController {
  async dashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await metricsService.getDashboard();
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }

  async ticketsByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { dateFrom, dateTo } = req.query as Record<string, string>;
      const data = await metricsService.getTicketsByCategory(dateFrom, dateTo);
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }

  async ticketsByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await metricsService.getTicketsByStatus();
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }

  async ticketsTrend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period } = req.query as { period?: string };
      const data = await metricsService.getTicketsTrend(period);
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }

  async resolutionTime(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await metricsService.getResolutionTime();
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }

  async agentPerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await metricsService.getAgentPerformance();
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }

  async slaCompliance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await metricsService.getSlaCompliance();
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }

  async assetsInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await metricsService.getAssetsInventory();
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }
}

export const metricsController = new MetricsController();
