import {
    useEffect,
    useState,
    useRef
} from "react";

import type { FormEvent } from "react";

import {
    Link,
    useParams,
    useOutletContext
} from "react-router-dom";

import axios from "axios";

import {
    ArrowLeft,
    CalendarDays,
    CalendarClock,
    Clock3,
    RefreshCw,
    LoaderCircle,
    AlertCircle,
    CircleCheck,
    CircleX,
    Ban,
    FileText,
    Ticket,
    UserRound,
    Layers,
    ArrowRight,
    ShieldCheck,
    MessageSquare,
    X
} from "lucide-react";

import { Button } from "../components/ui/Button";

import BookingBadge from
    "../components/bookings/BookingBadge";

import {
    getBookingDetails,
    cancelBooking,
    approveBooking,
    rejectBooking
} from "../services/bookingService";

import {
    getResourceDetails
} from "../services/resourceService";

import {
    resourceTypeLabels
} from "../types/resource";

import type { Booking } from "../types/booking";

import type { Resource } from "../types/resource";

import type { User } from "../types/dashboard";


// ==========================================
// TYPES
// ==========================================

interface DashboardContext {
    user: User | null;
}

type BookingAction =
    "cancel" | "approve" | "reject";


// ==========================================
// ACTION CONFIGURATION
// ==========================================

const actionConfig = {

    cancel: {
        title: "Cancel Booking",
        description:
            "Are you sure you want to cancel this booking? The reserved time slot will become available again.",
        buttonText: "Confirm Cancellation",
        successMessage: "Booking cancelled successfully.",
        icon: Ban,
        color: "bg-red-50 text-red-600",
        buttonColor: "bg-red-600 hover:bg-red-700"
    },

    approve: {
        title: "Approve Booking",
        description:
            "Are you sure you want to approve this booking request?",
        buttonText: "Confirm Approval",
        successMessage: "Booking approved successfully.",
        icon: CircleCheck,
        color: "bg-emerald-50 text-emerald-600",
        buttonColor: "bg-emerald-600 hover:bg-emerald-700"
    },

    reject: {
        title: "Reject Booking",
        description:
            "Please provide a reason for rejecting this booking request.",
        buttonText: "Confirm Rejection",
        successMessage: "Booking rejected successfully.",
        icon: CircleX,
        color: "bg-red-50 text-red-600",
        buttonColor: "bg-red-600 hover:bg-red-700"
    }

};


// ==========================================
// DATE UTILITIES
// ==========================================

function formatDate(value: string): string {

    return new Date(value).toLocaleDateString(
        "en-IN",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

}

function formatTime(value: string): string {

    return new Date(value).toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        }
    );

}

