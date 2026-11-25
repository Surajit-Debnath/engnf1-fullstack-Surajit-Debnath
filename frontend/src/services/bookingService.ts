import { api } from "./api";

import type {

    CreateBookingPayload,

    MyBookingsQuery,

    AdminBookingsQuery,

    BookingListResponse,

    BookingDetailsResponse,

    BookingMutationResponse,

    RejectBookingPayload

} from "../types/booking";


// ==========================================
// CREATE BOOKING
// ==========================================

export async function createBooking(

    payload: CreateBookingPayload

): Promise<BookingMutationResponse> {

    const response =
        await api.post<BookingMutationResponse>(
            "/bookings",
            payload
        );

    return response.data;

}


// ==========================================
// GET MY BOOKINGS
// ==========================================

export async function getMyBookings(

    query: MyBookingsQuery,

    signal?: AbortSignal

): Promise<BookingListResponse> {

    const response =
        await api.get<BookingListResponse>(
            "/bookings/mine",
            {
                params: {

                    status:
                        query.status || undefined,

                    page:
                        query.page

                },

                signal
            }
        );

    return response.data;

}


// ==========================================
// GET BOOKING DETAILS
// ==========================================

export async function getBookingDetails(

    id: string,

    signal?: AbortSignal

): Promise<BookingDetailsResponse> {

    const response =
        await api.get<BookingDetailsResponse>(
            `/bookings/${id}`,
            {
                signal
            }
        );

    return response.data;

}


// ==========================================
// GET ALL BOOKINGS (ADMIN)
// ==========================================

export async function getAllBookings(

    query: AdminBookingsQuery,

    signal?: AbortSignal

): Promise<BookingListResponse> {

    const response =
        await api.get<BookingListResponse>(
            "/bookings",
            {
                params: {

                    status:
                        query.status || undefined,

                    resourceId:
                        query.resourceId || undefined,

                    from:
                        query.from || undefined,

                    to:
                        query.to || undefined,

                    page:
                        query.page

                },

                signal
            }
        );

    return response.data;

}


// ==========================================
// CANCEL BOOKING
// ==========================================

export async function cancelBooking(

    id: string

): Promise<BookingMutationResponse> {

    const response =
        await api.patch<BookingMutationResponse>(
            `/bookings/${id}/cancel`
        );

    return response.data;

}


// ==========================================
// APPROVE BOOKING (ADMIN)
// ==========================================

export async function approveBooking(

    id: string

): Promise<BookingMutationResponse> {

    const response =
        await api.patch<BookingMutationResponse>(
            `/bookings/${id}/approve`
        );

    return response.data;

}


// ==========================================
// REJECT BOOKING (ADMIN)
// ==========================================

export async function rejectBooking(

    id: string,

    payload: RejectBookingPayload

): Promise<BookingMutationResponse> {

    const response =
        await api.patch<BookingMutationResponse>(
            `/bookings/${id}/reject`,
            payload
        );

    return response.data;

}