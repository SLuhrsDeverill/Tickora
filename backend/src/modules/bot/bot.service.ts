import Anthropic from '@anthropic-ai/sdk';
import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { logger } from '../../utils/logger';

const BOT_SYSTEM_PROMPT = `Sos el asistente IT de la empresa. Tu nombre es "Tika".
Tu objetivo es ayudar a los empleados a resolver sus problemas técnicos.

Tenés acceso a la base de conocimiento de la empresa con soluciones documentadas.
Responde siempre en español, de forma clara y paso a paso.
Sé empático y profesional.

Si podés resolver el problema, dá instrucciones claras y verificables.
Si el problema requiere intervención física o acceso al equipo, decí claramente
que vas a escalar el ticket a un técnico IT.

Criterios para escalar SIEMPRE:
- Hardware físico dañado
- Problema de red que afecta a más de una persona
- Recuperación de datos
- Instalación de software con licencia
- Problemas de seguridad o virus
- El usuario reporta que ya intentó las soluciones sugeridas
- Llevás más de 3 mensajes sin resolver el problema

Cuando decidas escalar, respondé EXACTAMENTE con este formato al final:
[ESCALAR: categoria=CATEGORIA, prioridad=PRIORIDAD, resumen=RESUMEN_DEL_PROBLEMA]

Categorías válidas: HARDWARE, SOFTWARE, NETWORK, EMAIL, PRINTER, ACCESS_PERMISSIONS, PHONE, OTHER
Prioridades válidas: LOW, MEDIUM, HIGH, CRITICAL`;

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface EscalationData {
  category: string;
  priority: string;
  summary: string;
}

function parseEscalation(text: string): EscalationData | null {
  const match = text.match(/\[ESCALAR:\s*categoria=(\w+),\s*prioridad=(\w+),\s*resumen=(.+?)\]/i);
  if (!match) return null;
  return { category: match[1], priority: match[2], summary: match[3].trim() };
}

async function findKnowledgeContext(query: string): Promise<string> {
  // Simple keyword search in KB
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  if (words.length === 0) return '';

  const articles = await prisma.knowledgeBase.findMany({
    where: { isPublic: true },
    select: { title: true, content: true },
    take: 3,
  });

  const relevant = articles.filter((a) =>
    words.some(
      (w) => a.title.toLowerCase().includes(w) || a.content.toLowerCase().includes(w),
    ),
  );

  if (relevant.length === 0) return '';
  return (
    '\n\nARTÍCULOS RELEVANTES DE LA BASE DE CONOCIMIENTO:\n' +
    relevant.map((a) => `### ${a.title}\n${a.content.slice(0, 500)}...`).join('\n\n')
  );
}

async function autoAssignAgent(): Promise<string | undefined> {
  // Find IT agent with fewest open tickets
  const agents = await prisma.user.findMany({
    where: { role: 'IT_AGENT', isActive: true },
    include: { ticketsAssigned: { where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } } },
  });

  if (agents.length === 0) return undefined;
  agents.sort((a, b) => a.ticketsAssigned.length - b.ticketsAssigned.length);
  return agents[0].id;
}

async function generateTicketNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.ticket.count();
  return `TK-${year}-${String(count + 1).padStart(5, '0')}`;
}

