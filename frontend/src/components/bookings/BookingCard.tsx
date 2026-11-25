import {
    CalendarDays,
    Clock3,
    CalendarClock,
    ArrowRight,
    UserRound,
    Ticket,
    FileText,
    DoorOpen,
    Monitor,
    Wrench,
    Layers,
    MessageSquare
} from "lucide-react";

import { Button } from "../ui/Button";

import BookingBadge from "./BookingBadge";

import type {
    Booking
} from "../../types/booking";

import type {
    ResourceType
} from "../../types/resource";

import {
    resourceTypeLabels
} from "../../types/resource";


// ==========================================
// PROPS
// ==========================================

interface BookingCardProps {

    booking: Booking;

    resourceName?: string;

    resourceType?: ResourceType;

    userName?: string;

    showUser?: boolean;

    onView: (booking: Booking) => void;

}


// ==========================================
// RESOURCE ICONS
// ==========================================

const resourceIcons = {

    ROOM: DoorOpen,

    LAB: Monitor,

    EQUIPMENT: Wrench

};

const resourceColors = {

    ROOM: "bg-blue-50 text-blue-600",

    LAB: "bg-indigo-50 text-indigo-600",

    EQUIPMENT: "bg-amber-50 text-amber-600"

};


// ==========================================
// DATE UTILITIES
// ==========================================

