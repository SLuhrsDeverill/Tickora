import apiClient from './client';

export interface ChatRoom {
  id: string;
  name?: string;
  type: 'DIRECT' | 'GROUP' | 'TICKET' | 'BROADCAST';
  ticketId?: string;
  members: Array<{
    userId: string;
    user: { id: string; firstName: string; lastName: string; email: string; avatar?: string };
    lastReadAt?: string;
    role: string;
  }>;
  messages: ChatMessage[];
  lastReadAt?: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  sender: { id: string; firstName: string; lastName: string; avatar?: string };
  content: string;
  type: string;
  metadata?: Record<string, unknown>;
  editedAt?: string;
  deletedAt?: string;
  replyToId?: string;
  replyTo?: ChatMessage;
  createdAt: string;
}

export const chatApi = {
  getMyRooms: () => apiClient.get<{ data: ChatRoom[] }>('/chat/rooms'),
  getOrCreateDirect: (userId: string) => apiClient.post<{ data: ChatRoom }>(`/chat/rooms/direct/${userId}`),
  createGroup: (name: string, memberIds: string[]) =>
    apiClient.post<{ data: ChatRoom }>('/chat/rooms/group', { name, memberIds }),
  getMessages: (roomId: string, cursor?: string) =>
    apiClient.get<{ data: ChatMessage[] }>(`/chat/rooms/${roomId}/messages`, { params: { cursor } }),
  sendMessage: (roomId: string, content: string, type?: string, replyToId?: string) =>
    apiClient.post<{ data: ChatMessage }>(`/chat/rooms/${roomId}/messages`, { content, type, replyToId }),
  markRead: (roomId: string) => apiClient.patch(`/chat/rooms/${roomId}/read`),
  getUnreadCount: () => apiClient.get<{ data: { total: number } }>('/chat/unread-count'),
  deleteMessage: (messageId: string) => apiClient.delete(`/chat/messages/${messageId}`),
};
