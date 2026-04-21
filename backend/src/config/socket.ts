import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from './database';
import { logger } from '../utils/logger';

export let io: SocketServer;

interface SocketUser {
  userId: string;
  email: string;
  role: string;
}

export function initSocket(httpServer: HttpServer): SocketServer {
  const corsOrigin = process.env['NODE_ENV'] === 'development'
    ? /^http:\/\/localhost(:\d+)?$/
    : (process.env['SOCKET_CORS_ORIGIN'] || 'http://localhost:5174');

  io = new SocketServer(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // JWT authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth['token'] as string | undefined;
    if (!token) return next(new Error('Authentication required'));

    try {
      const payload = jwt.verify(token, process.env['JWT_SECRET'] || 'secret') as SocketUser;
      (socket as Socket & { user: SocketUser }).user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (rawSocket) => {
    const socket = rawSocket as Socket & { user: SocketUser };
    const { userId } = socket.user;

    logger.info(`Socket connected: ${userId}`);

    // Auto-join personal room for targeted notifications
    socket.join(`user:${userId}`);

    socket.on('join_room', (roomId: string) => {
      socket.join(`room:${roomId}`);
    });

    socket.on('leave_room', (roomId: string) => {
      socket.leave(`room:${roomId}`);
    });

    socket.on('send_message', async (data: {
      roomId: string;
      content: string;
      type?: string;
      replyToId?: string;
    }) => {
      try {
        const message = await prisma.chatMessage.create({
          data: {
            roomId: data.roomId,
            senderId: userId,
            content: data.content,
            type: (data.type as 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM' | 'BOT') || 'TEXT',
            replyToId: data.replyToId,
          },
          include: {
            sender: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
            replyTo: true,
          },
        });

        // Update room timestamp
        await prisma.chatRoom.update({
          where: { id: data.roomId },
          data: { updatedAt: new Date() },
        });

        io.to(`room:${data.roomId}`).emit('new_message', message);
      } catch (err) {
        logger.error('Socket send_message error:', err);
      }
    });

    socket.on('typing', (data: { roomId: string; isTyping: boolean }) => {
      socket.to(`room:${data.roomId}`).emit('user_typing', {
        userId,
        isTyping: data.isTyping,
      });
    });

    socket.on('mark_read', async (roomId: string) => {
      try {
        await prisma.chatMember.updateMany({
          where: { roomId, userId },
          data: { lastReadAt: new Date() },
        });
        socket.to(`room:${roomId}`).emit('message_read', { roomId, userId });
      } catch (err) {
        logger.error('Socket mark_read error:', err);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${userId}`);
    });
  });

  return io;
}

/** Emit a notification to a specific user */
export function emitNotification(userId: string, notification: object) {
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
  }
}

/** Emit a ticket update to all watchers */
export function emitTicketUpdate(ticketId: string, data: object) {
  if (io) {
    io.to(`ticket:${ticketId}`).emit('ticket_updated', data);
  }
}
