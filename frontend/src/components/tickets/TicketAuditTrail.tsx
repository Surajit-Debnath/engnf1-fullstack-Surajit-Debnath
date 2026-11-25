import {
    History,
    ArrowRight,
    Tag,
    Flag,
    Activity,
    UserRound,
    ShieldCheck
} from "lucide-react";

import type {
    TicketEvent,
    TicketEventField
} from "../../types/ticket";

import { formatLabel } from "../../types/ticket";

interface TicketAuditTrailProps {
    events: TicketEvent[];
}

const fieldLabels: Record<TicketEventField, string> = {
    category: "Category changed",
    priority: "Priority changed",
    status: "Status changed",
    assigneeId: "Assignee changed"
};

const fieldIcons = {
    category: Tag,
    priority: Flag,
    status: Activity,
    assigneeId: UserRound
};

function formatValue(
    field: TicketEventField,
    value: string | null
) {
    if (value === null) {
        return field === "assigneeId"
            ? "Unassigned"
            : "None";
    }

    return field === "assigneeId"
        ? value
        : formatLabel(value);
}

export default function TicketAuditTrail({
    events
}: TicketAuditTrailProps) {

    const sortedEvents = [...events].sort(
        (a, b) =>
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
    );

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">

            {/* Header */}

            <div className="flex flex-wrap items-center justify-between gap-4">

                <div className="flex items-center gap-3">

                    <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                        <History size={24} />
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Audit History
                        </h2>

                        <p className="text-sm text-slate-500">
                            History of changes made to this ticket
                        </p>
                    </div>

                </div>

                <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                    <ShieldCheck size={14} />
                    Read Only
                </span>

            </div>

            {/* Empty State */}

            {sortedEvents.length === 0 ? (

                <div className="mt-6 rounded-xl border border-dashed border-slate-200 py-12 text-center">

                    <History
                        size={36}
                        className="mx-auto mb-3 text-slate-300"
                    />

                    <p className="font-medium text-slate-600">
                        No audit events yet
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                        Future ticket changes will appear here.
                    </p>

                </div>

            ) : (

                <div className="mt-8 space-y-6">

                    {sortedEvents.map((event, index) => {

                        const Icon = fieldIcons[event.field];

                        return (
                            <div
                                key={event._id}
                                className="relative flex gap-4"
                            >

                                {index !== sortedEvents.length - 1 && (
                                    <div className="absolute bottom-6 left-5 top-10 w-px bg-slate-200" />
                                )}

                                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                                    <Icon size={18} />
                                </div>

                                <div className="min-w-0 flex-1 rounded-xl border border-slate-200 p-4">

                                    <div className="flex flex-wrap items-center justify-between gap-2">

                                        <h3 className="font-semibold text-slate-800">
                                            {fieldLabels[event.field]}
                                        </h3>

                                        <span className="text-xs text-slate-400">
                                            {new Date(event.createdAt)
                                                .toLocaleString("en-IN")}
                                        </span>

                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-3">

                                        <span className="break-all rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
                                            {formatValue(
                                                event.field,
                                                event.oldValue
                                            )}
                                        </span>

                                        <ArrowRight
                                            size={16}
                                            className="text-slate-400"
                                        />

                                        <span className="break-all rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                                            {formatValue(
                                                event.field,
                                                event.newValue
                                            )}
                                        </span>

                                    </div>

                                    <p className="mt-3 break-all text-xs text-slate-500">
                                        Changed by{" "}
                                        <span className="font-medium text-slate-700">
                                            {event.actor}
                                        </span>
                                    </p>

                                </div>

                            </div>
                        );

                    })}

                </div>

            )}

        </section>
    );
}