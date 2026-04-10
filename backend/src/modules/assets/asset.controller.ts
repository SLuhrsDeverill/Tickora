import { Request, Response, NextFunction } from 'express';
import { assetService } from './asset.service';
import { apiResponse } from '../../utils/apiResponse';

export class AssetController {
  async index(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { assets, meta } = await assetService.findAll(req);
      apiResponse.paginated(res, assets, meta);
    } catch (err) { next(err); }
  }

  async summary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await assetService.getSummary();
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }

  async show(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const asset = await assetService.findById(req.params['id']!);
      apiResponse.success(res, asset);
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const asset = await assetService.create(req.body);
      apiResponse.created(res, asset, 'Asset created successfully');
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const asset = await assetService.update(req.params['id']!, req.body);
      apiResponse.success(res, asset, 'Asset updated');
    } catch (err) { next(err); }
  }

  async destroy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await assetService.delete(req.params['id']!);
      apiResponse.success(res, null, 'Asset deleted');
    } catch (err) { next(err); }
  }

  async assign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const asset = await assetService.assign(req.params['id']!, req.body);
      apiResponse.success(res, asset, 'Asset assigned');
    } catch (err) { next(err); }
  }

  async unassign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const asset = await assetService.unassign(req.params['id']!);
      apiResponse.success(res, asset, 'Asset unassigned');
    } catch (err) { next(err); }
  }

  async maintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const record = await assetService.addMaintenance(req.params['id']!, req.body);
      apiResponse.created(res, record, 'Maintenance recorded');
    } catch (err) { next(err); }
  }
}

export const assetController = new AssetController();
