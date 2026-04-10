export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TicketCategory =
  | 'HARDWARE'
  | 'SOFTWARE'
  | 'NETWORK'
  | 'EMAIL'
  | 'PRINTER'
  | 'ACCESS_PERMISSIONS'
  | 'PHONE'
  | 'OTHER';

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  createdById: string;
  createdBy: { id: string; firstName: string; lastName: string; email: string; avatar?: string };
  assignedToId?: string;
  assignedTo?: { id: string; firstName: string; lastName: string; email: string; avatar?: string };
  resolution?: string;
  resolvedAt?: string;
  closedAt?: string;
  firstResponseAt?: string;
  slaDeadline?: string;
  assetId?: string;
  asset?: { id: string; assetTag: string; name: string; type?: string };
  createdAt: string;
  updatedAt: string;
  comments?: Comment[];
  history?: TicketHistory[];
  attachments?: Attachment[];
  _count?: { comments: number };
}

export interface Comment {
  id: string;
  content: string;
  isInternal: boolean;
  ticketId: string;
  authorId: string;
  author: { id: string; firstName: string; lastName: string; avatar?: string; role: string };
  createdAt: string;
  updatedAt: string;
}

export interface TicketHistory {
  id: string;
  ticketId: string;
  field: string;
  oldValue?: string;
  newValue?: string;
  changedById: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}
