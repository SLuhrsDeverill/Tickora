import { create } from 'zustand';
import apiClient from '../api/client';

interface ChatStore {
  unreadCount: number;
  fetchUnreadCount: () => Promise<void>;
  setUnreadCount: (n: number) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  unreadCount: 0,

  fetchUnreadCount: async () => {
    try {
      const res = await apiClient.get<{ data: { total: number } }>('/chat/unread-count');
      set({ unreadCount: res.data.data.total });
    } catch {
      // silent
    }
  },

  setUnreadCount: (n) => set({ unreadCount: n }),
}));
