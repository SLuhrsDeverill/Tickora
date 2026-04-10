import type { TicketPriority } from '../../types/ticket.types';
import { TICKET_PRIORITY_LABELS, TICKET_PRIORITY_COLORS } from '../../utils/constants';
import clsx from 'clsx';

export default function TicketPriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', TICKET_PRIORITY_COLORS[priority])}>
      {TICKET_PRIORITY_LABELS[priority]}
    </span>
  );
}
