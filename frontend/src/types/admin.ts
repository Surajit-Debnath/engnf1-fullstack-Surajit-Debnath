import type {
  TicketCategory,
  TicketPriority,
  TicketStatus,
  BookingStatus,
} from './dashboard';

export interface CountRow<T extends string> {
  _id: T;
  count: number;
}

export interface TopResource {
  resourceId: string;
  name: string;
  type: string;
  bookingCount: number;
}

export interface AdminStats {
  activeResources: number;

  bookingsByStatus: Record<BookingStatus, number>;

  topResources: TopResource[];

  ticketStats: {
    byCategory: CountRow<TicketCategory>[];
    byPriority: CountRow<TicketPriority>[];
    byStatus: CountRow<TicketStatus>[];
  };
}
