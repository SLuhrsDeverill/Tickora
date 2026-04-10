import type { TicketStatus, TicketPriority, TicketCategory } from '../types/ticket.types';
import type { AssetType, AssetStatus } from '../types/asset.types';

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En Progreso',
  ON_HOLD: 'En Espera',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
};

export const TICKET_STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  ON_HOLD: 'bg-gray-100 text-gray-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-200 text-gray-700',
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

export const TICKET_PRIORITY_COLORS: Record<TicketPriority, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-amber-100 text-amber-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  HARDWARE: 'Hardware',
  SOFTWARE: 'Software',
  NETWORK: 'Red',
  EMAIL: 'Email',
  PRINTER: 'Impresora',
  ACCESS_PERMISSIONS: 'Accesos y Permisos',
  PHONE: 'Teléfono',
  OTHER: 'Otros',
};

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  LAPTOP: 'Laptop', DESKTOP: 'Desktop', MONITOR: 'Monitor', KEYBOARD: 'Teclado',
  MOUSE: 'Mouse', PRINTER: 'Impresora', PHONE: 'Teléfono', TABLET: 'Tablet',
  SERVER: 'Servidor', SWITCH: 'Switch', ROUTER: 'Router', UPS: 'UPS',
  HEADSET: 'Auricular', WEBCAM: 'Webcam', DOCKING_STATION: 'Docking Station', OTHER: 'Otro',
};

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  ACTIVE: 'Activo',
  IN_REPAIR: 'En Reparación',
  RETIRED: 'Retirado',
  AVAILABLE: 'Disponible',
  RESERVED: 'Reservado',
};

export const ASSET_STATUS_COLORS: Record<AssetStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  IN_REPAIR: 'bg-amber-100 text-amber-800',
  RETIRED: 'bg-gray-200 text-gray-700',
  AVAILABLE: 'bg-blue-100 text-blue-800',
  RESERVED: 'bg-purple-100 text-purple-800',
};
