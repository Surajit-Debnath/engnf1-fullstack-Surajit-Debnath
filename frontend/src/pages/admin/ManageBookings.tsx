import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import axios from "axios";

import {
    CalendarDays,
    CalendarCheck,
    CalendarClock,
    Clock3,
    CircleX,
    Ban,
    RefreshCw,
    LoaderCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Filter,
    RotateCcw,
    ShieldCheck
} from "lucide-react";

import { Button } from "../../components/ui/Button";

import BookingCard from "../../components/bookings/BookingCard";

import {
    getAllBookings
} from "../../services/bookingService";

import {
    getResources
} from "../../services/resourceService";

import {
    bookingStatuses,
    bookingStatusLabels
} from "../../types/booking";

import type {
    Booking,
    BookingStatus,
    AdminBookingFilters,
    BookingListResponse
} from "../../types/booking";

import type {
    Resource
} from "../../types/resource";


// ==========================================
// DEFAULT FILTERS
// ==========================================

const defaultFilters: AdminBookingFilters = {

    status: "",

    resourceId: "",

    from: "",

    to: ""

};


// ==========================================
// SUMMARY TYPE
// ==========================================

interface BookingSummary {

    total: number;

    PENDING: number;

    APPROVED: number;

    REJECTED: number;

    CANCELLED: number;

}


// ==========================================
// ERROR UTILITY
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
// DATE RANGE UTILITIES
// ==========================================

function getStartOfDate(value: string): string {

    if (!value) return "";

    const [year, month, day] =
        value.split("-").map(Number);

    return new Date(
        year,
        month - 1,
        day,
        0,
        0,
        0,
        0
    ).toISOString();

}


function getEndOfDate(value: string): string {

    if (!value) return "";

    const [year, month, day] =
        value.split("-").map(Number);

    // Exclusive midnight of the following day.

    return new Date(
        year,
        month - 1,
        day + 1,
        0,
        0,
        0,
        0
    ).toISOString();

}


// ==========================================
// MANAGE BOOKINGS PAGE
// ==========================================

