import type { TicketStatus } from '../../types/ticket.types';
import { TICKET_STATUS_LABELS, TICKET_STATUS_COLORS } from '../../utils/constants';
import clsx from 'clsx';

export default function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', TICKET_STATUS_COLORS[status])}>
      {TICKET_STATUS_LABELS[status]}
    </span>
  );
}
