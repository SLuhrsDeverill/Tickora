import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, ExternalLink, AlertCircle } from 'lucide-react';
import { botApi } from '../../api/bot.api';
import type { BotResponse } from '../../api/bot.api';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

interface Message {
  role: 'user' | 'bot';
  content: string;
  ticket?: { id: string; ticketNumber: string };
  timestamp: Date;
}

const INITIAL_MESSAGE: Message = {
  role: 'bot',
  content: '¡Hola! Soy Tika, la asistente de Tickora. ¿En qué puedo ayudarte hoy?',
  timestamp: new Date(),
};

export default function Tika() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [escalated, setEscalated] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading || escalated) return;
    const content = input.trim();
    setInput('');

    setMessages((prev) => [...prev, { role: 'user', content, timestamp: new Date() }]);
    setLoading(true);

    try {
      const res = await botApi.sendMessage(content, conversationId);
      const data: BotResponse = res.data.data;
      setConversationId(data.conversationId);

      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          content: data.message.replace(/\[ESCALAR:.*?\]/gi, '').trim(),
          ticket: data.ticket,
          timestamp: new Date(),
        },
      ]);

      if (data.escalated) {
        setEscalated(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: 'Ocurrió un error. Por favor, intentá de nuevo.', timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    const summary = lastUserMsg?.content || 'Escalado manualmente por el usuario';

    if (conversationId) {
      try {
        await botApi.escalate(conversationId, summary);
        setMessages((prev) => [
          ...prev,
          { role: 'bot', content: 'He escalado tu consulta a un técnico IT. En breve te contactarán.', timestamp: new Date() },
        ]);
        setEscalated(true);
      } catch {
        // silent
      }
    } else {
      navigate('/tickets/new');
      setOpen(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all z-50"
        title="Tika"
      >
        {open ? <X size={22} /> : <Bot size={22} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 w-96 h-[560px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center gap-2">
            <Bot size={20} />
            <div className="flex-1">
              <p className="font-semibold text-sm">Tika</p>
              <p className="text-xs text-blue-200">Asistente de Tickora</p>
            </div>
            <button onClick={() => setOpen(false)} className="hover:text-blue-200 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
            {messages.map((msg, i) => (
              <div key={i} className={clsx('flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                {msg.role === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-blue-600" />
                  </div>
                )}
                <div className={clsx('max-w-[80%] flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start')}>
                  <div
                    className={clsx(
                      'px-3 py-2 rounded-xl text-sm whitespace-pre-wrap',
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-white text-slate-800 shadow-sm rounded-tl-sm border border-slate-100',
                    )}
                  >
                    {msg.content}
                    {msg.ticket && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs text-green-700 font-medium">✅ Ticket creado</p>
                        <p className="text-xs text-green-600">{msg.ticket.ticketNumber}</p>
                        <button
                          onClick={() => { navigate(`/tickets/${msg.ticket!.id}`); setOpen(false); }}
                          className="mt-1 text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          Ver ticket <ExternalLink size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 items-start">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-blue-600" />
                </div>
                <div className="bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-100 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-200 bg-white">
            {escalated ? (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                <AlertCircle size={14} />
                <span>Tu consulta fue escalada a IT.</span>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-2">
                  <textarea
                    className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    placeholder="Escribí tu problema..."
                    rows={2}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl px-3 flex items-center transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
                <button
                  onClick={handleEscalate}
                  className="w-full text-xs text-slate-500 hover:text-blue-600 transition-colors py-1"
                >
                  Crear ticket directamente →
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
