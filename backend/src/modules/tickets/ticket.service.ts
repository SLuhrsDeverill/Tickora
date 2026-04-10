import { TicketPriority, TicketStatus, Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination';
import { sendEmail, ticketAssignedEmail, ticketResolvedEmail } from '../../utils/mailer';
import { Request } from 'express';
import {
  CreateTicketDto,
  UpdateTicketDto,
  ChangeStatusDto,
  AssignTicketDto,
  AddCommentDto,
} from './ticket.dto';

const SLA_HOURS: Record<TicketPriority, number> = {
  CRITICAL: 4,
  HIGH: 8,
  MEDIUM: 24,
  LOW: 72,
};

async function generateTicketNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.ticket.count();
  return `TK-${year}-${String(count + 1).padStart(5, '0')}`;
}

export class TicketService {
  async findAll(req: Request, userId: string, userRole: string) {
    const { page, limit, skip } = getPaginationParams(req);
    const { status, priority, category, assignedToId, createdById, search, dateFrom, dateTo, myTickets } =
      req.query as Record<string, string>;

    const where: Prisma.TicketWhereInput = {};

    // Employees can only see their own tickets
    if (userRole === 'EMPLOYEE') {
      where.createdById = userId;
    } else {
      if (myTickets === 'true') where.assignedToId = userId;
      if (assignedToId) where.assignedToId = assignedToId;
      if (createdById) where.createdById = createdById;
    }

    if (status) where.status = status as TicketStatus;
    if (priority) where.priority = priority as TicketPriority;
    if (category) where.category = category as never;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { ticketNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
          asset: { select: { id: true, assetTag: true, name: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    return { tickets, meta: buildPaginationMeta(total, page, limit) };
  }

  async findById(id: string, userId: string, userRole: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
        asset: { select: { id: true, assetTag: true, name: true, type: true } },
        comments: {
          include: { author: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
        history: { orderBy: { createdAt: 'asc' } },
        attachments: true,
      },
    });

    if (!ticket) throw new AppError('Ticket not found', 404);

    // Employees can only see their own tickets
    if (userRole === 'EMPLOYEE' && ticket.createdById !== userId) {
      throw new AppError('Forbidden', 403);
    }

    // Filter internal comments for employees
    if (userRole === 'EMPLOYEE') {
      ticket.comments = ticket.comments.filter((c) => !c.isInternal);
    }

    return ticket;
  }

  async create(dto: CreateTicketDto, userId: string) {
    const ticketNumber = await generateTicketNumber();
    const slaHours = SLA_HOURS[dto.priority];
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    const ticket = await prisma.ticket.create({
      data: {
        ...dto,
        ticketNumber,
        slaDeadline,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        field: 'status',
        oldValue: null,
        newValue: 'OPEN',
        changedById: userId,
      },
    });

    return ticket;
  }

  async update(id: string, dto: UpdateTicketDto, userId: string, userRole: string) {
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new AppError('Ticket not found', 404);

    if (userRole === 'EMPLOYEE' && ticket.createdById !== userId) {
      throw new AppError('Forbidden', 403);
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: dto,
    });

    return updated;
  }

  async changeStatus(id: string, dto: ChangeStatusDto, userId: string) {
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new AppError('Ticket not found', 404);

    const updateData: Prisma.TicketUpdateInput = { status: dto.status };

    if (dto.status === 'IN_PROGRESS' && !ticket.firstResponseAt) {
      updateData.firstResponseAt = new Date();
    }
    if (dto.status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
      if (dto.resolution) updateData.resolution = dto.resolution;
    }
    if (dto.status === 'CLOSED') {
      updateData.closedAt = new Date();
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: { email: true, firstName: true } },
      },
    });

    await prisma.ticketHistory.create({
      data: {
        ticketId: id,
        field: 'status',
        oldValue: ticket.status,
        newValue: dto.status,
        changedById: userId,
      },
    });

    // Send email notifications
    if (dto.status === 'RESOLVED' && dto.resolution) {
      sendEmail(
        updated.createdBy.email,
        `Ticket ${ticket.ticketNumber} resuelto`,
        ticketResolvedEmail(ticket.ticketNumber, dto.resolution)
      ).catch(() => {});
    }

    return updated;
  }

  async assign(id: string, dto: AssignTicketDto, userId: string) {
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new AppError('Ticket not found', 404);

    const updated = await prisma.ticket.update({
      where: { id },
      data: { assignedToId: dto.assignedToId },
      include: {
        createdBy: { select: { email: true, firstName: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
      },
    });

    await prisma.ticketHistory.create({
      data: {
        ticketId: id,
        field: 'assignedTo',
        oldValue: ticket.assignedToId,
        newValue: dto.assignedToId,
        changedById: userId,
      },
    });

    if (dto.assignedToId && updated.assignedTo) {
      const agentName = `${updated.assignedTo.firstName} ${updated.assignedTo.lastName}`;
      sendEmail(
        updated.createdBy.email,
        `Ticket ${ticket.ticketNumber} asignado`,
        ticketAssignedEmail(ticket.ticketNumber, agentName)
      ).catch(() => {});
    }

    return updated;
  }

  async addComment(ticketId: string, dto: AddCommentDto, userId: string, userRole: string) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new AppError('Ticket not found', 404);

    if (userRole === 'EMPLOYEE' && ticket.createdById !== userId) {
      throw new AppError('Forbidden', 403);
    }

    if (dto.isInternal && userRole === 'EMPLOYEE') {
      throw new AppError('Employees cannot post internal comments', 403);
    }

    const comment = await prisma.comment.create({
      data: {
        content: dto.content,
        isInternal: dto.isInternal,
        ticketId,
        authorId: userId,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } },
      },
    });

    return comment;
  }

  async delete(id: string) {
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new AppError('Ticket not found', 404);
    await prisma.ticket.delete({ where: { id } });
  }
}

export const ticketService = new TicketService();