export default function ManageBookings() {

    const navigate = useNavigate();


    // ==========================================
    // PAGE STATE
    // ==========================================

    const [data, setData] =
        useState<BookingListResponse | null>(null);

    const [summary, setSummary] =
        useState<BookingSummary | null>(null);

    const [resources, setResources] =
        useState<Resource[]>([]);

    const [filters, setFilters] =
        useState<AdminBookingFilters>({
            ...defaultFilters
        });

    const [appliedFilters, setAppliedFilters] =
        useState<AdminBookingFilters>({
            ...defaultFilters
        });

    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);

    const [summaryLoading, setSummaryLoading] =
        useState(true);

    const [resourcesLoading, setResourcesLoading] =
        useState(true);

    const [error, setError] = useState("");

    const [summaryError, setSummaryError] =
        useState("");

    const [resourcesError, setResourcesError] =
        useState("");

    const [filterError, setFilterError] =
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

                    getAllBookings(
                        {
                            ...defaultFilters,
                            page: 1
                        },
                        controller.signal
                    ),

                    getAllBookings(
                        {
                            ...defaultFilters,
                            status: "PENDING",
                            page: 1
                        },
                        controller.signal
                    ),

                    getAllBookings(
                        {
                            ...defaultFilters,
                            status: "APPROVED",
                            page: 1
                        },
                        controller.signal
                    ),

                    getAllBookings(
                        {
                            ...defaultFilters,
                            status: "REJECTED",
                            page: 1
                        },
                        controller.signal
                    ),

                    getAllBookings(
                        {
                            ...defaultFilters,
                            status: "CANCELLED",
                            page: 1
                        },
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
    // FETCH ALL RESOURCES
    // ==========================================

    useEffect(() => {

        const controller = new AbortController();

        async function fetchResources() {

            setResourcesLoading(true);

            setResourcesError("");

            try {

                const firstResponse =
                    await getResources(

                        {
                            search: "",
                            type: "",
                            minCapacity: "",
                            page: 1
                        },

                        controller.signal

                    );

                const allResources = [
                    ...firstResponse.data
                ];

                // The resource endpoint is paginated.
                // Fetch every remaining page.

                for (
                    let currentPage = 2;
                    currentPage <= firstResponse.totalPages;
                    currentPage++
                ) {

                    if (controller.signal.aborted) return;

                    const response = await getResources(

                        {
                            search: "",
                            type: "",
                            minCapacity: "",
                            page: currentPage
                        },

                        controller.signal

                    );

                    allResources.push(...response.data);

                }

                if (controller.signal.aborted) return;

                // Remove duplicate resources.

                const uniqueResources = Array.from(

                    new Map(

                        allResources.map(resource => [

                            resource._id,

                            resource

                        ])

                    ).values()

                );

                uniqueResources.sort((a, b) =>

                    a.name.localeCompare(b.name)

                );

                setResources(uniqueResources);

            } catch (err) {

                if (
                    controller.signal.aborted ||
                    axios.isCancel(err)
                ) {
                    return;
                }

                setResourcesError(

                    getErrorMessage(
                        err,
                        "Unable to load resources."
                    )

                );

            } finally {

                if (!controller.signal.aborted) {

                    setResourcesLoading(false);

                }

            }

        }

        const timer = window.setTimeout(
            fetchResources,
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

                const response =
                    await getAllBookings(

                        {

                            status:
                                appliedFilters.status,

                            resourceId:
                                appliedFilters.resourceId,

                            from:
                                getStartOfDate(
                                    appliedFilters.from
                                ),

                            to:
                                getEndOfDate(
                                    appliedFilters.to
                                ),

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
                        "Unable to load bookings."
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
        appliedFilters,
        page,
        refreshKey
    ]);


    // ==========================================
    // FILTER CHANGE
    // ==========================================

    function handleFilterChange<
        K extends keyof AdminBookingFilters
    >(
        field: K,
        value: AdminBookingFilters[K]
    ) {

        setFilters(previous => ({

            ...previous,

            [field]: value

        }));

        setFilterError("");

    }


    // ==========================================
    // APPLY FILTERS
    // ==========================================

    function handleApplyFilters() {

        setFilterError("");

        const { from, to } = filters;

        // Both dates must be provided together.

        if (Boolean(from) !== Boolean(to)) {

            setFilterError(
                "Please select both a start date and an end date."
            );

            return;

        }

        // The end date cannot precede the start date.

        if (from && to && from > to) {

            setFilterError(
                "The end date cannot be earlier than the start date."
            );

            return;

        }

        setLoading(true);

        setPage(1);

        setAppliedFilters({
            ...filters
        });

    }


    // ==========================================
    // RESET FILTERS
    // ==========================================

    function handleResetFilters() {

        setFilters({
            ...defaultFilters
        });

        setAppliedFilters({
            ...defaultFilters
        });

        setFilterError("");

        setLoading(true);

        setPage(1);

    }


    // ==========================================
    // SUMMARY CARD FILTER
    // ==========================================

    function handleSummaryFilter(
        status: BookingStatus | ""
    ) {

        // Summary counts are global.
        // Clear resource and date filters to match them.

        const nextFilters: AdminBookingFilters = {

            ...defaultFilters,

            status

        };

        setFilters(nextFilters);

        setAppliedFilters({
            ...nextFilters
        });

        setFilterError("");

        setLoading(true);

        setPage(1);

    }


    // ==========================================
    // REFRESH
    // ==========================================

    function handleRefresh() {

        setLoading(true);

        setSummaryLoading(true);

        setResourcesLoading(true);

        setRefreshKey(previous => previous + 1);

    }


    // ==========================================
    // VIEW BOOKING
    // ==========================================

    function handleViewBooking(booking: Booking) {

        navigate(

            `/admin/dashboard/bookings/${booking._id}`

        );

    }


    // ==========================================
    // DERIVED VALUES
    // ==========================================

    const bookings = data?.bookings ?? [];

    const total =
        data?.pagination.total ?? 0;

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

    const hasAppliedFilters = Boolean(

        appliedFilters.status ||

        appliedFilters.resourceId ||

        appliedFilters.from ||

        appliedFilters.to

    );

    const hasUnsavedFilters =

        filters.status !== appliedFilters.status ||

        filters.resourceId !== appliedFilters.resourceId ||

        filters.from !== appliedFilters.from ||

        filters.to !== appliedFilters.to;


    // Resource lookup map.

    const resourceMap = new Map(

        resources.map(resource => [

            resource._id,

            resource

        ])

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

                        Manage Bookings

                    </h1>

                    <p className="mt-2 text-sm text-slate-500">

                        Monitor, review and manage all resource booking requests.

                    </p>

                </div>

                <Button
                    variant="secondary"
                    size="sm"
                    text="Refresh"
                    startIcon={<RefreshCw size={17} />}
                    onClick={handleRefresh}
                    disabled={
                        loading ||
                        summaryLoading ||
                        resourcesLoading
                    }
                />

            </div>


            {/* Administrator Banner */}

            <section className="relative overflow-hidden rounded-2xl bg-linear-to-r from-slate-900 to-indigo-900 p-6 text-white sm:p-8">

                <div className="relative z-10 max-w-xl">

                    <div className="flex items-center gap-2 text-indigo-200">

                        <ShieldCheck size={19} />

                        <span className="text-xs font-semibold uppercase tracking-wider">

                            Administrator Control

                        </span>

                    </div>

                    <h2 className="mt-4 text-xl font-bold sm:text-2xl">

                        Resource Scheduling Management

                    </h2>

                    <p className="mt-3 text-sm leading-relaxed text-slate-300">

                        Review incoming booking requests,
                        approve resource allocations and
                        monitor scheduling activities across
                        your support team.

                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            handleSummaryFilter("PENDING")
                        }
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                    >

                        <Clock3 size={17} />

                        Review Pending Requests

                    </button>

                </div>

                <CalendarClock
                    size={190}
                    strokeWidth={1}
                    className="absolute -bottom-8 -right-4 hidden rotate-12 text-white/10 sm:block"
                />

            </section>


            {/* Booking Summary */}

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-5">

                {summaryCards.map(card => {

                    const Icon = card.icon;

                    const isSelected =

                        appliedFilters.status === card.status &&

                        !appliedFilters.resourceId &&

                        !appliedFilters.from &&

                        !appliedFilters.to;

                    return (

                        <button
                            key={card.label}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() =>
                                handleSummaryFilter(card.status)
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
                        size={20}
                        className="shrink-0 text-amber-600"
                    />

                    <p className="text-sm text-amber-700">

                        {summaryError}

                    </p>

                </div>

            )}


            {/* Booking Filters */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">

                <div className="flex flex-wrap items-center justify-between gap-4">

                    <div className="flex items-center gap-3">

                        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">

                            <Filter size={22} />

                        </div>

                        <div>

                            <h2 className="font-semibold text-slate-900">

                                Filter Bookings

                            </h2>

                            <p className="mt-1 text-xs text-slate-500">

                                Find booking requests using advanced filters.

                            </p>

                        </div>

                    </div>

                    <Button
                        variant="secondary"
                        size="sm"
                        text="Reset"
                        startIcon={<RotateCcw size={16} />}
                        onClick={handleResetFilters}
                        disabled={
                            !hasAppliedFilters &&
                            !hasUnsavedFilters &&
                            !filterError
                        }
                    />

                </div>


                {/* Filter Form */}

                <form
                    onSubmit={event => {

                        event.preventDefault();

                        handleApplyFilters();

                    }}
                    className="mt-6"
                >

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">


                        {/* Status Filter */}

                        <div>

                            <label
                                htmlFor="booking-status"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >

                                Booking Status

                            </label>

                            <select
                                id="booking-status"
                                value={filters.status}
                                onChange={event =>

                                    handleFilterChange(

                                        "status",

                                        event.target.value as BookingStatus | ""

                                    )

                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            >

                                <option value="">

                                    All Statuses

                                </option>

                                {bookingStatuses.map(status => (

                                    <option
                                        key={status}
                                        value={status}
                                    >

                                        {bookingStatusLabels[status]}

                                    </option>

                                ))}

                            </select>

                        </div>


                        {/* Resource Filter */}

                        <div>

                            <label
                                htmlFor="booking-resource"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >

                                Resource

                            </label>

                            <select
                                id="booking-resource"
                                value={filters.resourceId}
                                disabled={
                                    resourcesLoading ||
                                    Boolean(resourcesError)
                                }
                                onChange={event =>

                                    handleFilterChange(

                                        "resourceId",

                                        event.target.value

                                    )

                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                            >

                                <option value="">

                                    {resourcesLoading
                                        ? "Loading resources..."
                                        : "All Resources"}

                                </option>

                                {resources.map(resource => (

                                    <option
                                        key={resource._id}
                                        value={resource._id}
                                    >

                                        {resource.name}

                                        {!resource.isActive
                                            ? " (Inactive)"
                                            : ""}

                                    </option>

                                ))}

                            </select>

                        </div>


                        {/* Start Date */}

                        <div>

                            <label
                                htmlFor="booking-from"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >

                                From Date

                            </label>

                            <input
                                id="booking-from"
                                type="date"
                                value={filters.from}
                                max={filters.to || undefined}
                                onChange={event =>

                                    handleFilterChange(

                                        "from",

                                        event.target.value

                                    )

                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            />

                        </div>


                        {/* End Date */}

                        <div>

                            <label
                                htmlFor="booking-to"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >

                                To Date

                            </label>

                            <input
                                id="booking-to"
                                type="date"
                                value={filters.to}
                                min={filters.from || undefined}
                                onChange={event =>

                                    handleFilterChange(

                                        "to",

                                        event.target.value

                                    )

                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            />

                        </div>

                    </div>


                    {/* Resource Error */}

                    {resourcesError && (

                        <p className="mt-4 text-sm text-amber-600">

                            {resourcesError}

                            {" "}Other booking filters remain available.

                        </p>

                    )}


                    {/* Filter Validation Error */}

                    {filterError && (

                        <div
                            role="alert"
                            className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600"
                        >

                            <AlertCircle size={18} />

                            {filterError}

                        </div>

                    )}


                    {/* Filter Footer */}

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">

                        <div>

                            <p className="text-xs text-slate-500">

                                Select both dates to filter bookings
                                overlapping the selected period.

                            </p>

                            {hasUnsavedFilters && (

                                <p className="mt-1 text-xs font-medium text-amber-600">

                                    You have unapplied filter changes.

                                </p>

                            )}

                        </div>

                        <Button
                            variant="primary"
                            size="md"
                            type="submit"
                            text="Apply Filters"
                            startIcon={<Filter size={16} />}
                        />

                    </div>

                </form>

            </section>


            {/* Booking List Header */}

            <div className="flex flex-wrap items-center justify-between gap-3">

                <div>

                    <h2 className="text-lg font-semibold text-slate-900">

                        {appliedFilters.status
                            ? `${bookingStatusLabels[appliedFilters.status]} Bookings`
                            : "All Booking Requests"}

                    </h2>

                    <p className="mt-1 text-sm text-slate-500">

                        {loading
                            ? "Loading bookings..."
                            : error
                                ? "Unable to load bookings"
                                : `${total} booking${total === 1 ? "" : "s"} found`}

                    </p>

                </div>

                {hasAppliedFilters && (

                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">

                        Filters Applied

                    </span>

                )}

            </div>


            {/* Loading State */}

            {loading ? (

                <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white">

                    <LoaderCircle
                        size={38}
                        className="animate-spin text-indigo-600"
                    />

                    <p className="mt-4 text-sm text-slate-500">

                        Loading booking requests...

                    </p>

                </div>

            ) : error ? (


                /* Error State */

                <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-red-200 bg-white p-6 text-center">

                    <div className="rounded-full bg-red-50 p-4">

                        <AlertCircle
                            size={36}
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

                        {hasAppliedFilters
                            ? "No Matching Bookings"
                            : "No Booking Requests"}

                    </h3>

                    <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">

                        {hasAppliedFilters
                            ? "No booking requests match the selected filters. Try changing your filter criteria."
                            : "Booking requests will appear here when users reserve resources."}

                    </p>

                    {hasAppliedFilters && (

                        <div className="mt-5">

                            <Button
                                variant="primary"
                                size="md"
                                text="Clear Filters"
                                startIcon={<RotateCcw size={17} />}
                                onClick={handleResetFilters}
                            />

                        </div>

                    )}

                </div>

            ) : (


                /* Booking Grid */

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">

                    {bookings.map(booking => {

                        const resource =
                            resourceMap.get(
                                booking.resourceId
                            );

                        return (

                            <BookingCard
                                key={booking._id}
                                booking={booking}
                                resourceName={resource?.name}
                                resourceType={resource?.type}
                                showUser={true}
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