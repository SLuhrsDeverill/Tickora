import prisma from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { TicketCategory } from '@prisma/client';

interface CreateKBDto {
  title: string;
  content: string;
  category: TicketCategory;
  tags?: string[];
  isPublic?: boolean;
}

export class KnowledgeService {
  async list(query?: string, category?: string) {
    const where: Record<string, unknown> = {};

    if (category) {
      where['category'] = category as TicketCategory;
    }

    if (query) {
      where['OR'] = [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { tags: { has: query.toLowerCase() } },
      ];
    }

    return prisma.knowledgeBase.findMany({
      where,
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        tags: true,
        isPublic: true,
        views: true,
        helpful: true,
        notHelpful: true,
        createdAt: true,
        updatedAt: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { views: 'desc' },
    });
  }

  async getById(id: string, role: string) {
    const article = await prisma.knowledgeBase.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
    });

    if (!article) throw new AppError('Artículo no encontrado', 404);
    if (!article.isPublic && role === 'EMPLOYEE') throw new AppError('Acceso denegado', 403);

    // Increment views
    await prisma.knowledgeBase.update({ where: { id }, data: { views: { increment: 1 } } });

    return article;
  }

  async create(userId: string, dto: CreateKBDto) {
    return prisma.knowledgeBase.create({
      data: { ...dto, tags: dto.tags || [], createdById: userId },
    });
  }

  async update(id: string, dto: Partial<CreateKBDto>) {
    const article = await prisma.knowledgeBase.findUnique({ where: { id } });
    if (!article) throw new AppError('Artículo no encontrado', 404);
    return prisma.knowledgeBase.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    const article = await prisma.knowledgeBase.findUnique({ where: { id } });
    if (!article) throw new AppError('Artículo no encontrado', 404);
    await prisma.knowledgeBase.delete({ where: { id } });
  }

  async markHelpful(id: string, helpful: boolean) {
    const field = helpful ? 'helpful' : 'notHelpful';
    return prisma.knowledgeBase.update({ where: { id }, data: { [field]: { increment: 1 } } });
  }
}

export const knowledgeService = new KnowledgeService();