function formatDate(value: string): string {

    return new Date(value).toLocaleDateString(
        "en-IN",
        {
            weekday: "short",
            day: "numeric",
            month: "short",
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


// ==========================================
// DURATION UTILITY
// ==========================================

function formatDuration(
    startTime: string,
    endTime: string
): string {

    const start = new Date(startTime).getTime();

    const end = new Date(endTime).getTime();

    const minutes = Math.round(
        (end - start) / (60 * 1000)
    );

    if (!Number.isFinite(minutes) || minutes <= 0) {

        return "Unavailable";

    }

    const hours = Math.floor(minutes / 60);

    const remainingMinutes = minutes % 60;

    if (hours === 0) {

        return `${remainingMinutes} min`;

    }

    if (remainingMinutes === 0) {

        return `${hours} hr`;

    }

    return `${hours} hr ${remainingMinutes} min`;

}


// ==========================================
// BOOKING CARD
// ==========================================

export default function BookingCard({

    booking,

    resourceName,

    resourceType,

    userName,

    showUser = false,

    onView

}: BookingCardProps) {


    // ==========================================
    // DERIVED VALUES
    // ==========================================

    const ResourceIcon = resourceType
        ? resourceIcons[resourceType]
        : Layers;

    const resourceColor = resourceType
        ? resourceColors[resourceType]
        : "bg-indigo-50 text-indigo-600";

    const duration = formatDuration(
        booking.startTime,
        booking.endTime
    );

    const sameDay =
        new Date(booking.startTime).toDateString() ===
        new Date(booking.endTime).toDateString();


    // ==========================================
    // RENDER
    // ==========================================

    return (

        <article
            className="
                flex
                h-full
                flex-col
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm
                transition-all
                duration-200
                hover:border-indigo-200
                hover:shadow-md
            "
        >

            {/* Card Header */}

            <div className="flex items-start justify-between gap-3">

                <div
                    className={`rounded-xl p-3 ${resourceColor}`}
                >

                    <ResourceIcon size={27} />

                </div>

                <BookingBadge
                    status={booking.status}
                />

            </div>


            {/* Resource Information */}

            <div className="mt-5">

                <h3 className="wrap-break-words text-lg font-semibold text-slate-900">

                    {resourceName ||
                        `Resource #${booking.resourceId.slice(-6).toUpperCase()}`}

                </h3>

                <p className="mt-1 text-xs font-medium text-indigo-600">

                    {resourceType
                        ? resourceTypeLabels[resourceType]
                        : "Resource Booking"}

                </p>

                <p
                    title={booking._id}
                    className="mt-2 text-xs text-slate-400"
                >

                    Booking #{booking._id.slice(-8).toUpperCase()}

                </p>

            </div>


            {/* Schedule Information */}

            <div className="mt-5 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4">

                {/* Booking Date */}

                <div className="flex items-start gap-3">

                    <CalendarDays
                        size={18}
                        className="mt-0.5 shrink-0 text-indigo-500"
                    />

                    <div>

                        <p className="text-xs text-slate-500">

                            Booking Date

                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">

                            {formatDate(booking.startTime)}

                            {!sameDay && (
                                <>
                                    {" — "}
                                    {formatDate(booking.endTime)}
                                </>
                            )}

                        </p>

                    </div>

                </div>


                {/* Booking Time */}

                <div className="flex items-start gap-3">

                    <Clock3
                        size={18}
                        className="mt-0.5 shrink-0 text-indigo-500"
                    />

                    <div>

                        <p className="text-xs text-slate-500">

                            Time Slot

                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">

                            {formatTime(booking.startTime)}

                            {" — "}

                            {formatTime(booking.endTime)}

                        </p>

                    </div>

                </div>


                {/* Duration */}

                <div className="flex items-start gap-3">

                    <CalendarClock
                        size={18}
                        className="mt-0.5 shrink-0 text-indigo-500"
                    />

                    <div>

                        <p className="text-xs text-slate-500">

                            Duration

                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">

                            {duration}

                        </p>

                    </div>

                </div>

            </div>


            {/* Booking Owner — Admin View */}

            {showUser && (

                <div className="mt-4 flex items-start gap-3">

                    <UserRound
                        size={18}
                        className="mt-0.5 shrink-0 text-slate-400"
                    />

                    <div className="min-w-0">

                        <p className="text-xs text-slate-500">

                            Booked By

                        </p>

                        <p className="mt-1 wrap-break-words text-sm font-medium text-slate-800">

                            {userName ||
                                `User #${booking.userId.slice(-6).toUpperCase()}`}

                        </p>

                    </div>

                </div>

            )}


            {/* Booking Purpose */}

            <div className="mt-5 flex-1">

                <div className="flex items-center gap-2">

                    <FileText
                        size={16}
                        className="text-slate-400"
                    />

                    <h4 className="text-sm font-semibold text-slate-700">

                        Booking Purpose

                    </h4>

                </div>

                <p className="mt-2 line-clamp-3 whitespace-pre-wrap wrap-break-words text-sm leading-relaxed text-slate-500">

                    {booking.purpose}

                </p>

            </div>


            {/* Related Ticket */}

            {booking.ticketId && (

                <div className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2">

                    <Ticket
                        size={16}
                        className="shrink-0 text-indigo-600"
                    />

                    <p
                        title={booking.ticketId}
                        className="truncate text-xs font-medium text-indigo-700"
                    >

                        Linked Ticket #

                        {booking.ticketId.slice(-8).toUpperCase()}

                    </p>

                </div>

            )}


            {/* Rejection Note */}

            {booking.status === "REJECTED" &&
                booking.decisionNote && (

                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">

                    <div className="flex items-center gap-2">

                        <MessageSquare
                            size={16}
                            className="shrink-0 text-red-600"
                        />

                        <h4 className="text-xs font-semibold text-red-700">

                            Rejection Reason

                        </h4>

                    </div>

                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap wrap-break-words text-xs leading-relaxed text-red-600">

                        {booking.decisionNote}

                    </p>

                </div>

            )}


            {/* Booking Creation Date */}

            <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">

                <CalendarDays size={14} />

                <span>

                    Requested on{" "}

                    {formatDate(booking.createdAt)}

                </span>

            </div>


            {/* Card Footer */}

            <div className="mt-4 border-t border-slate-100 pt-4">

                <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    text="View Details"
                    endIcon={<ArrowRight size={16} />}
                    onClick={() => onView(booking)}
                    className="w-full"
                />

            </div>

        </article>

    );

}