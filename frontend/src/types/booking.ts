import type {
    Booking as DashboardBooking,
    BookingStatus
} from "./dashboard";

export type { BookingStatus } from "./dashboard";


// ==========================================
// BOOKING MODEL
// ==========================================

export interface Booking extends DashboardBooking {

    decisionNote: string | null;

    createdAt: string;

}


// ==========================================
// CREATE BOOKING PAYLOAD
// ==========================================

export interface CreateBookingPayload {

    resourceId: string;

    startTime: string;

    endTime: string;

    purpose: string;

    ticketId?: string | null;

}


// ==========================================
// BOOKING FILTERS
// ==========================================

export interface BookingFilters {

    status: BookingStatus | "";

}

export interface AdminBookingFilters
    extends BookingFilters {

    resourceId: string;

    from: string;

    to: string;

}


// ==========================================
// BOOKING QUERY PARAMETERS
// ==========================================

export interface MyBookingsQuery
    extends BookingFilters {

    page: number;

}

export interface AdminBookingsQuery
    extends AdminBookingFilters {

    page: number;

}


// ==========================================
// PAGINATION
// ==========================================

export interface BookingPagination {

    page: number;

    limit: number;

    total: number;

    totalPages: number;

}


// ==========================================
// API RESPONSES
// ==========================================

export interface BookingListResponse {

    bookings: Booking[];

    pagination: BookingPagination;

}

export interface BookingDetailsResponse {

    booking: Booking;

}

export interface BookingMutationResponse {

    booking: Booking;

}


// ==========================================
// REJECT BOOKING PAYLOAD
// ==========================================

export interface RejectBookingPayload {

    note: string;

}


// ==========================================
// BOOKING STATUS OPTIONS
// ==========================================

export const bookingStatuses: BookingStatus[] = [

    "PENDING",

    "APPROVED",

    "REJECTED",

    "CANCELLED"

];


// ==========================================
// BOOKING STATUS LABELS
// ==========================================

export const bookingStatusLabels:
    Record<BookingStatus, string> = {

        PENDING: "Pending",

        APPROVED: "Approved",

        REJECTED: "Rejected",

        CANCELLED: "Cancelled"

    };


// ==========================================
// BOOKING CONSTRAINTS
// ==========================================

export const BOOKING_CONSTRAINTS = {

    MIN_DURATION_MINUTES: 30,

    MAX_DURATION_MINUTES: 240,

    SLOT_INTERVAL_MINUTES: 30,

    MAX_ADVANCE_DAYS: 30,

    MAX_ACTIVE_BOOKINGS: 3,

    MIN_PURPOSE_LENGTH: 5,

    MAX_PURPOSE_LENGTH: 200,

    PAGE_SIZE: 10

} as const;