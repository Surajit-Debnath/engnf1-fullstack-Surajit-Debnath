import {
    Clock3,
    CircleCheck,
    CircleX,
    Ban
} from "lucide-react";

import type {
    BookingStatus
} from "../../types/booking";

import {
    bookingStatusLabels
} from "../../types/booking";

interface BookingBadgeProps {
    status: BookingStatus;
    className?: string;
}

const statusStyles = {

    PENDING: {
        icon: Clock3,
        className:
            "border-amber-200 bg-amber-50 text-amber-700"
    },

    APPROVED: {
        icon: CircleCheck,
        className:
            "border-emerald-200 bg-emerald-50 text-emerald-700"
    },

    REJECTED: {
        icon: CircleX,
        className:
            "border-red-200 bg-red-50 text-red-700"
    },

    CANCELLED: {
        icon: Ban,
        className:
            "border-slate-200 bg-slate-100 text-slate-600"
    }

};

export default function BookingBadge({
    status,
    className = ""
}: BookingBadgeProps) {

    const styles = statusStyles[status];

    const StatusIcon = styles.icon;

    return (

        <span
            className={`
                inline-flex
                w-fit
                items-center
                gap-1.5
                whitespace-nowrap
                rounded-full
                border
                px-3
                py-1
                text-xs
                font-semibold
                ${styles.className}
                ${className}
            `}
        >

            <StatusIcon size={14} />

            {bookingStatusLabels[status]}

        </span>

    );

}