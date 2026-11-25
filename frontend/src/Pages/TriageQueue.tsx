import { useEffect, useState } from "react";

import {
    Link,
    useOutletContext,
    useLocation,
    useNavigate
} from "react-router-dom";

import {
    ListFilter,
    RefreshCw,
    LoaderCircle,
    AlertCircle,
    CircleCheck,
    ArrowRight,
    BrainCircuit,
    X
} from "lucide-react";

import { Button } from "../components/ui/Button";

import TicketBadge from
    "../components/tickets/TicketBadge";

import { getTickets } from
    "../services/ticketService";

import type {
    Ticket,
    TicketPriority
} from "../types/dashboard";

import type {
    DashboardContext
} from "../components/layouts/DashboardLayout";


const priorityOrder: Record<TicketPriority, number> = {
    URGENT: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3
};


export default function TriageQueue() {

    const location = useLocation();
    const navigate = useNavigate();

    const successMessage =
        typeof location.state?.message === "string"
            ? location.state.message
            : "";


    const { user } =
        useOutletContext<DashboardContext>();

    const [tickets, setTickets] = useState<Ticket[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const [priorityFilter, setPriorityFilter] =
        useState<TicketPriority | "">("");


    const dashboardPath =
        user?.role === "ADMIN"
            ? "/admin/dashboard"
            : "/dashboard";


    // ==========================================
    // FETCH ALL TICKET PAGES
    // ==========================================

    useEffect(() => {

        const controller = new AbortController();

        async function fetchQueue() {

            setLoading(true);
            setError("");

            try {

                const allTickets: Ticket[] = [];

                let page = 1;
                let totalPages = 1;

                do {

                    const response = await getTickets({
                        q: "",
                        category: "",
                        priority: priorityFilter,
                        status: "",
                        page,
                        limit: 100
                    }, controller.signal);

                    if (controller.signal.aborted) return;

                    allTickets.push(...response.tickets);

                    totalPages = response.totalPages;
                    page++;

                } while (page <= totalPages);


                const uniqueTickets = Array.from(
                    new Map(
                        allTickets.map(ticket => [
                            ticket._id,
                            ticket
                        ])
                    ).values()
                );


                const pendingTickets = uniqueTickets
                    .filter(ticket => !ticket.isReviewed)
                    .sort((a, b) => {

                        const priorityDifference =
                            priorityOrder[a.priority] -
                            priorityOrder[b.priority];

                        if (priorityDifference !== 0) {
                            return priorityDifference;
                        }

                        return (
                            new Date(a.createdAt).getTime() -
                            new Date(b.createdAt).getTime()
                        );

                    });

                if (!controller.signal.aborted) {

                    setTickets(pendingTickets);

                }

            } catch {

                if (!controller.signal.aborted) {

                    setError(
                        "Unable to load the triage queue."
                    );

                }

            } finally {

                if (!controller.signal.aborted) {

                    setLoading(false);

                }

            }

        }

        const timer = setTimeout(fetchQueue, 0);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };

    }, [refreshKey, priorityFilter]);


    function refreshQueue() {

        setRefreshKey(previous => previous + 1);

    }


    return (
        <div className="mx-auto max-w-400 space-y-6">

            {/* Header */}

            <section className="flex flex-wrap items-center justify-between gap-4">

                <div>

                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Triage Queue
                    </h1>

                    <p className="mt-2 text-slate-500">
                        Review automatically classified tickets
                        in order of priority.
                    </p>

                </div>

                <Button
                    variant="secondary"
                    size="md"
                    text="Refresh Queue"
                    startIcon={<RefreshCw size={18} />}
                    onClick={refreshQueue}
                />

            </section>


            {/* Review Success Notification */}

            {successMessage && (
                <div
                    role="status"
                    className="flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
                >
                    <div className="flex items-center gap-3">
                        <CircleCheck size={22} className="shrink-0 text-emerald-600" />
                        <p className="text-sm font-medium text-emerald-700">
                            {successMessage}
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label="Dismiss notification"
                        onClick={() => navigate(location.pathname + location.search, {
                            replace: true,
                            state: null
                        })}
                        className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-100"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* Queue Information */}

            <section className="rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-50 to-white p-6">

                <div className="flex items-center gap-4">

                    <div className="rounded-xl bg-indigo-600 p-3 text-white">

                        <ListFilter size={28} />

                    </div>

                    <div>

                        <p className="text-sm text-indigo-600">
                            Pending Review
                            {priorityFilter
                                ? ` — ${priorityFilter}`
                                : ""}
                        </p>

                        <h2 className="mt-1 text-3xl font-bold text-slate-900">

                            {loading || error
                                ? "—"
                                : tickets.length}

                        </h2>

                    </div>

                </div>

                <p className="mt-4 text-sm text-slate-600">
                    Tickets are sorted by priority first,
                    then oldest creation date.
                </p>

            </section>


            {/* Queue Filter */}

            <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5">

                <label
                    htmlFor="triage-priority"
                    className="text-sm font-medium text-slate-600"
                >
                    Filter by priority
                </label>

                <select
                    id="triage-priority"
                    value={priorityFilter}
                    onChange={event =>
                        setPriorityFilter(
                            event.target.value as TicketPriority | ""
                        )
                    }
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-600"
                >

                    <option value="">All Priorities</option>
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>

                </select>

            </section>


            {/* Loading */}

            {loading ? (

                <div className="flex min-h-80 flex-col items-center justify-center gap-4">

                    <LoaderCircle
                        size={36}
                        className="animate-spin text-indigo-600"
                    />

                    <p className="text-sm text-slate-500">
                        Loading triage queue...
                    </p>

                </div>

            ) : error ? (

                <div className="flex min-h-80 flex-col items-center justify-center gap-4">

                    <AlertCircle
                        size={36}
                        className="text-red-500"
                    />

                    <p className="text-sm text-slate-600">
                        {error}
                    </p>

                    <Button
                        variant="primary"
                        size="md"
                        text="Try Again"
                        onClick={refreshQueue}
                    />

                </div>

            ) : tickets.length === 0 ? (

                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">

                    <CircleCheck
                        size={48}
                        className="mx-auto mb-4 text-emerald-500"
                    />

                    <h2 className="text-xl font-semibold text-slate-900">
                        You're all caught up!
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        No tickets are awaiting review
                        for the selected priority.
                    </p>

                </div>

            ) : (

                <section className="space-y-4">

                    {tickets.map((ticket, index) => (

                        <article
                            key={ticket._id}
                            className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-indigo-300 hover:shadow-sm"
                        >

                            <div className="flex flex-wrap items-start gap-4">

                                {/* Queue Position */}

                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600">

                                    #{index + 1}

                                </div>


                                {/* Ticket Content */}

                                <div className="min-w-0 flex-1">

                                    <p className="text-xs font-semibold text-indigo-600">
                                        {ticket.externalId}
                                    </p>

                                    <h3 className="mt-1 text-lg font-semibold text-slate-900">
                                        {ticket.subject}
                                    </h3>

                                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">
                                        {ticket.body}
                                    </p>

                                    <div className="mt-4 flex flex-wrap items-center gap-2">

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
                                            value="PENDING_REVIEW"
                                        />

                                    </div>


                                    {/* Automated Classification */}

                                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">

                                        <BrainCircuit
                                            size={16}
                                            className="text-indigo-500"
                                        />

                                        Auto Category:

                                        <TicketBadge
                                            type="category"
                                            value={ticket.autoCategory}
                                        />

                                    </div>

                                    <p className="mt-3 text-xs text-slate-400">

                                        Created{" "}
                                        {new Date(ticket.createdAt)
                                            .toLocaleString("en-IN")}

                                    </p>

                                </div>


                                {/* Review Action */}

                                <Link
                                    to={`${dashboardPath}/triage/${ticket._id}`}
                                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                >

                                    Review Ticket

                                    <ArrowRight size={16} />

                                </Link>

                            </div>

                        </article>

                    ))}

                </section>

            )}

        </div>
    );
}