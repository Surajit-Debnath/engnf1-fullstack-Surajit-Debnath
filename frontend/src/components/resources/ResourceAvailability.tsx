import { useEffect, useState } from "react";

import axios from "axios";

import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    LoaderCircle,
    AlertCircle,
    Clock3,
    CircleCheck,
    CalendarCheck,
    ArrowRight
} from "lucide-react";

import { Button } from "../ui/Button";

import {
    getResourceAvailability
} from "../../services/resourceService";

import type {
    ResourceBookingSlot
} from "../../types/resource";

import {
    BOOKING_CONSTRAINTS
} from "../../types/booking";
// ==========================================
// TYPES
// ==========================================

export interface AvailableSlot {
    startTime: string;
    endTime: string;
}

interface ResourceAvailabilityProps {

    resourceId: string;

    refreshTrigger?: number;

    onSelectSlot?: (slot: AvailableSlot) => void;

}

type SlotStatus =
    | "AVAILABLE"
    | "PENDING"
    | "APPROVED"
    | "PAST";

interface TimeSlot {
    startTime: string;
    endTime: string;
    status: SlotStatus;
}


// ==========================================
// CONFIGURATION
// ==========================================

const START_HOUR = 9;
const END_HOUR = 18;

const DAYS_PER_WEEK = 7;

const MAX_RANGE_MS =
    7 * 24 * 60 * 60 * 1000;

const BOOKING_SLOT_MS =
    BOOKING_CONSTRAINTS.SLOT_INTERVAL_MINUTES *
    60 * 1000;

const MIN_BOOKING_MS =
    BOOKING_CONSTRAINTS.MIN_DURATION_MINUTES *
    60 * 1000;

const MAX_ADVANCE_MS =
    BOOKING_CONSTRAINTS.MAX_ADVANCE_DAYS *
    24 * 60 * 60 * 1000;

// ==========================================
// DATE UTILITIES
// ==========================================
function isBookableSlot(
    slot: TimeSlot,
    now: number
): boolean {

    if (slot.status !== "AVAILABLE") {
        return false;
    }

    const start = Math.max(
        new Date(slot.startTime).getTime(),
        now + 1
    );

    const alignedStart =
        Math.ceil(start / BOOKING_SLOT_MS) *
        BOOKING_SLOT_MS;

    const end =
        new Date(slot.endTime).getTime();

    return (

        alignedStart + MIN_BOOKING_MS <= end &&

        alignedStart <= now + MAX_ADVANCE_MS

    );

}
function startOfDay(date: Date): Date {

    const result = new Date(date);

    result.setHours(0, 0, 0, 0);

    return result;
}

function addDays(date: Date, days: number): Date {

    const result = new Date(date);

    result.setDate(result.getDate() + days);

    return result;
}