export class BotService {
  private getClient(): Anthropic | null {
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) return null;
    return new Anthropic({ apiKey });
  }

  async sendMessage(userId: string, conversationId: string | undefined, userMessage: string) {
    const client = this.getClient();
    if (!client) {
      return {
        message: 'El asistente virtual no está configurado. Contactá al administrador.',
        escalated: false,
        conversationId,
      };
    }

    // Load or create conversation
    let conversation = conversationId
      ? await prisma.botConversation.findUnique({ where: { id: conversationId } })
      : null;

    if (!conversation) {
      conversation = await prisma.botConversation.create({
        data: { userId, messages: [], resolved: false, escalated: false },
      });
    }

    if (conversation.escalated) {
      throw new AppError('Esta conversación ya fue escalada a un técnico', 400);
    }

    const history = (conversation.messages as unknown as ConversationMessage[]) || [];

    // Find KB context
    const kbContext = await findKnowledgeContext(userMessage);

    // Build messages for Anthropic
    const apiMessages: Array<{ role: 'user' | 'assistant'; content: string }> = history.map(
      (m) => ({ role: m.role, content: m.content }),
    );
    apiMessages.push({ role: 'user', content: userMessage });

    const systemWithContext = BOT_SYSTEM_PROMPT + kbContext;

    let botResponse = '';
    try {
      const response = await client.messages.create({
        model: process.env['AI_MODEL'] || 'claude-haiku-4-5-20251001',
        max_tokens: parseInt(process.env['AI_MAX_TOKENS'] || '1000'),
        system: systemWithContext,
        messages: apiMessages,
      });

      botResponse =
        response.content[0].type === 'text' ? response.content[0].text : 'No pude generar una respuesta.';
    } catch (err) {
      logger.error('Anthropic API error:', err);
      botResponse =
        'Estoy teniendo problemas técnicos. Por favor, intentá de nuevo en unos minutos o creá un ticket directamente.';
    }

    // Check for escalation tag
    const escalation = parseEscalation(botResponse);
    let createdTicket = null;

    const updatedHistory: ConversationMessage[] = [
      ...history,
      { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
      { role: 'assistant', content: botResponse, timestamp: new Date().toISOString() },
    ];

    if (escalation) {
      // Auto-assign agent
      const agentId = await autoAssignAgent();
      const ticketNumber = await generateTicketNumber();

      const historyText = updatedHistory
        .map((m) => `${m.role === 'user' ? 'Usuario' : 'Tika'}: ${m.content}`)
        .join('\n\n');

      createdTicket = await prisma.ticket.create({
        data: {
          ticketNumber,
          title: escalation.summary.slice(0, 150),
          description: `**Ticket creado automáticamente por Tika**\n\nResumen: ${escalation.summary}\n\n---\n\n**Historial de conversación con el bot:**\n\n${historyText}`,
          category: (escalation.category as 'HARDWARE' | 'SOFTWARE' | 'NETWORK' | 'EMAIL' | 'PRINTER' | 'ACCESS_PERMISSIONS' | 'PHONE' | 'OTHER') || 'OTHER',
          priority: (escalation.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') || 'MEDIUM',
          createdById: userId,
          ...(agentId ? { assignedToId: agentId } : {}),
          source: 'CHAT_BOT',
          aiHandled: true,
          aiEscalatedAt: new Date(),
          slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        select: { id: true, ticketNumber: true },
      });

      await prisma.botConversation.update({
        where: { id: conversation.id },
        data: {
          messages: updatedHistory as unknown as Prisma.JsonArray,
          escalated: true,
          ticketId: createdTicket.id,
        },
      });
    } else {
      await prisma.botConversation.update({
        where: { id: conversation.id },
        data: { messages: updatedHistory as unknown as Prisma.JsonArray },
      });
    }

    return {
      message: botResponse,
      escalated: !!escalation,
      conversationId: conversation.id,
      ticket: createdTicket,
    };
  }

  async getConversation(userId: string, conversationId: string, role: string) {
    const where =
      role === 'ADMIN' || role === 'IT_AGENT'
        ? { id: conversationId }
        : { id: conversationId, userId };

    const conv = await prisma.botConversation.findFirst({ where });
    if (!conv) throw new AppError('Conversación no encontrada', 404);
    return conv;
  }

  async escalateManually(userId: string, conversationId: string, summary: string) {
    const conv = await prisma.botConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv || conv.userId !== userId) throw new AppError('Conversación no encontrada', 404);
    if (conv.escalated) throw new AppError('Ya fue escalada', 400);

    const agentId = await autoAssignAgent();
    const ticketNumber = await generateTicketNumber();

    const createdTicket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title: summary.slice(0, 150),
        description: `**Escalado manualmente por el usuario**\n\n${summary}`,
        category: 'OTHER',
        priority: 'MEDIUM',
        createdById: userId,
        ...(agentId ? { assignedToId: agentId } : {}),
        source: 'CHAT_BOT',
        aiHandled: true,
        aiEscalatedAt: new Date(),
        slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      select: { id: true, ticketNumber: true },
    });

    await prisma.botConversation.update({
      where: { id: conversationId },
      data: { escalated: true, ticketId: createdTicket.id },
    });

    return createdTicket;
  }

  async getConversations(role: string, userId: string) {
    const where = role === 'ADMIN' || role === 'IT_AGENT' ? {} : { userId };
    return prisma.botConversation.findMany({
      where,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
  }

  /** Generate AI suggestions for a ticket (called by IT agents) */
  async generateSuggestions(ticketId: string) {
    const client = this.getClient();
    if (!client) return [];

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { title: true, description: true, category: true },
    });
    if (!ticket) return [];

    const kbContext = await findKnowledgeContext(`${ticket.title} ${ticket.description}`);

    try {
      const response = await client.messages.create({
        model: process.env['AI_MODEL'] || 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system:
          'Sos un experto IT. Dado un ticket de soporte, sugerí los 3 pasos más probables para resolverlo. Sé conciso. Responde en español.',
        messages: [
          {
            role: 'user',
            content: `Ticket: ${ticket.title}\nDescripción: ${ticket.description}\nCategoría: ${ticket.category}${kbContext}`,
          },
        ],
      });

      const suggestion =
        response.content[0].type === 'text' ? response.content[0].text : '';

      const saved = await prisma.aISuggestion.create({
        data: { ticketId, suggestion, confidence: 0.8 },
      });

      return [saved];
    } catch (err) {
      logger.error('AI suggestion error:', err);
      return [];
    }
  }
}

export const botService = new BotService();
