import bcrypt from 'bcrypt';
import prisma from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination';
import { Request } from 'express';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './user.dto';

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  department: true,
  position: true,
  phone: true,
  avatar: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export class UserService {
  async findAll(req: Request) {
    const { page, limit, skip } = getPaginationParams(req);
    const search = req.query['search'] as string | undefined;
    const role = req.query['role'] as string | undefined;

    const where = {
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(role && { role: role as never }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take: limit, select: userSelect, orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where }),
    ]);

    return { users, meta: buildPaginationMeta(total, page, limit) };
  }

  async findById(id: string) {
    const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new AppError('Email already in use', 409);

    const password = await bcrypt.hash(dto.password, 12);
    const user = await prisma.user.create({
      data: { ...dto, password },
      select: userSelect,
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto, requesterId: string, requesterRole: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404);

    // Non-admin can only update themselves, and cannot change role/isActive
    if (requesterRole !== 'ADMIN' && requesterId !== id) {
      throw new AppError('Forbidden', 403);
    }
    if (requesterRole !== 'ADMIN') {
      delete dto.role;
      delete dto.isActive;
    }

    return prisma.user.update({ where: { id }, data: dto, select: userSelect });
  }

  async changePassword(id: string, dto: ChangePasswordDto, requesterId: string, requesterRole: string) {
    if (requesterRole !== 'ADMIN' && requesterId !== id) {
      throw new AppError('Forbidden', 403);
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404);

    if (requesterRole !== 'ADMIN') {
      const valid = await bcrypt.compare(dto.currentPassword, user.password);
      if (!valid) throw new AppError('Current password is incorrect', 400);
    }

    const hashed = await bcrypt.hash(dto.newPassword, 12);
    await prisma.user.update({ where: { id }, data: { password: hashed } });
  }

  async deactivate(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404);
    return prisma.user.update({ where: { id }, data: { isActive: false }, select: userSelect });
  }

  async getUserTickets(userId: string, req: Request) {
    const { page, limit, skip } = getPaginationParams(req);
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: { createdById: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.ticket.count({ where: { createdById: userId } }),
    ]);
    return { tickets, meta: buildPaginationMeta(total, page, limit) };
  }

  async getUserAssets(userId: string) {
    return prisma.assetAssignment.findMany({
      where: { userId, returnedAt: null },
      include: {
        asset: true,
      },
    });
  }
}

export const userService = new UserService();
