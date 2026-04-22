import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, User, CheckCircle, MessageSquare } from 'lucide-react';
import { ticketsApi } from '../../api/tickets.api';
import { usersApi } from '../../api/users.api';
import { chatApi } from '../../api/chat.api';
import type { ChatRoom, ChatMessage } from '../../api/chat.api';
import TicketStatusBadge from '../../components/tickets/TicketStatusBadge';
import TicketPriorityBadge from '../../components/tickets/TicketPriorityBadge';
import { formatDate, formatRelative } from '../../utils/formatDate';
import { TICKET_CATEGORY_LABELS, TICKET_STATUS_LABELS } from '../../utils/constants';
import type { Ticket } from '../../types/ticket.types';
import type { User as UserType } from '../../types/user.types';
import { useAuthStore } from '../../store/auth.store';
import { useSocket } from '../../hooks/useSocket';
import clsx from 'clsx';

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [agents, setAgents] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusAction, setStatusAction] = useState('');
  const [resolution, setResolution] = useState('');

  // Chat del ticket
  const [ticketRoom, setTicketRoom] = useState<ChatRoom | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { joinRoom, leaveRoom, markRead, on } = useSocket();

  const isIT = user?.role === 'ADMIN' || user?.role === 'IT_AGENT';

  useEffect(() => {
    const load = async () => {
      try {
        const [ticketRes, agentsRes] = await Promise.all([
          ticketsApi.get(id!),
          isIT ? usersApi.list({ role: 'IT_AGENT', limit: 100 } as Record<string, string | number>) : Promise.resolve(null),
        ]);
        setTicket(ticketRes.data.data);
        if (agentsRes) setAgents(agentsRes.data.data);
      } catch {
        navigate('/tickets');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isIT, navigate]);

  // Find and load ticket chat room
  useEffect(() => {
    if (!id) return;
    chatApi.getMyRooms().then((res) => {
      const room = res.data.data.find((r) => r.type === 'TICKET' && r.ticketId === id);
      if (room) {
        setTicketRoom(room);
        chatApi.getMessages(room.id).then((msgRes) => setChatMessages(msgRes.data.data));
      }
    }).catch(() => {});
  }, [id]);

  // Socket for real-time chat
  const handleNewMessage = useCallback((raw: unknown) => {
    const msg = raw as ChatMessage;
    if (ticketRoom && msg.roomId === ticketRoom.id) {
      setChatMessages((prev) => [...prev, msg]);
      markRead(ticketRoom.id);
    }
  }, [ticketRoom, markRead]);

  useEffect(() => {
    if (!ticketRoom) return;
    joinRoom(ticketRoom.id);
    markRead(ticketRoom.id);
    const off = on('new_message', handleNewMessage);
    return () => { leaveRoom(ticketRoom.id); off(); };
  }, [ticketRoom, joinRoom, leaveRoom, markRead, on, handleNewMessage]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      const res = await ticketsApi.addComment(id!, comment, isInternal);
      setTicket((t) => t ? { ...t, comments: [...(t.comments || []), res.data.data] } : t);
      setComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async () => {
    if (!statusAction) return;
    try {
      const res = await ticketsApi.changeStatus(id!, statusAction, resolution || undefined);
      setTicket(res.data.data);
      setStatusAction('');
      setResolution('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async (agentId: string) => {
    try {
      const res = await ticketsApi.assign(id!, agentId || null);
      setTicket(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !ticketRoom) return;
    const content = chatInput.trim();
    setChatInput('');
    try {
      await chatApi.sendMessage(ticketRoom.id, content);
    } catch {
      setChatInput(content);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <div className="h-64 bg-gray-200 rounded-xl" />
    </div>;
  }

  if (!ticket) return null;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/tickets')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
        <ArrowLeft size={16} /> Volver a tickets
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="font-mono text-blue-600 text-sm font-medium">{ticket.ticketNumber}</span>
                <h2 className="text-xl font-semibold text-gray-900 mt-1">{ticket.title}</h2>
              </div>
              <div className="flex gap-2 shrink-0">
                <TicketStatusBadge status={ticket.status} />
                <TicketPriorityBadge priority={ticket.priority} />
              </div>
            </div>

            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {ticket.resolution && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="font-medium text-green-800 text-sm">Resolución</span>
                </div>
                <p className="text-green-700 text-sm">{ticket.resolution}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
              <span>Categoría: <strong className="text-gray-700">{TICKET_CATEGORY_LABELS[ticket.category]}</strong></span>
              <span>Creado: <strong className="text-gray-700">{formatDate(ticket.createdAt)}</strong></span>
              {ticket.slaDeadline && (
                <span className={clsx(new Date(ticket.slaDeadline) < new Date() && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' ? 'text-red-600' : '')}>
                  SLA: <strong>{formatDate(ticket.slaDeadline)}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Timeline */}
          {ticket.history && ticket.history.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Historial de cambios</h3>
              <div className="space-y-3">
                {ticket.history.map((h) => (
                  <div key={h.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700">
                        Campo <strong>{h.field}</strong>:
                        {h.oldValue && <> <span className="line-through text-gray-400">{h.field === 'status' ? TICKET_STATUS_LABELS[h.oldValue as keyof typeof TICKET_STATUS_LABELS] || h.oldValue : h.oldValue}</span> →</>}
                        {' '}<strong>{h.field === 'status' ? TICKET_STATUS_LABELS[h.newValue as keyof typeof TICKET_STATUS_LABELS] || h.newValue : h.newValue || '(nada)'}</strong>
                      </p>
                      <p className="text-xs text-gray-400">{formatRelative(h.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Comentarios ({ticket.comments?.length || 0})
            </h3>

            <div className="space-y-4 mb-6">
              {(ticket.comments || []).map((c) => (
                <div key={c.id} className={clsx('flex gap-3', c.isInternal && 'opacity-75')}>
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {c.author.firstName.charAt(0)}{c.author.lastName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{c.author.firstName} {c.author.lastName}</span>
                      {c.isInternal && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Nota interna</span>
                      )}
                      <span className="text-xs text-gray-400">{formatRelative(c.createdAt)}</span>
                    </div>
                    <div className={clsx('rounded-lg p-3 text-sm text-gray-700', c.isInternal ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50')}>
                      <p className="whitespace-pre-wrap">{c.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {ticket.status !== 'CLOSED' && (
              <div className="border-t border-gray-100 pt-4">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="Escribí un comentario..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
                />
                <div className="flex items-center justify-between">
                  {isIT && (
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} className="rounded border-gray-300" />
                      Nota interna (solo IT)
                    </label>
                  )}
                  <button
                    onClick={handleAddComment}
                    disabled={!comment.trim() || sending}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-auto"
                  >
                    <Send size={14} /> {sending ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ticket Chat */}
          {ticketRoom && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
                <MessageSquare size={16} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">Chat del ticket</h3>
                <span className="text-xs text-gray-400 ml-1">{ticketRoom.members.length} participantes</span>
              </div>
              <div className="h-64 overflow-y-auto p-4 space-y-2 bg-slate-50">
                {chatMessages.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">No hay mensajes en el chat de este ticket</p>
                ) : (
                  chatMessages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={clsx('flex gap-2', isMe ? 'flex-row-reverse' : 'flex-row')}>
                        <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {msg.sender.firstName.charAt(0)}{msg.sender.lastName.charAt(0)}
                        </div>
                        <div className={clsx('max-w-[70%] flex flex-col', isMe ? 'items-end' : 'items-start')}>
                          {!isMe && <span className="text-xs text-slate-500 mb-0.5">{msg.sender.firstName} {msg.sender.lastName}</span>}
                          <div className={clsx('px-3 py-2 rounded-xl text-sm', isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white text-slate-800 rounded-tl-sm shadow-sm')}>
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>
              {ticket.status !== 'CLOSED' && (
                <div className="p-3 border-t border-gray-100 flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSendChat(); } }}
                    placeholder="Escribí un mensaje..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={!chatInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg px-3 flex items-center transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Details card */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Detalles</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500 text-xs">Creado por</dt>
                <dd className="flex items-center gap-2 mt-1">
                  <User size={14} className="text-gray-400" />
                  <span className="text-gray-900">{ticket.createdBy.firstName} {ticket.createdBy.lastName}</span>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs">Asignado a</dt>
                <dd className="text-gray-900 mt-1">
                  {ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : 'Sin asignar'}
                </dd>
              </div>
              {ticket.resolvedAt && (
                <div>
                  <dt className="text-gray-500 text-xs">Resuelto</dt>
                  <dd className="text-gray-900 mt-1">{formatDate(ticket.resolvedAt)}</dd>
                </div>
              )}
              {ticket.asset && (
                <div>
                  <dt className="text-gray-500 text-xs">Activo relacionado</dt>
                  <dd className="text-gray-900 mt-1 font-mono text-xs">{ticket.asset.assetTag} — {ticket.asset.name}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* IT Actions */}
          {isIT && ticket.status !== 'CLOSED' && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Acciones IT</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Asignar agente</label>
                  <select
                    value={ticket.assignedToId || ''}
                    onChange={(e) => handleAssign(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sin asignar</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Cambiar estado</label>
                  <select
                    value={statusAction}
                    onChange={(e) => setStatusAction(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar estado...</option>
                    {['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED']
                      .filter((s) => s !== ticket.status)
                      .map((s) => (
                        <option key={s} value={s}>{TICKET_STATUS_LABELS[s as keyof typeof TICKET_STATUS_LABELS]}</option>
                      ))}
                  </select>
                </div>

                {statusAction === 'RESOLVED' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Descripción de resolución</label>
                    <textarea
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      rows={3}
                      placeholder="¿Cómo se resolvió el problema?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                )}

                {statusAction && (
                  <button
                    onClick={handleStatusChange}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Confirmar cambio
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
