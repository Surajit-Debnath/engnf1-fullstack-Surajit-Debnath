import type { TicketCategory, TicketPriority, TicketStatus } from './dashboard';

export interface TicketFilters {
  q: string;
  category: TicketCategory | '';
  priority: TicketPriority | '';
  status: TicketStatus | '';
}

export interface TicketQuery extends TicketFilters {
  page: number;
  limit: number;
}

export interface ImportTicket {
  externalId: string;
  subject: string;
  body: string;
}

export interface ImportTicketResponse {
  importedCount: number;
  updatedCount: number;
  skippedOverrideCount: number;
  total: number;
}

export const categories: TicketCategory[] = [
  'BILLING',
  'BUG',
  'FEATURE_REQUEST',
  'LOGIN',
  'DELIVERY',
];

export const priorities: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export const statuses: TicketStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
];

export function formatLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
