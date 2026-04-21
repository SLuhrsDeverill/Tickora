import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';
import { useChatStore } from '../store/chat.store';

const SOCKET_URL = import.meta.env['VITE_API_URL']
  ? import.meta.env['VITE_API_URL'].replace('/api', '')
  : 'http://localhost:4000';

let globalSocket: Socket | null = null;

export function useSocket() {
  const { token } = useAuthStore();
  const fetchUnreadCount = useChatStore((s) => s.fetchUnreadCount);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    if (!globalSocket || !globalSocket.connected) {
      globalSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      globalSocket.on('connect', () => {
        console.log('[Socket] Connected');
      });

      globalSocket.on('disconnect', () => {
        console.log('[Socket] Disconnected');
      });

      globalSocket.on('new_message', () => {
        fetchUnreadCount();
      });

      globalSocket.on('connect_error', (err) => {
        console.warn('[Socket] Connection error:', err.message);
      });
    }

    socketRef.current = globalSocket;

    return () => {
      // Don't disconnect on unmount — keep global connection alive
    };
  }, [token, fetchUnreadCount]);

  const sendMessage = (roomId: string, content: string, type = 'TEXT', replyToId?: string) => {
    globalSocket?.emit('send_message', { roomId, content, type, replyToId });
  };

  const joinRoom = (roomId: string) => {
    globalSocket?.emit('join_room', roomId);
  };

  const leaveRoom = (roomId: string) => {
    globalSocket?.emit('leave_room', roomId);
  };

  const startTyping = (roomId: string) => {
    globalSocket?.emit('typing', { roomId, isTyping: true });
  };

  const stopTyping = (roomId: string) => {
    globalSocket?.emit('typing', { roomId, isTyping: false });
  };

  const markRead = (roomId: string) => {
    globalSocket?.emit('mark_read', roomId);
  };

  const on = (event: string, handler: (...args: unknown[]) => void) => {
    globalSocket?.on(event, handler);
    return () => { globalSocket?.off(event, handler); };
  };

  return { socket: globalSocket, sendMessage, joinRoom, leaveRoom, startTyping, stopTyping, markRead, on };
}
