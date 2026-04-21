import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useNavigate } from 'react-router-dom';
import { ticketsApi } from '../../api/tickets.api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';

interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  priority: string;
  status: string;
  category: string;
  assignedTo?: { firstName: string; lastName: string };
  createdAt: string;
  slaDeadline?: string;
}

const COLUMNS = [
  { id: 'OPEN', label: 'Abiertos', color: 'border-blue-400', bg: 'bg-blue-50', header: 'bg-blue-400' },
  { id: 'IN_PROGRESS', label: 'En progreso', color: 'border-amber-400', bg: 'bg-amber-50', header: 'bg-amber-400' },
  { id: 'ON_HOLD', label: 'En espera', color: 'border-slate-400', bg: 'bg-slate-50', header: 'bg-slate-400' },
  { id: 'RESOLVED', label: 'Resueltos', color: 'border-green-400', bg: 'bg-green-50', header: 'bg-green-400' },
];

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  MEDIUM: 'bg-blue-100 text-blue-700 border-blue-200',
  LOW: 'bg-slate-100 text-slate-600 border-slate-200',
};

const PRIORITY_DOTS: Record<string, string> = {
  CRITICAL: 'bg-red-500', HIGH: 'bg-orange-500', MEDIUM: 'bg-blue-500', LOW: 'bg-slate-400',
};

function TicketCard({ ticket, isDragging = false }: { ticket: Ticket; isDragging?: boolean }) {
  const navigate = useNavigate();
  const isOverdue = ticket.slaDeadline && new Date(ticket.slaDeadline) < new Date();

  return (
    <div
      className={clsx(
        'bg-white rounded-lg border border-slate-200 p-3 cursor-grab active:cursor-grabbing shadow-sm transition-shadow',
        isDragging ? 'shadow-xl opacity-80' : 'hover:shadow-md',
        isOverdue ? 'border-l-2 border-l-red-400' : '',
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-slate-500 font-mono">{ticket.ticketNumber}</span>
        <div className="flex items-center gap-1">
          <div className={clsx('w-2 h-2 rounded-full', PRIORITY_DOTS[ticket.priority])} />
          <span className={clsx('text-[10px] px-1.5 py-0.5 rounded border font-medium', PRIORITY_COLORS[ticket.priority])}>
            {ticket.priority}
          </span>
        </div>
      </div>

      <p
        className="text-sm font-medium text-slate-800 leading-snug mb-2 line-clamp-2 hover:text-blue-600 cursor-pointer"
        onClick={(e) => { e.stopPropagation(); navigate(`/tickets/${ticket.id}`); }}
      >
        {ticket.title}
      </p>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{format(new Date(ticket.createdAt), 'd MMM', { locale: es })}</span>
        {ticket.assignedTo ? (
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
            {ticket.assignedTo.firstName.charAt(0)}{ticket.assignedTo.lastName.charAt(0)}
          </div>
        ) : (
          <span className="text-slate-300">Sin asignar</span>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ ticket }: { ticket: Ticket }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: ticket.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners}>
      <TicketCard ticket={ticket} isDragging={isDragging} />
    </div>
  );
}

function KanbanColumn({ columnId, label, color, bg, header, tickets }: {
  columnId: string; label: string; color: string; bg: string; header: string; tickets: Ticket[];
}) {
  const { isOver, setNodeRef } = useDroppable({ id: columnId });

  return (
    <div className={clsx('flex flex-col rounded-xl border-2 min-h-[400px] transition-colors', color, isOver ? 'bg-blue-50' : bg)}>
      <div className={clsx('px-3 py-2 rounded-t-lg flex items-center justify-between', header)}>
        <span className="font-semibold text-white text-sm">{label}</span>
        <span className="bg-white/30 text-white text-xs px-2 py-0.5 rounded-full">{tickets.length}</span>
      </div>
      <div ref={setNodeRef} className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[600px]">
        {tickets.map((ticket) => (
          <DraggableCard key={ticket.id} ticket={ticket} />
        ))}
        {tickets.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">Sin tickets</p>
        )}
      </div>
    </div>
  );
}

export default function TicketKanban() {
  const [ticketsByStatus, setTicketsByStatus] = useState<Record<string, Ticket[]>>({
    OPEN: [], IN_PROGRESS: [], ON_HOLD: [], RESOLVED: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    const load = async () => {
      try {
        const res = await ticketsApi.getAll({ limit: 200 });
        const tickets: Ticket[] = res.data.data || [];
        const grouped: Record<string, Ticket[]> = { OPEN: [], IN_PROGRESS: [], ON_HOLD: [], RESOLVED: [] };
        for (const t of tickets) {
          if (grouped[t.status]) grouped[t.status].push(t);
        }
        setTicketsByStatus(grouped);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    const all = Object.values(ticketsByStatus).flat();
    setActiveTicket(all.find((t) => t.id === id) || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTicket(null);
    const { active, over } = event;
    if (!over) return;

    const ticketId = active.id as string;
    const newStatus = over.id as string;

    // Find current status
    let currentStatus = '';
    for (const [status, tickets] of Object.entries(ticketsByStatus)) {
      if (tickets.find((t) => t.id === ticketId)) { currentStatus = status; break; }
    }

    if (!currentStatus || currentStatus === newStatus) return;

    // Optimistic update
    setTicketsByStatus((prev) => {
      const ticket = prev[currentStatus].find((t) => t.id === ticketId)!;
      return {
        ...prev,
        [currentStatus]: prev[currentStatus].filter((t) => t.id !== ticketId),
        [newStatus]: [...prev[newStatus], { ...ticket, status: newStatus }],
      };
    });

    try {
      await ticketsApi.changeStatus(ticketId, newStatus);
    } catch {
      // Revert on error
      setTicketsByStatus((prev) => {
        const ticket = prev[newStatus].find((t) => t.id === ticketId)!;
        return {
          ...prev,
          [newStatus]: prev[newStatus].filter((t) => t.id !== ticketId),
          [currentStatus]: [...prev[currentStatus], { ...ticket, status: currentStatus }],
        };
      });
    }
  };

  if (loading) return (
    <div className="grid grid-cols-4 gap-4">
      {COLUMNS.map((c) => (
        <div key={c.id} className="rounded-xl border-2 border-slate-200 bg-slate-50 h-96 animate-pulse" />
      ))}
    </div>
  );

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            columnId={col.id}
            label={col.label}
            color={col.color}
            bg={col.bg}
            header={col.header}
            tickets={ticketsByStatus[col.id] || []}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTicket && <TicketCard ticket={activeTicket} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
