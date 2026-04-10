import { z } from 'zod';
import { TicketCategory, TicketPriority, TicketStatus } from '@prisma/client';

export const createTicketSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.nativeEnum(TicketCategory),
  priority: z.nativeEnum(TicketPriority).default('MEDIUM'),
  assetId: z.string().optional(),
});

export const updateTicketSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(10).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  resolution: z.string().optional(),
  assetId: z.string().nullable().optional(),
});

export const changeStatusSchema = z.object({
  status: z.nativeEnum(TicketStatus),
  resolution: z.string().optional(),
});

export const assignTicketSchema = z.object({
  assignedToId: z.string().nullable(),
});

export const addCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
  isInternal: z.boolean().default(false),
});

export const ticketQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  category: z.nativeEnum(TicketCategory).optional(),
  assignedToId: z.string().optional(),
  createdById: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  myTickets: z.string().optional(),
});

export type CreateTicketDto = z.infer<typeof createTicketSchema>;
export type UpdateTicketDto = z.infer<typeof updateTicketSchema>;
export type ChangeStatusDto = z.infer<typeof changeStatusSchema>;
export type AssignTicketDto = z.infer<typeof assignTicketSchema>;
export type AddCommentDto = z.infer<typeof addCommentSchema>;
