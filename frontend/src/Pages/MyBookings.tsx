import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import axios from "axios";

import {
    CalendarDays,
    CalendarPlus,
    CalendarCheck,
    Clock3,
    CircleX,
    Ban,
    RefreshCw,
    LoaderCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    CalendarClock,
    ArrowRight
} from "lucide-react";

import { Button } from "../components/ui/Button";

import BookingCard from "../components/bookings/BookingCard";

import { getMyBookings } from "../services/bookingService";

import { getResourceDetails } from "../services/resourceService";

import {
    bookingStatuses,
    bookingStatusLabels
} from "../types/booking";

import type {
    Booking,
    BookingStatus,
    BookingListResponse
} from "../types/booking";

import type { Resource } from "../types/resource";


// ==========================================
// BOOKING SUMMARY TYPE
// ==========================================

interface BookingSummary {

    total: number;

    PENDING: number;

    APPROVED: number;

    REJECTED: number;

    CANCELLED: number;

}


// ==========================================
// ERROR MESSAGE UTILITY
// ==========================================

function getErrorMessage(
    error: unknown,
    fallback: string
): string {

    if (axios.isAxiosError(error)) {

        const message =
            error.response?.data?.error?.message ??
            error.response?.data?.message;

        if (typeof message === "string") {

            return message;

        }

    }

    return fallback;

}


// ==========================================
// MY BOOKINGS PAGE
// ==========================================

