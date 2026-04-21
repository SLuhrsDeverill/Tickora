import apiClient from './client';

export interface BotResponse {
  message: string;
  escalated: boolean;
  conversationId: string;
  ticket?: { id: string; ticketNumber: string };
}

export const botApi = {
  sendMessage: (message: string, conversationId?: string) =>
    apiClient.post<{ data: BotResponse }>('/bot/message', { message, conversationId }),
  getConversation: (id: string) => apiClient.get(`/bot/conversation/${id}`),
  escalate: (id: string, summary: string) =>
    apiClient.post(`/bot/conversation/${id}/escalate`, { summary }),
};
