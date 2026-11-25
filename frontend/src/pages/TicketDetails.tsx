import { useEffect, useState } from "react";

import {
    Link,
    useParams,
    useOutletContext,
    useNavigate
} from "react-router-dom";

import axios from "axios";

import {
    ArrowLeft,
    BrainCircuit,
    ShieldCheck,
    CalendarDays,
    Clock3,
    UserRound,
    LoaderCircle,
    AlertCircle,
    RefreshCw,
    FileText,
    Eye
} from "lucide-react";

import { Button } from "../components/ui/Button";

import TicketBadge from "../components/tickets/TicketBadge";
import TicketReviewForm from "../components/tickets/TicketReviewForm";
import TicketAuditTrail from "../components/tickets/TicketAuditTrail";

import { getTicketDetails } from "../services/ticketService";

import type {
    TicketDetailsResponse,
    UpdateTicketResponse
} from "../types/ticket";

import type {
    DashboardContext
} from "../components/layouts/DashboardLayout";


// ==========================================
// COMPONENT PROPS
// ==========================================

interface TicketDetailsProps {
    reviewMode?: boolean;
}


// ==========================================
// MAIN COMPONENT
// ==========================================

export default function TicketDetails({
    reviewMode = false
}: TicketDetailsProps) {

    const navigate = useNavigate();

    const { id } = useParams<{ id: string }>();

    const { user } =
        useOutletContext<DashboardContext>();


    // ==========================================
    // STATE
    // ==========================================

    const [data, setData] =
        useState<TicketDetailsResponse | null>(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [refreshKey, setRefreshKey] = useState(0);


    // ==========================================
    // ROLE-BASED NAVIGATION
    // ==========================================

    const dashboardPath =
        user?.role === "ADMIN"
            ? "/admin/dashboard"
            : "/dashboard";

    const backPath = reviewMode
        ? `${dashboardPath}/triage`
        : `${dashboardPath}/tickets`;

    const backLabel = reviewMode
        ? "Back to Triage Queue"
        : "Back to Tickets";


    // ==========================================
    // FETCH TICKET DETAILS
    // ==========================================

    useEffect(() => {

        const controller = new AbortController();

        async function fetchDetails() {

            setLoading(true);
            setError("");

            if (!id) {

                setError("Invalid ticket ID.");
                setLoading(false);

                return;
            }

            try {

                const response = await getTicketDetails(
                    id,
                    controller.signal
                );

                if (!controller.signal.aborted) {

                    setData(response);

                }

            } catch (err) {

                if (controller.signal.aborted) return;

                if (axios.isAxiosError(err)) {

                    const message =
                        err.response?.data?.error?.message ??
                        err.response?.data?.message;

                    setError(
                        typeof message === "string"
                            ? message
                            : "Unable to load ticket details."
                    );

                } else {

                    setError(
                        "Something went wrong while loading the ticket."
                    );

                }

            } finally {

                if (!controller.signal.aborted) {

                    setLoading(false);

                }

            }

        }

        const timer = setTimeout(fetchDetails, 0);

        return () => {

            clearTimeout(timer);

            controller.abort();

        };

    }, [id, refreshKey]);


    // ==========================================
    // HANDLE SUCCESSFUL REVIEW
    // ==========================================

    function handleUpdated(response: UpdateTicketResponse) {

        navigate(`${dashboardPath}/triage`, {
            replace: true,
            state: {
                message: response.ticket.isReviewed
                    ? `Ticket ${response.ticket.externalId} reviewed successfully.`
                    : `Ticket ${response.ticket.externalId} updated successfully.`
            }
        });

    }


    // ==========================================
    // REFRESH TICKET
    // ==========================================

    function refreshDetails() {

        setRefreshKey(previous => previous + 1);

    }


    // ==========================================
    // LOADING STATE
    // ==========================================

    if (loading) {

        return (

            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">

                <LoaderCircle
                    size={40}
                    className="animate-spin text-indigo-600"
                />

                <p className="text-sm text-slate-500">

                    Loading ticket details...

                </p>

            </div>

        );

    }


    // ==========================================
    // ERROR STATE
    // ==========================================

    if (error || !data) {

        return (

            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">

                <div className="rounded-full bg-red-50 p-5">

                    <AlertCircle
                        size={40}
                        className="text-red-500"
                    />

                </div>

                <h2 className="text-xl font-semibold text-slate-900">

                    Unable to load ticket

                </h2>

                <p className="text-center text-sm text-slate-500">

                    {error || "Ticket not found."}

                </p>

                <Button
                    variant="primary"
                    size="md"
                    text="Try Again"
                    startIcon={<RefreshCw size={16} />}
                    onClick={refreshDetails}
                />

                <Link
                    to={backPath}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
                >

                    <ArrowLeft size={18} />

                    {backLabel}

                </Link>

            </div>

        );

    }


    const { ticket, events } = data;

    const isAssignedToMe =
        Boolean(user && ticket.assigneeId) &&
        ticket.assigneeId === user?._id;

    const canReview =
        reviewMode && !ticket.isReviewed;


    // ==========================================
    // PAGE UI
    // ==========================================

    return (

        <div className="mx-auto max-w-400 space-y-6">


            {/* ==========================================
                BACK NAVIGATION
            ========================================== */}

            <div className="flex flex-wrap items-center justify-between gap-3">

                <Link
                    to={backPath}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
                >

                    <ArrowLeft size={18} />

                    {backLabel}

                </Link>


                {/* Current Page Mode */}

                <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        canReview
                            ? "bg-indigo-50 text-indigo-700"
                            : "bg-slate-100 text-slate-600"
                    }`}
                >

                    {canReview ? (

                        <ShieldCheck size={15} />

                    ) : (

                        <Eye size={15} />

                    )}

                    {canReview
                        ? "Review Mode"
                        : "Read Only"}

                </span>

            </div>


            {/* ==========================================
                ALREADY REVIEWED NOTIFICATION
            ========================================== */}

            {reviewMode && ticket.isReviewed && (

                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                    <div className="flex items-start gap-3">

                        <ShieldCheck
                            size={22}
                            className="shrink-0 text-emerald-600"
                        />

                        <div>

                            <p className="text-sm font-semibold text-emerald-700">

                                Ticket Already Reviewed

                            </p>

                            <p className="mt-1 text-xs text-emerald-600">

                                This ticket no longer requires human review.

                            </p>

                        </div>

                    </div>

                    <Button
                        variant="secondary"
                        size="sm"
                        text="Return to Triage"
                        startIcon={<ArrowLeft size={15} />}
                        onClick={() =>
                            navigate(`${dashboardPath}/triage`, {
                                replace: true
                            })
                        }
                    />

                </div>

            )}


            {/* ==========================================
                TICKET HEADER
            ========================================== */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6">

                <div className="flex flex-wrap items-start justify-between gap-4">

                    <div className="min-w-0 flex-1">

                        <p className="mb-2 text-sm font-semibold text-indigo-600">

                            {ticket.externalId}

                        </p>

                        <h1 className="wrap-break-word text-3xl font-bold tracking-tight text-slate-900">

                            {ticket.subject}

                        </h1>

                        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">

                            {/* Created Date */}

                            <span className="flex items-center gap-2">

                                <CalendarDays size={15} />

                                Created{" "}

                                {new Date(ticket.createdAt)
                                    .toLocaleString("en-IN")}

                            </span>


                            {/* Updated Date */}

                            <span className="flex items-center gap-2">

                                <Clock3 size={15} />

                                Updated{" "}

                                {new Date(ticket.updatedAt)
                                    .toLocaleString("en-IN")}

                            </span>

                        </div>

                    </div>


                    {/* Ticket Badges and Refresh */}

                    <div className="flex flex-wrap items-center gap-2">

                        <TicketBadge
                            type="priority"
                            value={ticket.priority}
                        />

                        <TicketBadge
                            type="status"
                            value={ticket.status}
                        />

                        <TicketBadge
                            type="review"
                            value={
                                ticket.isReviewed
                                    ? "REVIEWED"
                                    : "PENDING_REVIEW"
                            }
                        />

                        <Button
                            variant="secondary"
                            size="sm"
                            text="Refresh"
                            startIcon={<RefreshCw size={15} />}
                            onClick={refreshDetails}
                        />

                    </div>

                </div>

            </section>


            {/* ==========================================
                TICKET DESCRIPTION
            ========================================== */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6">

                <div className="flex items-center gap-3">

                    <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">

                        <FileText size={22} />

                    </div>

                    <div>

                        <h2 className="text-lg font-semibold text-slate-900">

                            Ticket Description

                        </h2>

                        <p className="text-sm text-slate-500">

                            Original support request

                        </p>

                    </div>

                </div>

                <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-5">

                    <p className="whitespace-pre-wrap wrap-break-word text-sm leading-7 text-slate-700">

                        {ticket.body}

                    </p>

                </div>

            </section>


            {/* ==========================================
                CLASSIFICATION AND REVIEW
            ========================================== */}

            <div
                className={`grid items-start gap-6 ${
                    canReview
                        ? "xl:grid-cols-2"
                        : "grid-cols-1"
                }`}
            >


                {/* ==========================================
                    CLASSIFICATION INFORMATION
                ========================================== */}

                <section className="rounded-2xl border border-slate-200 bg-white p-6">

                    <div className="flex items-center gap-3">

                        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">

                            <BrainCircuit size={26} />

                        </div>

                        <div>

                            <h2 className="text-lg font-semibold text-slate-900">

                                Classification Information

                            </h2>

                            <p className="text-sm text-slate-500">

                                Automated and human-reviewed data

                            </p>

                        </div>

                    </div>


                    <div className="mt-6 divide-y divide-slate-100">


                        {/* Automated Category */}

                        <div className="flex items-center justify-between gap-4 py-5">

                            <div>

                                <p className="text-sm font-medium text-slate-700">

                                    Automated Category

                                </p>

                                <p className="mt-1 text-xs text-slate-400">

                                    Stored classifier prediction

                                </p>

                            </div>

                            <TicketBadge
                                type="category"
                                value={ticket.autoCategory}
                            />

                        </div>


                        {/* Current Category */}

                        <div className="flex items-center justify-between gap-4 py-5">

                            <div>

                                <p className="text-sm font-medium text-slate-700">

                                    Current Category

                                </p>

                                <p className="mt-1 text-xs text-slate-400">

                                    Active ticket classification

                                </p>

                            </div>

                            <TicketBadge
                                type="category"
                                value={ticket.category}
                            />

                        </div>


                        {/* Review Status */}

                        <div className="flex items-center justify-between gap-4 py-5">

                            <div>

                                <p className="text-sm font-medium text-slate-700">

                                    Review Status

                                </p>

                                <p className="mt-1 text-xs text-slate-400">

                                    Human verification status

                                </p>

                            </div>

                            <TicketBadge
                                type="review"
                                value={
                                    ticket.isReviewed
                                        ? "REVIEWED"
                                        : "PENDING_REVIEW"
                                }
                            />

                        </div>


                        {/* Ticket Priority */}

                        <div className="flex items-center justify-between gap-4 py-5">

                            <p className="text-sm font-medium text-slate-700">

                                Ticket Priority

                            </p>

                            <TicketBadge
                                type="priority"
                                value={ticket.priority}
                            />

                        </div>


                        {/* Ticket Status */}

                        <div className="flex items-center justify-between gap-4 py-5">

                            <p className="text-sm font-medium text-slate-700">

                                Ticket Status

                            </p>

                            <TicketBadge
                                type="status"
                                value={ticket.status}
                            />

                        </div>


                        {/* Assigned Agent */}

                        <div className="py-5">

                            <p className="mb-3 text-sm font-medium text-slate-700">

                                Assigned Agent

                            </p>

                            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">

                                <div className="shrink-0 rounded-full bg-indigo-100 p-2 text-indigo-600">

                                    <UserRound size={20} />

                                </div>

                                <div className="min-w-0">

                                    <p className="break-all text-sm font-medium text-slate-700">

                                        {!ticket.assigneeId
                                            ? "Unassigned"
                                            : isAssignedToMe
                                                ? user?.name
                                                : ticket.assigneeId
                                        }

                                    </p>

                                    {isAssignedToMe && (

                                        <p className="mt-1 text-xs text-slate-500">

                                            Assigned to you

                                        </p>

                                    )}

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* ==========================================
                        HUMAN OVERRIDE PROTECTION
                    ========================================== */}

                    <div
                        className={`mt-4 rounded-xl border p-4 ${
                            ticket.isHumanOverride
                                ? "border-indigo-200 bg-indigo-50"
                                : "border-slate-200 bg-slate-50"
                        }`}
                    >

                        <div className="flex items-start gap-3">

                            <ShieldCheck
                                size={24}
                                className={
                                    ticket.isHumanOverride
                                        ? "shrink-0 text-indigo-600"
                                        : "shrink-0 text-slate-400"
                                }
                            />

                            <div>

                                <h3 className="text-sm font-semibold text-slate-800">

                                    {ticket.isHumanOverride
                                        ? "Human Override Protected"
                                        : "No Human Override"}

                                </h3>

                                <p className="mt-1 text-xs leading-relaxed text-slate-600">

                                    {ticket.isHumanOverride
                                        ? "The manually selected category is protected against automatic reclassification during future imports."
                                        : "The category has not been manually overridden."}

                                </p>

                            </div>

                        </div>

                    </div>

                </section>


                {/* ==========================================
                    HUMAN REVIEW FORM

                    Only available from Triage Queue
                    for unreviewed tickets.
                ========================================== */}

                {canReview && (

                    <TicketReviewForm
                        key={`${ticket._id}-${ticket.updatedAt}`}
                        ticket={ticket}
                        user={user}
                        onUpdated={handleUpdated}
                    />

                )}

            </div>


            {/* ==========================================
                AUDIT HISTORY

                Available in both modes.
            ========================================== */}

            <TicketAuditTrail events={events} />


        </div>

    );

}