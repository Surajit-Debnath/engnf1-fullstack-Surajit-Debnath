export type Role = "USER" | "ADMIN";

export type TicketCategory =
    | "BILLING"
    | "BUG"
    | "FEATURE_REQUEST"
    | "LOGIN"
    | "DELIVERY";

export type TicketPriority =
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "URGENT";

export type TicketStatus =
    | "OPEN"
    | "IN_PROGRESS"
    | "RESOLVED"
    | "CLOSED";

export type BookingStatus =
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED";

export interface User {
    _id: string;
    name: string;
    email: string;
    role: Role;
}

export interface Ticket {
    _id: string;
    externalId: string;
    subject: string;
    body: string;
    category: TicketCategory;
    autoCategory: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;
    isReviewed: boolean;
    isHumanOverride: boolean;
    createdAt: string;
}

export interface TicketStats {
    byCategory: Record<TicketCategory, number>;
    byPriority: Record<TicketPriority, number>;
    byStatus: Record<TicketStatus, number>;
    reviewedCount: number;
    modelAgreementRate: number;
}

export interface Booking {
    _id: string;
    resourceId: string;
    userId: string;
    ticketId: string | null;
    startTime: string;
    endTime: string;
    purpose: string;
    status: BookingStatus;
}

export interface TicketResponse {
    tickets: Ticket[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface BookingResponse {
    bookings: Booking[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}