function isSameDay(first: Date, second: Date): boolean {

    return (
        first.getFullYear() === second.getFullYear() &&
        first.getMonth() === second.getMonth() &&
        first.getDate() === second.getDate()
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

function formatDate(date: Date): string {

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function getDayBoundary(
    date: Date,
    hour: number
): number {

    const result = new Date(date);

    result.setHours(hour, 0, 0, 0);

    return result.getTime();
}


// ==========================================
// CALCULATE DAILY TIME INTERVALS
// ==========================================

function calculateTimeSlots(
    date: Date,
    bookings: ResourceBookingSlot[],
    now: number
): TimeSlot[] {

    const dayStart = getDayBoundary(
        date,
        START_HOUR
    );

    const dayEnd = getDayBoundary(
        date,
        END_HOUR
    );

    // Keep only bookings overlapping the display window.

    const occupied = bookings
        .map(booking => ({
            start: Math.max(
                new Date(booking.startTime).getTime(),
                dayStart
            ),
            end: Math.min(
                new Date(booking.endTime).getTime(),
                dayEnd
            ),
            status: booking.status
        }))
        .filter(booking => booking.start < booking.end);


    // Collect every boundary where availability can change.

    const boundaries = new Set<number>([
        dayStart,
        dayEnd
    ]);

    for (const booking of occupied) {

        boundaries.add(booking.start);
        boundaries.add(booking.end);

    }

    // Separate elapsed time from future availability.

    if (now > dayStart && now < dayEnd) {

        boundaries.add(now);

    }

    const sortedBoundaries =
        [...boundaries].sort((a, b) => a - b);

    const slots: TimeSlot[] = [];


    // Determine the status of each interval.

    for (
        let index = 0;
        index < sortedBoundaries.length - 1;
        index++
    ) {

        const start = sortedBoundaries[index];

        const end = sortedBoundaries[index + 1];

        const overlapping = occupied.filter(
            booking =>
                booking.start < end &&
                booking.end > start
        );

        let status: SlotStatus;

        if (
            overlapping.some(
                booking => booking.status === "APPROVED"
            )
        ) {

            status = "APPROVED";

        } else if (
            overlapping.some(
                booking => booking.status === "PENDING"
            )
        ) {

            status = "PENDING";

        } else if (end <= now) {

            status = "PAST";

        } else {

            status = "AVAILABLE";

        }


        // Merge adjacent intervals with identical status.

        const previous = slots[slots.length - 1];

        if (
            previous &&
            previous.status === status &&
            new Date(previous.endTime).getTime() === start
        ) {

            previous.endTime =
                new Date(end).toISOString();

        } else {

            slots.push({
                startTime: new Date(start).toISOString(),
                endTime: new Date(end).toISOString(),
                status
            });

        }

    }

    return slots;
}


// ==========================================
// SLOT STYLES
// ==========================================

const slotStyles: Record<
    SlotStatus,
    {
        label: string;
        container: string;
        icon: string;
        bar: string;
    }
> = {

    AVAILABLE: {
        label: "Available",
        container:
            "border-emerald-200 bg-emerald-50",
        icon: "text-emerald-600",
        bar: "bg-emerald-400"
    },

    PENDING: {
        label: "Pending Booking",
        container:
            "border-amber-200 bg-amber-50",
        icon: "text-amber-600",
        bar: "bg-amber-400"
    },

    APPROVED: {
        label: "Approved Booking",
        container:
            "border-red-200 bg-red-50",
        icon: "text-red-600",
        bar: "bg-red-400"
    },

    PAST: {
        label: "Past Time",
        container:
            "border-slate-200 bg-slate-100",
        icon: "text-slate-400",
        bar: "bg-slate-300"
    }

};

const slotIcons = {
    AVAILABLE: CircleCheck,
    PENDING: Clock3,
    APPROVED: CalendarCheck,
    PAST: Clock3
};


// ==========================================
// RESOURCE AVAILABILITY COMPONENT
// ==========================================

export default function ResourceAvailability({
    resourceId,
    refreshTrigger = 0,
    onSelectSlot
}: ResourceAvailabilityProps) {


    // ==========================================
    // COMPONENT STATE
    // ==========================================

    const [now, setNow] = useState(
        () => Date.now()
    );

    const [weekStart, setWeekStart] = useState(
        () => startOfDay(new Date())
    );

    const [selectedDay, setSelectedDay] = useState(
        () => startOfDay(new Date())
    );

    const [bookings, setBookings] = useState<
        ResourceBookingSlot[]
    >([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [refreshKey, setRefreshKey] = useState(0);

    const [selectedSlot, setSelectedSlot] =
        useState<AvailableSlot | null>(null);


    // ==========================================
    // UPDATE CURRENT TIME
    // ==========================================

    useEffect(() => {

        const timer = window.setInterval(() => {

            setNow(Date.now());

        }, 30000);

        return () => window.clearInterval(timer);

    }, []);


    // ==========================================
    // FETCH WEEKLY AVAILABILITY
    // ==========================================

    useEffect(() => {

        const controller = new AbortController();

        async function fetchAvailability() {

            setLoading(true);
            setError("");
            setSelectedSlot(null);

            try {

                const from = weekStart.getTime();

                const to = addDays(
                    weekStart,
                    DAYS_PER_WEEK
                ).getTime();

                const allBookings: ResourceBookingSlot[] =
                    [];


                // Backend permits a maximum range of 7 days.
                // Splitting also handles daylight-saving changes.

                let cursor = from;

                while (cursor < to) {

                    const rangeEnd = Math.min(
                        cursor + MAX_RANGE_MS,
                        to
                    );

                    const response =
                        await getResourceAvailability(
                            resourceId,
                            {
                                from: new Date(
                                    cursor
                                ).toISOString(),

                                to: new Date(
                                    rangeEnd
                                ).toISOString()
                            },
                            controller.signal
                        );

                    allBookings.push(
                        ...response.bookings
                    );

                    cursor = rangeEnd;

                }

                if (controller.signal.aborted) return;

                setBookings(allBookings);

            } catch (err) {

                if (
                    controller.signal.aborted ||
                    axios.isCancel(err)
                ) {
                    return;
                }

                if (axios.isAxiosError(err)) {

                    const message =
                        err.response?.data?.error?.message ??
                        err.response?.data?.message;

                    setError(
                        typeof message === "string"
                            ? message
                            : "Unable to load resource availability."
                    );

                } else {

                    setError(
                        "Something went wrong. Please try again."
                    );

                }

            } finally {

                if (!controller.signal.aborted) {

                    setLoading(false);

                }

            }

        }

        const timer = window.setTimeout(
            fetchAvailability,
            0
        );

        return () => {

            window.clearTimeout(timer);
            controller.abort();

        };

    }, [
        resourceId,
        weekStart,
        refreshKey,
        refreshTrigger
    ]);


    // ==========================================
    // DERIVED VALUES
    // ==========================================

    const today = startOfDay(new Date(now));

    const weekDays = Array.from(
        { length: DAYS_PER_WEEK },
        (_, index) => addDays(weekStart, index)
    );

    const weekEnd = addDays(
        weekStart,
        DAYS_PER_WEEK - 1
    );

    const timeSlots = calculateTimeSlots(
        selectedDay,
        bookings,
        now
    );

    const availableSlots = timeSlots.filter(
        slot => slot.status === "AVAILABLE"
    );

    const totalAvailableMinutes =
        availableSlots.reduce((total, slot) => {

            const duration =
                new Date(slot.endTime).getTime() -
                new Date(slot.startTime).getTime();

            return total + duration / 60000;

        }, 0);

    const availableHours = Math.floor(
        totalAvailableMinutes / 60
    );

    const availableMinutes = Math.floor(
        totalAvailableMinutes % 60
    );

    const displayDuration =
        getDayBoundary(selectedDay, END_HOUR) -
        getDayBoundary(selectedDay, START_HOUR);

    const validSelectedSlot = selectedSlot
    ? availableSlots.some(slot => {

        const start = Math.max(
            new Date(selectedSlot.startTime).getTime(),
            now
        );

        const end = new Date(
            selectedSlot.endTime
        ).getTime();

        return (
            start < end &&
            new Date(slot.startTime).getTime() <= start &&
            new Date(slot.endTime).getTime() >= end
        );

    })
    : false;


    // ==========================================
    // CALENDAR NAVIGATION
    // ==========================================

    function handleWeekChange(direction: number) {

        const nextWeek = addDays(
            weekStart,
            direction * DAYS_PER_WEEK
        );

        const normalizedWeek =
            nextWeek < today ? today : nextWeek;

        setLoading(true);
        setSelectedSlot(null);

        setWeekStart(normalizedWeek);
        setSelectedDay(normalizedWeek);

    }

    function handleToday() {

        setSelectedSlot(null);
        setSelectedDay(today);

        if (!isSameDay(weekStart, today)) {

            setLoading(true);
            setWeekStart(today);

        }

    }

    function handleDaySelect(date: Date) {

        setSelectedDay(date);
        setSelectedSlot(null);

    }

    function handleRefresh() {

        setLoading(true);
        setSelectedSlot(null);

        setRefreshKey(previous => previous + 1);

    }


    // ==========================================
    // SELECT AVAILABLE INTERVAL
    // ==========================================

       function handleSlotSelect(slot: TimeSlot) {

    if (
        loading ||
        error ||
        !isBookableSlot(slot, now)
    ) {
        return;
    }

    const start = Math.max(
        new Date(slot.startTime).getTime(),
        now + 1
    );

    const alignedStart =
        Math.ceil(start / BOOKING_SLOT_MS) *
        BOOKING_SLOT_MS;

    setSelectedSlot({

        startTime:
            new Date(alignedStart).toISOString(),

        endTime: slot.endTime

    });

}

    // ==========================================
    // CONFIRM INTERVAL SELECTION
    // ==========================================

       function handleContinue() {

    if (
        !selectedSlot ||
        !validSelectedSlot ||
        !onSelectSlot ||
        loading ||
        error
    ) {
        return;
    }

    const start = Math.max(
        new Date(selectedSlot.startTime).getTime(),
        now + 1
    );

    const alignedStart =
        Math.ceil(start / BOOKING_SLOT_MS) *
        BOOKING_SLOT_MS;

    const end =
        new Date(selectedSlot.endTime).getTime();

    if (
        alignedStart + MIN_BOOKING_MS > end ||
        alignedStart > now + MAX_ADVANCE_MS
    ) {

        setSelectedSlot(null);

        return;

    }

    onSelectSlot({

        startTime:
            new Date(alignedStart).toISOString(),

        endTime: selectedSlot.endTime

    });

}


    // ==========================================
    // RENDER COMPONENT
    // ==========================================

    return (

        <div className="space-y-6">


            {/* Calendar Navigation */}

            <div className="flex flex-wrap items-center justify-between gap-3">

                <div className="flex items-center gap-3">

                    <button
                        type="button"
                        aria-label="Previous seven days"
                        disabled={weekStart <= today}
                        onClick={() => handleWeekChange(-1)}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >

                        <ChevronLeft size={20} />

                    </button>

                    <span className="text-sm font-semibold text-slate-800">

                        {formatDate(weekStart)}
                        {" — "}
                        {formatDate(weekEnd)}

                    </span>

                    <button
                        type="button"
                        aria-label="Next seven days"
                        onClick={() => handleWeekChange(1)}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
                    >

                        <ChevronRight size={20} />

                    </button>

                </div>

                <div className="flex gap-2">

                    <Button
                        variant="secondary"
                        size="sm"
                        text="Today"
                        onClick={handleToday}
                    />

                    <Button
                        variant="secondary"
                        size="sm"
                        text="Refresh"
                        startIcon={
                            <RefreshCw
                                size={15}
                                className={
                                    loading
                                        ? "animate-spin"
                                        : ""
                                }
                            />
                        }
                        disabled={loading}
                        onClick={handleRefresh}
                    />

                </div>

            </div>


            {/* Seven-Day Calendar */}

            <div className="grid grid-cols-7 gap-1 sm:gap-3">

                {weekDays.map(date => {

                    const isSelected = isSameDay(
                        date,
                        selectedDay
                    );

                    const isToday = isSameDay(
                        date,
                        today
                    );

                    return (

                        <button
                            key={date.toISOString()}
                            type="button"
                            aria-pressed={isSelected}
                            aria-label={formatDate(date)}
                            onClick={() =>
                                handleDaySelect(date)
                            }
                            className={`flex flex-col items-center rounded-xl border px-1 py-3 transition sm:px-3 ${
                                isSelected
                                    ? "border-indigo-600 bg-indigo-600 text-white shadow-md"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                            }`}
                        >

                            <span className="text-xs font-medium">

                                {date.toLocaleDateString(
                                    "en-IN",
                                    { weekday: "short" }
                                )}

                            </span>

                            <span className="mt-2 text-lg font-bold sm:text-2xl">

                                {date.getDate()}

                            </span>

                            <span className="mt-1 text-xs">

                                {date.toLocaleDateString(
                                    "en-IN",
                                    { month: "short" }
                                )}

                            </span>

                            {isToday && (

                                <span
                                    className={`mt-2 h-1.5 w-1.5 rounded-full ${
                                        isSelected
                                            ? "bg-white"
                                            : "bg-indigo-600"
                                    }`}
                                />

                            )}

                        </button>

                    );

                })}

            </div>


            {/* Availability Legend */}

            <div className="flex flex-wrap items-center gap-4">

                {(
                    Object.keys(slotStyles) as SlotStatus[]
                ).map(status => (

                    <div
                        key={status}
                        className="flex items-center gap-2"
                    >

                        <span
                            className={`h-3 w-3 rounded-full ${slotStyles[status].bar}`}
                        />

                        <span className="text-xs text-slate-600">

                            {slotStyles[status].label}

                        </span>

                    </div>

                ))}

            </div>


            {/* Loading State */}

            {loading ? (

                <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50">

                    <LoaderCircle
                        size={34}
                        className="animate-spin text-indigo-600"
                    />

                    <p className="mt-3 text-sm text-slate-500">

                        Checking resource availability...

                    </p>

                </div>

            ) : error ? (


                /* Error State */

                <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-5 text-center">

                    <AlertCircle
                        size={32}
                        className="text-red-500"
                    />

                    <p className="mt-3 text-sm font-semibold text-red-700">

                        Unable to Load Availability

                    </p>

                    <p className="mt-2 text-sm text-red-600">

                        {error}

                    </p>

                    <div className="mt-4">

                        <Button
                            variant="secondary"
                            size="sm"
                            text="Try Again"
                            onClick={handleRefresh}
                        />

                    </div>

                </div>

            ) : (

                <>


                    {/* Selected Date Summary */}

                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">

                        <div className="flex items-center gap-3">

                            <CalendarDays
                                size={24}
                                className="text-indigo-600"
                            />

                            <div>

                                <h3 className="font-semibold text-slate-800">

                                    {selectedDay.toLocaleDateString(
                                        "en-IN",
                                        {
                                            weekday: "long",
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric"
                                        }
                                    )}

                                </h3>

                                <p className="mt-1 text-xs text-slate-500">

                                    Display hours: 9:00 AM – 6:00 PM

                                </p>

                            </div>

                        </div>

                        <div>

                            <p className="text-sm font-semibold text-emerald-600">

                                {availableHours}h{" "}
                                {availableMinutes}m available

                            </p>

                            <p className="mt-1 text-xs text-slate-500">

                                {availableSlots.length} available intervals

                            </p>

                        </div>

                    </div>


                    {/* Availability Timeline */}

                    <div className="rounded-xl border border-slate-200 p-4">

                        <h3 className="mb-4 text-sm font-semibold text-slate-800">

                            Daily Timeline

                        </h3>

                        <div className="flex h-9 overflow-hidden rounded-lg bg-slate-100">

                            {timeSlots.map(slot => {

                                const duration =
                                    new Date(
                                        slot.endTime
                                    ).getTime() -
                                    new Date(
                                        slot.startTime
                                    ).getTime();

                                const width =
                                    duration /
                                    displayDuration *
                                    100;

                                return (

                                    <div
                                        key={slot.startTime}
                                        title={`${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}: ${slotStyles[slot.status].label}`}
                                        className={`h-full border-r border-white/60 ${slotStyles[slot.status].bar}`}
                                        style={{
                                            width: `${width}%`
                                        }}
                                    />

                                );

                            })}

                        </div>

                        <div className="mt-3 flex justify-between text-xs text-slate-400">

                            <span>9 AM</span>
                            <span>12 PM</span>
                            <span>3 PM</span>
                            <span>6 PM</span>

                        </div>

                    </div>


                    {/* Time Interval List */}

                    <div className="space-y-3">

                        <h3 className="font-semibold text-slate-800">

                            Time Intervals

                        </h3>

                        {timeSlots.map(slot => {

                            const styles =
                                slotStyles[slot.status];

                            const SlotIcon =
                                slotIcons[slot.status];

                            const isSelected =
                                validSelectedSlot &&
                                selectedSlot?.endTime ===
                                    slot.endTime &&
                                slot.status === "AVAILABLE";

                            const isAvailable = isBookableSlot(slot, now);;

                            return (

                                <button
                                    key={slot.startTime}
                                    type="button"
                                    disabled={  !isAvailable ||
                                                loading ||
                                             Boolean(error)}
                                    aria-pressed={isSelected}
                                    onClick={() =>
                                        handleSlotSelect(slot)
                                    }
                                    className={`flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition ${styles.container} ${
                                        isSelected
                                            ? "ring-2 ring-indigo-500"
                                            : isAvailable
                                                ? "cursor-pointer hover:shadow-sm"
                                                : "cursor-default"
                                    }`}
                                >

                                    <div className="flex items-center gap-3">

                                        <SlotIcon
                                            size={22}
                                            className={`shrink-0 ${styles.icon}`}
                                        />

                                        <div>

                                            <p className="text-sm font-semibold text-slate-800">

                                                {formatTime(slot.startTime)}
                                                {" — "}
                                                {formatTime(slot.endTime)}

                                            </p>

                                            <p className={`mt-1 text-xs font-medium ${styles.icon}`}>

                                                {slot.status === "AVAILABLE" && !isAvailable
                                                       ? "Outside booking limits"
                                                       : styles.label}

                                            </p>

                                        </div>

                                    </div>

                                    {isAvailable && (

                                        isSelected ? (

                                            <CircleCheck
                                                size={20}
                                                className="text-indigo-600"
                                            />

                                        ) : (

                                            <ChevronRight
                                                size={20}
                                                className="text-emerald-600"
                                            />

                                        )

                                    )}

                                </button>

                            );

                        })}

                    </div>


                    {/* No Availability */}

                    {availableSlots.length === 0 && (

                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

                            <p className="text-sm text-amber-700">

                                No available intervals remain within
                                the display hours for this date.
                                Please select another date.

                            </p>

                        </div>

                    )}


                    {/* Selected Interval */}

                    {selectedSlot && validSelectedSlot && (

                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-indigo-200 bg-indigo-50 p-5">

                            <div>

                                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">

                                    Selected Interval

                                </p>

                                <p className="mt-2 font-semibold text-slate-900">

                                    {formatTime(
                                        selectedSlot.startTime
                                    )}
                                    {" — "}
                                    {formatTime(
                                        selectedSlot.endTime
                                    )}

                                </p>

                                <p className="mt-1 text-sm text-slate-500">

                                    {formatDate(selectedDay)}

                                </p>

                            </div>

                            {onSelectSlot && (

                                <Button
                                    variant="primary"
                                    size="md"
                                    text="Continue to Booking"
                                    endIcon={
                                        <ArrowRight size={17} />
                                    }
                                    onClick={handleContinue}
                                />

                            )}

                        </div>

                    )}

                    <p className="text-xs leading-relaxed text-slate-400">

                        All times are displayed in your local
                        timezone. Availability may change before
                        a booking is submitted.

                    </p>

                </>

            )}

        </div>

    );

}