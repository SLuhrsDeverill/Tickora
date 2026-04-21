import prisma from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatar: true,
  role: true,
};

export class ChatService {
  async getMyRooms(userId: string) {
    const memberships = await prisma.chatMember.findMany({
      where: { userId },
      include: {
        room: {
          include: {
            members: { include: { user: { select: USER_SELECT } } },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { sender: { select: USER_SELECT } },
            },
          },
        },
      },
      orderBy: { room: { updatedAt: 'desc' } },
    });

    return memberships.map((m) => ({
      ...m.room,
      lastReadAt: m.lastReadAt,
      myRole: m.role,
    }));
  }

  async getOrCreateDirect(userId: string, targetUserId: string) {
    if (userId === targetUserId) throw new AppError('No podés chatear con vos mismo', 400);

    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new AppError('Usuario no encontrado', 404);

    // Check if direct room already exists
    const existing = await prisma.chatRoom.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: targetUserId } } },
        ],
      },
      include: { members: { include: { user: { select: USER_SELECT } } } },
    });

    if (existing) return existing;

    return prisma.chatRoom.create({
      data: {
        type: 'DIRECT',
        members: {
          create: [{ userId }, { userId: targetUserId }],
        },
      },
      include: { members: { include: { user: { select: USER_SELECT } } } },
    });
  }

  async createGroup(userId: string, name: string, memberIds: string[]) {
    const allMemberIds = [...new Set([userId, ...memberIds])];
    return prisma.chatRoom.create({
      data: {
        type: 'GROUP',
        name,
        members: {
          create: allMemberIds.map((id) => ({
            userId: id,
            role: id === userId ? 'admin' : 'member',
          })),
        },
      },
      include: { members: { include: { user: { select: USER_SELECT } } } },
    });
  }

  async getMessages(userId: string, roomId: string, cursor?: string) {
    // Ensure user is a member
    const membership = await prisma.chatMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!membership) throw new AppError('No tenés acceso a esta sala', 403);

    const messages = await prisma.chatMessage.findMany({
      where: { roomId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        sender: { select: USER_SELECT },
        replyTo: {
          include: { sender: { select: USER_SELECT } },
        },
      },
    });

    return messages.reverse();
  }

  async sendMessage(userId: string, roomId: string, content: string, type = 'TEXT', replyToId?: string) {
    const membership = await prisma.chatMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!membership) throw new AppError('No tenés acceso a esta sala', 403);

    const message = await prisma.chatMessage.create({
      data: {
        roomId,
        senderId: userId,
        content,
        type: type as 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM' | 'BOT',
        replyToId,
      },
      include: {
        sender: { select: USER_SELECT },
        replyTo: { include: { sender: { select: USER_SELECT } } },
      },
    });

    await prisma.chatRoom.update({ where: { id: roomId }, data: { updatedAt: new Date() } });
    return message;
  }

  async markRead(userId: string, roomId: string) {
    await prisma.chatMember.updateMany({
      where: { roomId, userId },
      data: { lastReadAt: new Date() },
    });
  }

  async getUnreadCount(userId: string) {
    const memberships = await prisma.chatMember.findMany({
      where: { userId },
      include: {
        room: {
          include: {
            messages: {
              where: { deletedAt: null },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    let total = 0;
    for (const m of memberships) {
      if (!m.lastReadAt) {
        total += await prisma.chatMessage.count({
          where: { roomId: m.roomId, deletedAt: null, senderId: { not: userId } },
        });
      } else {
        total += await prisma.chatMessage.count({
          where: {
            roomId: m.roomId,
            deletedAt: null,
            senderId: { not: userId },
            createdAt: { gt: m.lastReadAt },
          },
        });
      }
    }

    return { total };
  }

  async deleteMessage(userId: string, messageId: string) {
    const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!message) throw new AppError('Mensaje no encontrado', 404);
    if (message.senderId !== userId) throw new AppError('Solo podés borrar tus propios mensajes', 403);

    return prisma.chatMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), content: '[Mensaje eliminado]' },
    });
  }

  /** Create a TICKET-type chat room when a ticket is created */
  async createTicketRoom(ticketId: string, creatorId: string, agentId?: string) {
    const memberIds = [...new Set([creatorId, ...(agentId ? [agentId] : [])])];
    return prisma.chatRoom.create({
      data: {
        type: 'TICKET',
        ticketId,
        name: `Ticket #${ticketId}`,
        members: { create: memberIds.map((id) => ({ userId: id })) },
      },
    });
  }

  /** Add agent to ticket chat room when assigned */
  async addAgentToTicketRoom(ticketId: string, agentId: string) {
    const room = await prisma.chatRoom.findFirst({ where: { type: 'TICKET', ticketId } });
    if (!room) return;

    const existing = await prisma.chatMember.findUnique({
      where: { roomId_userId: { roomId: room.id, userId: agentId } },
    });
    if (!existing) {
      await prisma.chatMember.create({ data: { roomId: room.id, userId: agentId } });
    }
  }

  /** Post a system message to ticket chat room */
  async postSystemMessage(ticketId: string, content: string) {
    const room = await prisma.chatRoom.findFirst({ where: { type: 'TICKET', ticketId } });
    if (!room) return;

    return prisma.chatMessage.create({
      data: { roomId: room.id, senderId: (await this.getSystemUser()) ?? '', content, type: 'SYSTEM' },
    });
  }

  private async getSystemUser() {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    return admin?.id;
  }
}

export const chatService = new ChatService();
