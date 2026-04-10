import { AssetType, AssetStatus, Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination';
import { Request } from 'express';
import { CreateAssetDto, UpdateAssetDto, AssignAssetDto, MaintenanceDto } from './asset.dto';

async function generateAssetTag(type: AssetType): Promise<string> {
  const typeAbbr: Record<AssetType, string> = {
    LAPTOP: 'LAP', DESKTOP: 'DSK', MONITOR: 'MON', KEYBOARD: 'KBD', MOUSE: 'MSE',
    PRINTER: 'PRN', PHONE: 'PHN', TABLET: 'TAB', SERVER: 'SRV', SWITCH: 'SWT',
    ROUTER: 'RTR', UPS: 'UPS', HEADSET: 'HST', WEBCAM: 'CAM', DOCKING_STATION: 'DKS', OTHER: 'OTH',
  };
  const count = await prisma.asset.count({ where: { type } });
  return `AST-${typeAbbr[type]}-${String(count + 1).padStart(3, '0')}`;
}

export class AssetService {
  async findAll(req: Request) {
    const { page, limit, skip } = getPaginationParams(req);
    const { type, status, search } = req.query as Record<string, string>;

    const where: Prisma.AssetWhereInput = {};
    if (type) where.type = type as AssetType;
    if (status) where.status = status as AssetStatus;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { assetTag: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignments: {
            where: { returnedAt: null },
            include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
            take: 1,
          },
        },
      }),
      prisma.asset.count({ where }),
    ]);

    return { assets, meta: buildPaginationMeta(total, page, limit) };
  }

  async findById(id: string) {
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        assignments: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
          orderBy: { assignedAt: 'desc' },
        },
        maintenances: { orderBy: { performedAt: 'desc' } },
        tickets: {
          select: { id: true, ticketNumber: true, title: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!asset) throw new AppError('Asset not found', 404);
    return asset;
  }

  async create(dto: CreateAssetDto) {
    const assetTag = await generateAssetTag(dto.type);
    return prisma.asset.create({
      data: { ...dto, assetTag } as Prisma.AssetCreateInput,
    });
  }

  async update(id: string, dto: UpdateAssetDto) {
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) throw new AppError('Asset not found', 404);
    return prisma.asset.update({ where: { id }, data: dto as Prisma.AssetUpdateInput });
  }

  async delete(id: string) {
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) throw new AppError('Asset not found', 404);
    await prisma.asset.delete({ where: { id } });
  }

  async assign(id: string, dto: AssignAssetDto) {
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) throw new AppError('Asset not found', 404);

    const user = await prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new AppError('User not found', 404);

    // Close any existing active assignment
    await prisma.assetAssignment.updateMany({
      where: { assetId: id, returnedAt: null },
      data: { returnedAt: new Date() },
    });

    await prisma.assetAssignment.create({
      data: { assetId: id, userId: dto.userId, notes: dto.notes },
    });

    return prisma.asset.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  async unassign(id: string) {
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) throw new AppError('Asset not found', 404);

    await prisma.assetAssignment.updateMany({
      where: { assetId: id, returnedAt: null },
      data: { returnedAt: new Date() },
    });

    return prisma.asset.update({
      where: { id },
      data: { status: 'AVAILABLE' },
    });
  }

  async addMaintenance(id: string, dto: MaintenanceDto) {
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) throw new AppError('Asset not found', 404);

    const maintenance = await prisma.assetMaintenance.create({
      data: {
        type: dto.type,
        description: dto.description,
        cost: dto.cost,
        performedAt: dto.performedAt,
        nextDue: dto.nextDue,
        performedBy: dto.performedBy,
        asset: { connect: { id } },
      },
    });

    // Update asset status if currently active
    await prisma.asset.update({ where: { id }, data: { status: 'IN_REPAIR' } });

    return maintenance;
  }

  async getSummary() {
    const [byType, byStatus, total] = await Promise.all([
      prisma.asset.groupBy({ by: ['type'], _count: { id: true } }),
      prisma.asset.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.asset.count(),
    ]);

    return { total, byType, byStatus };
  }
}

export const assetService = new AssetService();
