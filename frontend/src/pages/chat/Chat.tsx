import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquare, Plus, Send, Search, Users, Hash, Ticket } from 'lucide-react';
import { chatApi } from '../../api/chat.api';
import type { ChatRoom, ChatMessage } from '../../api/chat.api';
import { useAuthStore } from '../../store/auth.store';
import { useChatStore } from '../../store/chat.store';
import { useSocket } from '../../hooks/useSocket';
import clsx from 'clsx';

function RoomIcon({ type }: { type: string }) {
  if (type === 'DIRECT') return <MessageSquare size={16} />;
  if (type === 'GROUP') return <Users size={16} />;
  if (type === 'TICKET') return <Ticket size={16} />;
  return <Hash size={16} />;
}

function getRoomName(room: ChatRoom, myUserId: string) {
  if (room.name) return room.name;
  if (room.type === 'DIRECT') {
    const other = room.members.find((m) => m.userId !== myUserId);
    return other ? `${other.user.firstName} ${other.user.lastName}` : 'Chat directo';
  }
  return `Sala #${room.id.slice(-4)}`;
}

function MessageBubble({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  return (
    <div className={clsx('flex gap-2 mb-3', isMe ? 'flex-row-reverse' : 'flex-row')}>
      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
        {msg.sender.firstName.charAt(0)}{msg.sender.lastName.charAt(0)}
      </div>
      <div className={clsx('max-w-[70%]', isMe ? 'items-end' : 'items-start', 'flex flex-col')}>
        {!isMe && (
          <span className="text-xs text-slate-500 mb-1">{msg.sender.firstName} {msg.sender.lastName}</span>
        )}
        <div
          className={clsx(
            'px-3 py-2 rounded-xl text-sm',
            isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white text-slate-800 rounded-tl-sm shadow-sm',
            msg.deletedAt ? 'italic opacity-60' : '',
          )}
        >
          {msg.replyTo && (
            <div className="text-xs opacity-70 border-l-2 border-current pl-2 mb-1 truncate">
              {msg.replyTo.sender.firstName}: {msg.replyTo.content.slice(0, 60)}
            </div>
          )}
          {msg.content}
        </div>
        <span className="text-[10px] text-slate-400 mt-0.5">
          {format(new Date(msg.createdAt), 'HH:mm', { locale: es })}
        </span>
      </div>
    </div>
  );
}

export default function Chat() {
  const { user } = useAuthStore();
  const isIT = user?.role === 'ADMIN' || user?.role === 'IT_AGENT';
  const { fetchUnreadCount } = useChatStore();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { joinRoom, leaveRoom, markRead, on } = useSocket();

  const loadRooms = useCallback(async () => {
    try {
      const res = await chatApi.getMyRooms();
      setRooms(res.data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (!activeRoom) return;
    joinRoom(activeRoom.id);
    markRead(activeRoom.id);
    fetchUnreadCount();

    const off = on('new_message', (raw) => {
      const msg = raw as ChatMessage;
      if (msg.roomId === activeRoom.id) {
        setMessages((prev) => [...prev, msg]);
        markRead(activeRoom.id);
        fetchUnreadCount();
      } else {
        loadRooms();
      }
    });

    chatApi.getMessages(activeRoom.id).then((res) => {
      setMessages(res.data.data);
    });

    return () => {
      leaveRoom(activeRoom.id);
      off();
    };
  }, [activeRoom, joinRoom, leaveRoom, markRead, fetchUnreadCount, on, loadRooms]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !activeRoom) return;
    const content = input.trim();
    setInput('');
    try {
      await chatApi.sendMessage(activeRoom.id, content);
    } catch {
      setInput(content);
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const name = getRoomName(r, user?.id || '');
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const directRooms = filteredRooms.filter((r) => r.type === 'DIRECT');
  const groupRooms = filteredRooms.filter((r) => r.type === 'GROUP');
  const ticketRooms = filteredRooms.filter((r) => r.type === 'TICKET');
  const broadcasts = filteredRooms.filter((r) => r.type === 'BROADCAST');

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0">
        <div className="p-3 border-b border-slate-700">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-500" />
            <input
              className="w-full bg-slate-800 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {broadcasts.length > 0 && (
            <RoomSection title="📢 Anuncios" rooms={broadcasts} activeRoom={activeRoom} onSelect={setActiveRoom} myId={user?.id || ''} />
          )}
          {directRooms.length > 0 && (
            <RoomSection title="💬 Directos" rooms={directRooms} activeRoom={activeRoom} onSelect={setActiveRoom} myId={user?.id || ''} />
          )}
          {groupRooms.length > 0 && (
            <RoomSection title="👥 Grupos" rooms={groupRooms} activeRoom={activeRoom} onSelect={setActiveRoom} myId={user?.id || ''} />
          )}
          {ticketRooms.length > 0 && (
            <RoomSection title="🎫 Tickets" rooms={ticketRooms} activeRoom={activeRoom} onSelect={setActiveRoom} myId={user?.id || ''} />
          )}

          {loading && <p className="text-slate-500 text-xs px-2">Cargando...</p>}
          {!loading && rooms.length === 0 && (
            <p className="text-slate-500 text-xs px-2">No tenés conversaciones aún.</p>
          )}
        </div>

        <div className="p-3 border-t border-slate-700">
          <button className="w-full flex items-center gap-2 text-sm text-slate-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <Plus size={16} /> Nuevo chat
          </button>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {activeRoom ? (
          <>
            <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-3">
              <RoomIcon type={activeRoom.type} />
              <div>
                <h2 className="font-semibold text-slate-800">{getRoomName(activeRoom, user?.id || '')}</h2>
                <p className="text-xs text-slate-500">{activeRoom.members.length} miembros</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-slate-50">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} isMe={msg.senderId === user?.id} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {activeRoom.type === 'BROADCAST' && !isIT ? (
              <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-400">
                📢 Solo el equipo IT puede escribir en este canal
              </div>
            ) : (
              <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
                <textarea
                  className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                  placeholder="Escribí un mensaje..."
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl px-3 flex items-center transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Seleccioná una conversación</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RoomSection({
  title,
  rooms,
  activeRoom,
  onSelect,
  myId,
}: {
  title: string;
  rooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  onSelect: (r: ChatRoom) => void;
  myId: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-1">{title}</p>
      {rooms.map((room) => (
        <button
          key={room.id}
          onClick={() => onSelect(room)}
          className={clsx(
            'w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2',
            activeRoom?.id === room.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white',
          )}
        >
          <RoomIcon type={room.type} />
          <span className="truncate flex-1">{getRoomName(room, myId)}</span>
        </button>
      ))}
    </div>
  );
}