function formatDuration(
    startTime: string,
    endTime: string
): string {

    const minutes = Math.round(

        (
            new Date(endTime).getTime() -
            new Date(startTime).getTime()
        ) / 60000

    );

    if (!Number.isFinite(minutes) || minutes <= 0) {
        return "Unavailable";
    }

    const hours = Math.floor(minutes / 60);

    const remainingMinutes = minutes % 60;

    if (hours === 0) {
        return `${remainingMinutes} minutes`;
    }

    const hourLabel =
        hours === 1 ? "hour" : "hours";

    if (remainingMinutes === 0) {
        return `${hours} ${hourLabel}`;
    }

    return `${hours} ${hourLabel} ${remainingMinutes} minutes`;

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
// BOOKING DETAILS PAGE
// ==========================================

export default function BookingDetails() {

    const { id } = useParams<{ id: string }>();

    const { user } =
        useOutletContext<DashboardContext>();

    const isAdmin = user?.role === "ADMIN";

    const dashboardPath = isAdmin
        ? "/admin/dashboard"
        : "/dashboard";

    const backPath = `${dashboardPath}/bookings`;


    // ==========================================
    // PAGE STATE
    // ==========================================

    const [booking, setBooking] =
        useState<Booking | null>(null);

    const [resource, setResource] =
        useState<Resource | null>(null);

    const [loading, setLoading] = useState(true);

    const [resourceLoading, setResourceLoading] =
        useState(true);

    const [error, setError] = useState("");

    const [refreshKey, setRefreshKey] = useState(0);

    const [successMessage, setSuccessMessage] =
        useState("");

    const [now, setNow] = useState(
        () => Date.now()
    );


    // ==========================================
    // ACTION MODAL STATE
    // ==========================================

    const [action, setAction] =
        useState<BookingAction | null>(null);

    const [decisionNote, setDecisionNote] =
        useState("");

    const [actionLoading, setActionLoading] =
        useState(false);

    const [actionError, setActionError] =
        useState("");

    const submittingRef = useRef(false);

    const actionDialogRef =
        useRef<HTMLDialogElement>(null);


    // ==========================================
    // UPDATE CURRENT TIME
    // ==========================================

    useEffect(() => {

        const timer = window.setInterval(() => {

            setNow(Date.now());

        }, 1000);

        return () => window.clearInterval(timer);

    }, []);


    // ==========================================
    // FETCH BOOKING DETAILS
    // ==========================================

    useEffect(() => {

        const controller = new AbortController();

        async function fetchBooking() {

            setLoading(true);

            setError("");

            setBooking(null);

            if (!id || !/^[a-f0-9]{24}$/i.test(id)) {

                setError("Invalid booking ID.");

                setLoading(false);

                return;

            }

            try {

                const response =
                    await getBookingDetails(
                        id,
                        controller.signal
                    );

                if (controller.signal.aborted) return;

                setBooking(response.booking);

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
                        "Unable to load booking details."
                    )

                );

            } finally {

                if (!controller.signal.aborted) {

                    setLoading(false);

                }

            }

        }

        const timer = window.setTimeout(
            fetchBooking,
            0
        );

        return () => {

            window.clearTimeout(timer);

            controller.abort();

        };

    }, [id, refreshKey]);


    // ==========================================
    // FETCH RESOURCE INFORMATION
    // ==========================================

    const resourceId = booking?.resourceId;

    useEffect(() => {

        if (!resourceId) return;

        const controller = new AbortController();

        async function fetchResource() {

            if (!resourceId) return;

            setResourceLoading(true);

            setResource(null);

            try {

                const response =
                    await getResourceDetails(
                        resourceId,
                        controller.signal
                    );

                if (controller.signal.aborted) return;

                setResource(response.resource);

            } catch {

                if (controller.signal.aborted) return;

                setResource(null);

            } finally {

                if (!controller.signal.aborted) {

                    setResourceLoading(false);

                }

            }

        }

        const timer = window.setTimeout(
            fetchResource,
            0
        );

        return () => {

            window.clearTimeout(timer);

            controller.abort();

        };

    }, [resourceId, refreshKey]);


    // ==========================================
    // NATIVE CONFIRMATION DIALOG
    // ==========================================

    useEffect(() => {

        const dialog = actionDialogRef.current;

        if (!action || !dialog) return;

        if (!dialog.open) {

            dialog.showModal();

        }

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow = "hidden";

        return () => {

            if (dialog.open) {
                dialog.close();
            }

            document.body.style.overflow =
                previousOverflow;

        };

    }, [action]);


    // ==========================================
    // ACTION PERMISSIONS
    // ==========================================

    const isOwner = Boolean(

        booking &&
        user &&
        booking.userId === user._id

    );

    const isFutureBooking = Boolean(

        booking &&
        new Date(booking.startTime).getTime() > now

    );

    const canCancel = Boolean(

        booking &&
        isOwner &&
        isFutureBooking &&
        (
            booking.status === "PENDING" ||
            booking.status === "APPROVED"
        )

    );

    const canApprove = Boolean(

        booking &&
        isAdmin &&
        isFutureBooking &&
        booking.status === "PENDING"

    );

    const canReject = canApprove;


    // ==========================================
    // REFRESH
    // ==========================================

    function handleRefresh() {

        if (submittingRef.current) return;

        setAction(null);

        setLoading(true);

        setSuccessMessage("");

        setRefreshKey(previous => previous + 1);

    }


    // ==========================================
    // OPEN ACTION MODAL
    // ==========================================

    function handleOpenAction(
        selectedAction: BookingAction
    ) {

        if (submittingRef.current) return;

        if (
            selectedAction === "cancel" &&
            !canCancel
        ) {
            return;
        }

        if (
            selectedAction === "approve" &&
            !canApprove
        ) {
            return;
        }

        if (
            selectedAction === "reject" &&
            !canReject
        ) {
            return;
        }

        setDecisionNote("");

        setActionError("");

        setSuccessMessage("");

        setAction(selectedAction);

    }


    // ==========================================
    // CLOSE ACTION MODAL
    // ==========================================

    function handleCloseAction() {

        if (
            actionLoading ||
            submittingRef.current
        ) {
            return;
        }

        setAction(null);

        setDecisionNote("");

        setActionError("");

    }


    // ==========================================
    // HANDLE BOOKING ACTION
    // ==========================================

    async function handleActionSubmit(
        event: FormEvent<HTMLFormElement>
    ) {

        event.preventDefault();

        if (
            !booking ||
            !action ||
            submittingRef.current
        ) {
            return;
        }

        setActionError("");

        // Check actual time before sending the request.

        const currentTime = Date.now();

        if (
            new Date(booking.startTime).getTime() <=
            currentTime
        ) {

            setNow(currentTime);

            setActionError(
                "The booking start time has passed. This action is no longer available."
            );

            return;

        }

        // Validate permissions again.

        if (action === "cancel" && !canCancel) {

            setActionError(
                "This booking cannot be cancelled."
            );

            return;

        }

        if (
            (action === "approve" && !canApprove) ||
            (action === "reject" && !canReject)
        ) {

            setActionError(
                "This booking action is no longer available."
            );

            return;

        }

        const note = decisionNote.trim();

        if (action === "reject" && !note) {

            setActionError(
                "A rejection reason is required."
            );

            return;

        }

        submittingRef.current = true;

        setActionLoading(true);

        try {

            let response;

            switch (action) {

                case "cancel":

                    response = await cancelBooking(
                        booking._id
                    );

                    break;

                case "approve":

                    response = await approveBooking(
                        booking._id
                    );

                    break;

                case "reject":

                    response = await rejectBooking(

                        booking._id,

                        { note }

                    );

                    break;

            }

            setBooking(response.booking);

            setSuccessMessage(
                actionConfig[action].successMessage
            );

            setAction(null);

            setDecisionNote("");

        } catch (err) {

            setActionError(

                getErrorMessage(
                    err,
                    "Unable to update the booking. Please try again."
                )

            );

        } finally {

            submittingRef.current = false;

            setActionLoading(false);

        }

    }


    // ==========================================
    // LOADING STATE
    // ==========================================

    if (loading) {

        return (

            <div className="flex min-h-[60vh] flex-col items-center justify-center">

                <LoaderCircle
                    size={40}
                    className="animate-spin text-indigo-600"
                />

                <p className="mt-4 text-sm text-slate-500">
                    Loading booking details...
                </p>

            </div>

        );

    }


    // ==========================================
    // ERROR STATE
    // ==========================================

    if (error || !booking) {

        return (

            <div className="space-y-6">

                <Link
                    to={backPath}
                    className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600"
                >

                    <ArrowLeft size={18} />

                    Back to Bookings

                </Link>

                <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-red-200 bg-white p-6 text-center">

                    <div className="rounded-full bg-red-50 p-4">

                        <AlertCircle
                            size={36}
                            className="text-red-500"
                        />

                    </div>

                    <h2 className="mt-4 text-xl font-semibold text-slate-900">
                        Unable to Load Booking
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        {error || "Booking not found."}
                    </p>

                    <div className="mt-5">

                        <Button
                            variant="primary"
                            size="md"
                            text="Try Again"
                            startIcon={<RefreshCw size={17} />}
                            onClick={handleRefresh}
                        />

                    </div>

                </div>

            </div>

        );

    }


    // ==========================================
    // DERIVED VALUES
    // ==========================================

    const duration = formatDuration(
        booking.startTime,
        booking.endTime
    );

    const hasStarted = !isFutureBooking;

    const hasEnded =
        new Date(booking.endTime).getTime() <= now;

    const currentResource =
        resource?._id === booking.resourceId
            ? resource
            : null;

    const selectedActionConfig =
        action ? actionConfig[action] : null;

    const ActionIcon =
        selectedActionConfig?.icon;

    const isSelectedActionAllowed =

        action === "cancel"
            ? canCancel
            : action === "approve"
                ? canApprove
                : action === "reject"
                    ? canReject
                    : false;


    // ==========================================
    // RENDER
    // ==========================================

    return (

        <div className="space-y-6">


            {/* Page Navigation */}

            <div className="flex flex-wrap items-center justify-between gap-3">

                <Link
                    to={backPath}
                    className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >

                    <ArrowLeft size={18} />

                    {isAdmin
                        ? "Back to Manage Bookings"
                        : "Back to My Bookings"}

                </Link>

                <Button
                    variant="secondary"
                    size="sm"
                    text="Refresh"
                    startIcon={<RefreshCw size={16} />}
                    onClick={handleRefresh}
                    disabled={actionLoading}
                />

            </div>


            {/* Success Message */}

            {successMessage && (

                <div
                    role="status"
                    className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
                >

                    <div className="flex items-center gap-3">

                        <CircleCheck
                            size={21}
                            className="shrink-0 text-emerald-600"
                        />

                        <p className="text-sm font-medium text-emerald-700">

                            {successMessage}

                        </p>

                    </div>

                    <button
                        type="button"
                        aria-label="Dismiss success message"
                        onClick={() => setSuccessMessage("")}
                        className="rounded-lg p-1 text-emerald-600 hover:bg-emerald-100"
                    >

                        <X size={18} />

                    </button>

                </div>

            )}


            {/* Booking Header */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6">

                <div className="flex flex-wrap items-start gap-5">

                    <div className="rounded-2xl bg-indigo-50 p-5 text-indigo-600">

                        <CalendarClock size={40} />

                    </div>

                    <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-3">

                            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">

                                Booking Details

                            </h1>

                            <BookingBadge
                                status={booking.status}
                            />

                        </div>

                        <p className="mt-2 wrap-break-words text-sm text-slate-500">

                            Booking ID: {booking._id}

                        </p>

                        <p className="mt-3 text-sm text-slate-500">

                            Requested on{" "}

                            {formatDate(booking.createdAt)}

                        </p>

                    </div>

                </div>

            </section>


            {/* Booking Status Information */}

            {booking.status === "PENDING" && (

                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">

                    <Clock3
                        size={22}
                        className="shrink-0 text-amber-600"
                    />

                    <div>

                        <p className="text-sm font-semibold text-amber-700">

                            {hasStarted
                                ? "Pending Booking — Start Time Passed"
                                : "Awaiting Administrator Approval"}

                        </p>

                        <p className="mt-1 text-sm text-amber-600">

                            {hasStarted
                                ? "The scheduled start time has passed. This request can no longer be approved or rejected."
                                : "This booking is awaiting an administrator's decision."}

                        </p>

                    </div>

                </div>

            )}


            {booking.status === "APPROVED" && (

                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                    <CircleCheck
                        size={22}
                        className="shrink-0 text-emerald-600"
                    />

                    <div>

                        <p className="text-sm font-semibold text-emerald-700">

                            {hasEnded
                                ? "Approved — Scheduled Time Ended"
                                : hasStarted
                                    ? "Approved — Scheduled Time In Progress"
                                    : "Booking Approved"}

                        </p>

                        <p className="mt-1 text-sm text-emerald-600">

                            This booking has been approved by an administrator.

                        </p>

                    </div>

                </div>

            )}


            {booking.status === "CANCELLED" && (

                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-100 p-4">

                    <Ban
                        size={22}
                        className="shrink-0 text-slate-600"
                    />

                    <div>

                        <p className="text-sm font-semibold text-slate-700">

                            Booking Cancelled

                        </p>

                        <p className="mt-1 text-sm text-slate-500">

                            This booking no longer reserves the resource.

                        </p>

                    </div>

                </div>

            )}


            {booking.status === "REJECTED" && (

                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">

                    <CircleX
                        size={22}
                        className="shrink-0 text-red-600"
                    />

                    <div>

                        <p className="text-sm font-semibold text-red-700">

                            Booking Rejected

                        </p>

                        <p className="mt-1 text-sm text-red-600">

                            This request was rejected by an administrator.

                        </p>

                    </div>

                </div>

            )}


            {/* Schedule Cards */}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                {/* Start Time */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5">

                    <div className="w-fit rounded-xl bg-indigo-50 p-3 text-indigo-600">

                        <CalendarDays size={24} />

                    </div>

                    <p className="mt-4 text-sm text-slate-500">

                        Start Time

                    </p>

                    <h2 className="mt-1 text-xl font-bold text-slate-900">

                        {formatTime(booking.startTime)}

                    </h2>

                    <p className="mt-2 text-xs text-slate-500">

                        {formatDate(booking.startTime)}

                    </p>

                </div>


                {/* End Time */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5">

                    <div className="w-fit rounded-xl bg-blue-50 p-3 text-blue-600">

                        <CalendarClock size={24} />

                    </div>

                    <p className="mt-4 text-sm text-slate-500">

                        End Time

                    </p>

                    <h2 className="mt-1 text-xl font-bold text-slate-900">

                        {formatTime(booking.endTime)}

                    </h2>

                    <p className="mt-2 text-xs text-slate-500">

                        {formatDate(booking.endTime)}

                    </p>

                </div>


                {/* Duration */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5">

                    <div className="w-fit rounded-xl bg-violet-50 p-3 text-violet-600">

                        <Clock3 size={24} />

                    </div>

                    <p className="mt-4 text-sm text-slate-500">

                        Booking Duration

                    </p>

                    <h2 className="mt-1 text-xl font-bold text-slate-900">

                        {duration}

                    </h2>

                    <p className="mt-2 text-xs text-slate-500">

                        Times displayed in your local timezone

                    </p>

                </div>

            </div>


            {/* Resource Information */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6">

                <div className="flex items-center gap-3">

                    <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">

                        <Layers size={23} />

                    </div>

                    <h2 className="text-lg font-semibold text-slate-900">

                        Resource Information

                    </h2>

                </div>

                {resourceLoading ? (

                    <div className="mt-5 flex items-center gap-3 text-sm text-slate-500">

                        <LoaderCircle
                            size={18}
                            className="animate-spin text-indigo-600"
                        />

                        Loading resource information...

                    </div>

                ) : currentResource ? (

                    <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">

                        <div className="flex flex-wrap items-center justify-between gap-4">

                            <div>

                                <h3 className="wrap-break-words font-semibold text-slate-900">

                                    {currentResource.name}

                                </h3>

                                <p className="mt-1 text-sm text-indigo-600">

                                    {resourceTypeLabels[currentResource.type]}

                                </p>

                                <p className="mt-2 text-sm text-slate-500">

                                    Capacity: {currentResource.capacity}

                                </p>

                                <p className="mt-1 text-sm text-slate-500">

                                    Status: {currentResource.isActive
                                        ? "Active"
                                        : "Inactive"}

                                </p>

                            </div>

                            <Link
                                to={`${dashboardPath}/resources/${currentResource._id}`}
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-200"
                            >

                                View Resource

                                <ArrowRight size={16} />

                            </Link>

                        </div>

                    </div>

                ) : (

                    <div className="mt-5 rounded-xl bg-slate-50 p-4">

                        <p className="text-sm text-slate-600">

                            Resource details are currently unavailable.

                        </p>

                        <p className="mt-2 wrap-break-words text-xs text-slate-500">

                            Resource ID: {booking.resourceId}

                        </p>

                    </div>

                )}

            </section>


            {/* Booking Purpose */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6">

                <div className="flex items-center gap-3">

                    <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">

                        <FileText size={23} />

                    </div>

                    <h2 className="text-lg font-semibold text-slate-900">

                        Booking Purpose

                    </h2>

                </div>

                <p className="mt-5 whitespace-pre-wrap wrap-break-words text-sm leading-relaxed text-slate-600">

                    {booking.purpose}

                </p>

            </section>


            {/* Booking Owner */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6">

                <div className="flex items-center gap-3">

                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">

                        <UserRound size={23} />

                    </div>

                    <h2 className="text-lg font-semibold text-slate-900">

                        Booking Owner

                    </h2>

                </div>

                <div className="mt-5">

                    <p className="font-medium text-slate-800">

                        {isOwner
                            ? `${user?.name} (You)`
                            : "Booking Requester"}

                    </p>

                    <p className="mt-2 wrap-break-words text-sm text-slate-500">

                        User ID: {booking.userId}

                    </p>

                </div>

            </section>


            {/* Linked Ticket */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6">

                <div className="flex items-center gap-3">

                    <div className="rounded-xl bg-violet-50 p-3 text-violet-600">

                        <Ticket size={23} />

                    </div>

                    <h2 className="text-lg font-semibold text-slate-900">

                        Related Support Ticket

                    </h2>

                </div>

                {booking.ticketId ? (

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">

                        <div className="min-w-0">

                            <p className="text-sm font-semibold text-slate-800">

                                Linked Support Ticket

                            </p>

                            <p className="mt-1 wrap-break-words text-xs text-slate-500">

                                {booking.ticketId}

                            </p>

                        </div>

                        <Link
                            to={`${dashboardPath}/tickets/${booking.ticketId}`}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                        >

                            View Ticket

                            <ArrowRight size={16} />

                        </Link>

                    </div>

                ) : (

                    <p className="mt-5 text-sm text-slate-500">

                        No support ticket is linked to this booking.

                    </p>

                )}

            </section>


            {/* Rejection Reason */}

            {booking.status === "REJECTED" && (

                <section className="rounded-2xl border border-red-200 bg-white p-6">

                    <div className="flex items-center gap-3">

                        <div className="rounded-xl bg-red-50 p-3 text-red-600">

                            <MessageSquare size={23} />

                        </div>

                        <h2 className="text-lg font-semibold text-slate-900">

                            Rejection Reason

                        </h2>

                    </div>

                    <p className="mt-5 whitespace-pre-wrap wrap-break-words rounded-xl bg-red-50 p-4 text-sm leading-relaxed text-red-700">

                        {booking.decisionNote ||
                            "No rejection reason is available."}

                    </p>

                </section>

            )}


            {/* Booking Actions */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6">

                <div className="flex items-center gap-3">

                    <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">

                        <ShieldCheck size={24} />

                    </div>

                    <div>

                        <h2 className="text-lg font-semibold text-slate-900">

                            Booking Actions

                        </h2>

                        <p className="mt-1 text-xs text-slate-500">

                            Manage this booking based on your permissions.

                        </p>

                    </div>

                </div>

                {canCancel || canApprove || canReject ? (

                    <div className="mt-5 flex flex-wrap gap-3">

                        {canApprove && (

                            <button
                                type="button"
                                onClick={() =>
                                    handleOpenAction("approve")
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                            >

                                <CircleCheck size={18} />

                                Approve Booking

                            </button>

                        )}


                        {canReject && (

                            <button
                                type="button"
                                onClick={() =>
                                    handleOpenAction("reject")
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                            >

                                <CircleX size={18} />

                                Reject Booking

                            </button>

                        )}


                        {canCancel && (

                            <button
                                type="button"
                                onClick={() =>
                                    handleOpenAction("cancel")
                                }
                                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                            >

                                <Ban size={18} />

                                Cancel Booking

                            </button>

                        )}

                    </div>

                ) : (

                    <div className="mt-5 rounded-xl bg-slate-50 p-4">

                        <p className="text-sm text-slate-500">

                            {hasStarted
                                ? "The booking start time has passed. No further booking actions are available."
                                : "No actions are available for your role or the current booking status."}

                        </p>

                    </div>

                )}

            </section>


            {/* Action Confirmation Dialog */}

            {action && selectedActionConfig && ActionIcon && (

                <dialog
                    ref={actionDialogRef}
                    aria-labelledby="booking-action-title"
                    onCancel={event => {

                        event.preventDefault();

                        handleCloseAction();

                    }}
                    className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm"
                >

                    <form onSubmit={handleActionSubmit}>

                        {/* Dialog Header */}

                        <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-6">

                            <div className="flex items-center gap-3">

                                <div className={`rounded-xl p-3 ${selectedActionConfig.color}`}>

                                    <ActionIcon size={24} />

                                </div>

                                <h2
                                    id="booking-action-title"
                                    className="text-lg font-bold text-slate-900"
                                >

                                    {selectedActionConfig.title}

                                </h2>

                            </div>

                            <button
                                type="button"
                                aria-label="Close confirmation"
                                onClick={handleCloseAction}
                                disabled={actionLoading}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                            >

                                <X size={20} />

                            </button>

                        </div>


                        {/* Dialog Body */}

                        <div className="space-y-5 p-6">

                            <p className="text-sm leading-relaxed text-slate-600">

                                {selectedActionConfig.description}

                            </p>


                            {/* Booking Summary */}

                            <div className="rounded-xl bg-slate-50 p-4">

                                <p className="font-semibold text-slate-800">

                                    {currentResource?.name ||
                                        `Booking #${booking._id.slice(-8).toUpperCase()}`}

                                </p>

                                <p className="mt-2 text-sm text-slate-500">

                                    {formatDate(booking.startTime)}

                                </p>

                                <p className="mt-1 text-sm text-slate-500">

                                    {formatTime(booking.startTime)}

                                    {" — "}

                                    {formatTime(booking.endTime)}

                                </p>

                                <div className="mt-3">

                                    <BookingBadge status={booking.status} />

                                </div>

                            </div>


                            {/* Rejection Note */}

                            {action === "reject" && (

                                <div>

                                    <label
                                        htmlFor="rejection-note"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >

                                        Rejection Reason *

                                    </label>

                                    <textarea
                                        id="rejection-note"
                                        value={decisionNote}
                                        onChange={event => {

                                            setDecisionNote(
                                                event.target.value
                                            );

                                            setActionError("");

                                        }}
                                        placeholder="Explain why this booking is being rejected..."
                                        rows={4}
                                        required
                                        disabled={actionLoading}
                                        className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    />

                                    <p className="mt-2 text-xs text-slate-500">

                                        This reason will be visible to the booking owner.

                                    </p>

                                </div>

                            )}


                            {/* Action Error */}

                            {actionError && (

                                <div
                                    role="alert"
                                    className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
                                >

                                    <AlertCircle
                                        size={19}
                                        className="shrink-0 text-red-600"
                                    />

                                    <p className="text-sm text-red-700">

                                        {actionError}

                                    </p>

                                </div>

                            )}


                            {/* Expired Action */}

                            {!isSelectedActionAllowed && (

                                <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">

                                    This action is no longer available.

                                </p>

                            )}

                        </div>


                        {/* Dialog Footer */}

                        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 p-6">

                            <Button
                                variant="secondary"
                                size="md"
                                text="Go Back"
                                onClick={handleCloseAction}
                                disabled={actionLoading}
                            />

                            <button
                                type="submit"
                                disabled={
                                    actionLoading ||
                                    !isSelectedActionAllowed ||
                                    (
                                        action === "reject" &&
                                        !decisionNote.trim()
                                    )
                                }
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${selectedActionConfig.buttonColor}`}
                            >

                                {actionLoading ? (

                                    <>

                                        <LoaderCircle
                                            size={18}
                                            className="animate-spin"
                                        />

                                        Processing...

                                    </>

                                ) : (

                                    selectedActionConfig.buttonText

                                )}

                            </button>

                        </div>

                    </form>

                </dialog>

            )}

        </div>

    );

}