export default function MyBookings() {

    const navigate = useNavigate();


    // ==========================================
    // PAGE STATE
    // ==========================================

    const [data, setData] =
        useState<BookingListResponse | null>(null);

    const [summary, setSummary] =
        useState<BookingSummary | null>(null);

    const [resources, setResources] =
        useState<Record<string, Resource>>({});

    const [statusFilter, setStatusFilter] =
        useState<BookingStatus | "">("");

    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);

    const [summaryLoading, setSummaryLoading] =
        useState(true);

    const [error, setError] = useState("");

    const [summaryError, setSummaryError] =
        useState("");

    const [refreshKey, setRefreshKey] =
        useState(0);


    // ==========================================
    // FETCH BOOKING SUMMARY
    // ==========================================

    useEffect(() => {

        const controller = new AbortController();

        async function fetchSummary() {

            setSummaryLoading(true);

            setSummaryError("");

            try {

                const [
                    all,
                    pending,
                    approved,
                    rejected,
                    cancelled
                ] = await Promise.all([

                    getMyBookings(
                        { status: "", page: 1 },
                        controller.signal
                    ),

                    getMyBookings(
                        { status: "PENDING", page: 1 },
                        controller.signal
                    ),

                    getMyBookings(
                        { status: "APPROVED", page: 1 },
                        controller.signal
                    ),

                    getMyBookings(
                        { status: "REJECTED", page: 1 },
                        controller.signal
                    ),

                    getMyBookings(
                        { status: "CANCELLED", page: 1 },
                        controller.signal
                    )

                ]);

                if (controller.signal.aborted) return;

                setSummary({

                    total: all.pagination.total,

                    PENDING: pending.pagination.total,

                    APPROVED: approved.pagination.total,

                    REJECTED: rejected.pagination.total,

                    CANCELLED: cancelled.pagination.total

                });

            } catch (err) {

                if (
                    controller.signal.aborted ||
                    axios.isCancel(err)
                ) {
                    return;
                }

                setSummaryError(

                    getErrorMessage(
                        err,
                        "Unable to load booking summary."
                    )

                );

            } finally {

                if (!controller.signal.aborted) {

                    setSummaryLoading(false);

                }

            }

        }

        const timer = window.setTimeout(
            fetchSummary,
            0
        );

        return () => {

            window.clearTimeout(timer);

            controller.abort();

        };

    }, [refreshKey]);


    // ==========================================
    // FETCH BOOKINGS
    // ==========================================

    useEffect(() => {

        const controller = new AbortController();

        async function fetchBookings() {

            setLoading(true);

            setError("");

            try {

                const response = await getMyBookings(

                    {
                        status: statusFilter,
                        page
                    },

                    controller.signal

                );

                if (controller.signal.aborted) return;

                const lastPage = Math.max(
                    1,
                    response.pagination.totalPages
                );

                if (page > lastPage) {

                    setPage(lastPage);

                    return;

                }

                setData(response);

            } catch (err) {

                if (
                    controller.signal.aborted ||
                    axios.isCancel(err)
                ) {
                    return;
                }

                setError(

                    getErrorMessage(
                        err,
                        "Unable to load your bookings."
                    )

                );

            } finally {

                if (!controller.signal.aborted) {

                    setLoading(false);

                }

            }

        }

        const timer = window.setTimeout(
            fetchBookings,
            0
        );

        return () => {

            window.clearTimeout(timer);

            controller.abort();

        };

    }, [
        statusFilter,
        page,
        refreshKey
    ]);


    // ==========================================
    // FETCH RESOURCE INFORMATION
    // ==========================================

    useEffect(() => {

        if (!data || data.bookings.length === 0) {

            return;

        }

        const controller = new AbortController();

        const resourceIds = [

            ...new Set(

                data.bookings.map(
                    booking => booking.resourceId
                )

            )

        ];

        async function fetchResources() {

            const results = await Promise.allSettled(

                resourceIds.map(id =>

                    getResourceDetails(
                        id,
                        controller.signal
                    )

                )

            );

            if (controller.signal.aborted) return;

            const resourceMap: Record<string, Resource> = {};

            results.forEach(result => {

                if (result.status === "fulfilled") {

                    const resource =
                        result.value.resource;

                    resourceMap[resource._id] = resource;

                }

            });

            setResources(previous => ({

                ...previous,

                ...resourceMap

            }));

        }

        void fetchResources();

        return () => controller.abort();

    }, [data]);


    // ==========================================
    // FILTER HANDLER
    // ==========================================

    function handleStatusChange(
        status: BookingStatus | ""
    ) {

        if (status === statusFilter) return;

        setLoading(true);

        setStatusFilter(status);

        setPage(1);

    }


    // ==========================================
    // REFRESH HANDLER
    // ==========================================

    function handleRefresh() {

        setLoading(true);

        setSummaryLoading(true);

        setResources({});

        setRefreshKey(previous => previous + 1);

    }


    // ==========================================
    // VIEW BOOKING DETAILS
    // ==========================================

    function handleViewBooking(booking: Booking) {

        navigate(
            `/dashboard/bookings/${booking._id}`
        );

    }


    // ==========================================
    // DERIVED VALUES
    // ==========================================

    const bookings = data?.bookings ?? [];

    const total = data?.pagination.total ?? 0;

    const totalPages =
        data?.pagination.totalPages ?? 0;

    const pageSize =
        data?.pagination.limit ?? 10;

    const firstItem =
        total === 0
            ? 0
            : (page - 1) * pageSize + 1;

    const lastItem = Math.min(
        page * pageSize,
        total
    );


    // ==========================================
    // SUMMARY CARD CONFIGURATION
    // ==========================================

    const summaryCards = [

        {
            label: "Total Bookings",
            value: summary?.total,
            icon: CalendarDays,
            color: "bg-indigo-50 text-indigo-600",
            status: "" as const
        },

        {
            label: "Pending",
            value: summary?.PENDING,
            icon: Clock3,
            color: "bg-amber-50 text-amber-600",
            status: "PENDING" as const
        },

        {
            label: "Approved",
            value: summary?.APPROVED,
            icon: CalendarCheck,
            color: "bg-emerald-50 text-emerald-600",
            status: "APPROVED" as const
        },

        {
            label: "Rejected",
            value: summary?.REJECTED,
            icon: CircleX,
            color: "bg-red-50 text-red-600",
            status: "REJECTED" as const
        },

        {
            label: "Cancelled",
            value: summary?.CANCELLED,
            icon: Ban,
            color: "bg-slate-100 text-slate-600",
            status: "CANCELLED" as const
        }

    ];


    // ==========================================
    // RENDER
    // ==========================================

    return (

        <div className="space-y-6">


            {/* Page Header */}

            <div className="flex flex-wrap items-center justify-between gap-4">

                <div>

                    <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">

                        My Bookings

                    </h1>

                    <p className="mt-2 text-sm text-slate-500">

                        Track and manage your resource booking requests.

                    </p>

                </div>

                <div className="flex flex-wrap gap-3">

                    <Button
                        variant="secondary"
                        size="sm"
                        text="Refresh"
                        startIcon={<RefreshCw size={17} />}
                        onClick={handleRefresh}
                        disabled={loading || summaryLoading}
                    />

                    <Button
                        variant="primary"
                        size="sm"
                        text="New Booking"
                        startIcon={<CalendarPlus size={18} />}
                        onClick={() =>
                            navigate("/dashboard/resources")
                        }
                    />

                </div>

            </div>


            {/* Booking Banner */}

            <section className="relative overflow-hidden rounded-2xl bg-linear-to-r from-indigo-600 to-violet-600 p-6 text-white sm:p-8">

                <div className="relative z-10 max-w-xl">

                    <h2 className="text-xl font-bold sm:text-2xl">

                        Schedule Your Next Session

                    </h2>

                    <p className="mt-3 text-sm leading-relaxed text-indigo-100">

                        Reserve rooms, diagnostic laboratories
                        and equipment for your support activities.
                        Track every request from submission to approval.

                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/dashboard/resources")
                        }
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
                    >

                        Explore Resources

                        <ArrowRight size={17} />

                    </button>

                </div>

                <CalendarClock
                    size={180}
                    strokeWidth={1}
                    className="absolute -bottom-8 -right-5 hidden rotate-12 text-white/10 sm:block"
                />

            </section>


            {/* Booking Summary */}

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-5">

                {summaryCards.map(card => {

                    const Icon = card.icon;

                    const isSelected =
                        statusFilter === card.status;

                    return (

                        <button
                            key={card.label}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() =>
                                handleStatusChange(card.status)
                            }
                            className={`rounded-2xl border bg-white p-4 text-left transition hover:border-indigo-300 hover:shadow-sm ${
                                isSelected
                                    ? "border-indigo-400 ring-1 ring-indigo-100"
                                    : "border-slate-200"
                            }`}
                        >

                            <div className={`w-fit rounded-xl p-3 ${card.color}`}>

                                <Icon size={23} />

                            </div>

                            <p className="mt-4 text-xs font-medium text-slate-500">

                                {card.label}

                            </p>

                            <h2 className="mt-1 text-2xl font-bold text-slate-900">

                                {summaryLoading ? (

                                    <span className="block h-7 w-12 animate-pulse rounded bg-slate-200" />

                                ) : summaryError ? (

                                    "—"

                                ) : (

                                    card.value ?? "—"

                                )}

                            </h2>

                        </button>

                    );

                })}

            </div>


            {/* Summary Error */}

            {summaryError && (

                <div
                    role="alert"
                    className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
                >

                    <AlertCircle
                        size={19}
                        className="shrink-0 text-amber-600"
                    />

                    <p className="text-sm text-amber-700">

                        {summaryError}

                        {" "}You can still view your bookings below.

                    </p>

                </div>

            )}


            {/* Booking Filters */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5">

                <div className="flex flex-wrap items-center justify-between gap-4">

                    <div>

                        <h2 className="font-semibold text-slate-900">

                            Filter Bookings

                        </h2>

                        <p className="mt-1 text-xs text-slate-500">

                            Filter your requests by booking status.

                        </p>

                    </div>

                    {statusFilter && (

                        <button
                            type="button"
                            onClick={() =>
                                handleStatusChange("")
                            }
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >

                            Reset Filter

                        </button>

                    )}

                </div>

                <div className="mt-5 flex flex-wrap gap-2">

                    <button
                        type="button"
                        aria-pressed={statusFilter === ""}
                        onClick={() =>
                            handleStatusChange("")
                        }
                        className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                            statusFilter === ""
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                    >

                        All Bookings

                    </button>

                    {bookingStatuses.map(status => (

                        <button
                            key={status}
                            type="button"
                            aria-pressed={
                                statusFilter === status
                            }
                            onClick={() =>
                                handleStatusChange(status)
                            }
                            className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                                statusFilter === status
                                    ? "border-indigo-600 bg-indigo-600 text-white"
                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                        >

                            {bookingStatusLabels[status]}

                        </button>

                    ))}

                </div>

            </section>


            {/* Booking List Header */}

            <div className="flex flex-wrap items-center justify-between gap-3">

                <div>

                    <h2 className="text-lg font-semibold text-slate-900">

                        {statusFilter
                            ? `${bookingStatusLabels[statusFilter]} Bookings`
                            : "All Bookings"}

                    </h2>

                    <p className="mt-1 text-sm text-slate-500">

                        {loading
                            ? "Loading bookings..."
                            : error
                                ? "Unable to load bookings"
                                : `${total} booking${total === 1 ? "" : "s"} found`}

                    </p>

                </div>

            </div>


            {/* Loading State */}

            {loading ? (

                <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white">

                    <LoaderCircle
                        size={36}
                        className="animate-spin text-indigo-600"
                    />

                    <p className="mt-4 text-sm text-slate-500">

                        Loading your bookings...

                    </p>

                </div>

            ) : error ? (


                /* Error State */

                <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-red-200 bg-white p-6 text-center">

                    <div className="rounded-full bg-red-50 p-4">

                        <AlertCircle
                            size={34}
                            className="text-red-500"
                        />

                    </div>

                    <h3 className="mt-4 text-lg font-semibold text-slate-900">

                        Unable to Load Bookings

                    </h3>

                    <p className="mt-2 max-w-md text-sm text-slate-500">

                        {error}

                    </p>

                    <div className="mt-5">

                        <Button
                            variant="primary"
                            size="sm"
                            text="Try Again"
                            startIcon={<RefreshCw size={16} />}
                            onClick={handleRefresh}
                        />

                    </div>

                </div>

            ) : bookings.length === 0 ? (


                /* Empty State */

                <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">

                    <div className="rounded-full bg-indigo-50 p-5">

                        <CalendarDays
                            size={42}
                            className="text-indigo-500"
                        />

                    </div>

                    <h3 className="mt-5 text-lg font-semibold text-slate-900">

                        {statusFilter
                            ? "No Matching Bookings"
                            : "No Bookings Yet"}

                    </h3>

                    <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">

                        {statusFilter
                            ? "You do not have any bookings with the selected status."
                            : "You have not requested any resource bookings. Explore available resources to create your first booking."}

                    </p>

                    <div className="mt-5">

                        <Button
                            variant="primary"
                            size="md"
                            text={
                                statusFilter
                                    ? "View All Bookings"
                                    : "Explore Resources"
                            }
                            startIcon={
                                statusFilter
                                    ? <CalendarDays size={18} />
                                    : <CalendarPlus size={18} />
                            }
                            onClick={() => {

                                if (statusFilter) {

                                    handleStatusChange("");

                                } else {

                                    navigate(
                                        "/dashboard/resources"
                                    );

                                }

                            }}
                        />

                    </div>

                </div>

            ) : (


                /* Booking Grid */

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">

                    {bookings.map(booking => {

                        const resource =
                            resources[booking.resourceId];

                        return (

                            <BookingCard
                                key={booking._id}
                                booking={booking}
                                resourceName={resource?.name}
                                resourceType={resource?.type}
                                onView={handleViewBooking}
                            />

                        );

                    })}

                </div>

            )}


            {/* Pagination */}

            {!loading && !error && total > 0 && (

                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">

                    <p className="text-sm text-slate-500">

                        Showing{" "}

                        <span className="font-semibold text-slate-700">

                            {firstItem}–{lastItem}

                        </span>

                        {" "}of{" "}

                        <span className="font-semibold text-slate-700">

                            {total}

                        </span>

                        {" "}bookings

                    </p>

                    <div className="flex items-center gap-3">

                        <Button
                            variant="secondary"
                            size="sm"
                            text="Previous"
                            startIcon={<ChevronLeft size={17} />}
                            disabled={page <= 1}
                            onClick={() => {

                                setLoading(true);

                                setPage(previous =>
                                    Math.max(1, previous - 1)
                                );

                            }}
                        />

                        <span className="text-sm font-medium text-slate-600">

                            {page} / {Math.max(1, totalPages)}

                        </span>

                        <Button
                            variant="secondary"
                            size="sm"
                            text="Next"
                            endIcon={<ChevronRight size={17} />}
                            disabled={page >= totalPages}
                            onClick={() => {

                                setLoading(true);

                                setPage(previous =>
                                    previous + 1
                                );

                            }}
                        />

                    </div>

                </div>

            )}

        </div>

    );

}