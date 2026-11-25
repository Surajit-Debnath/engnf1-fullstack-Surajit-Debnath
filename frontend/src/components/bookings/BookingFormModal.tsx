import {
    useEffect,
    useRef,
    useState
} from "react";

import type { FormEvent } from "react";

import axios from "axios";

import {
    X,
    CalendarPlus,
    CalendarCheck,
    CalendarDays,
    Clock3,
    Users,
    Info,
    AlertCircle,
    Layers,
    Ticket
} from "lucide-react";

import { Button } from "../ui/Button";

import { createBooking } from "../../services/bookingService";

import {
    BOOKING_CONSTRAINTS
} from "../../types/booking";

import type {
    Booking,
    CreateBookingPayload
} from "../../types/booking";

import type {
    Resource
} from "../../types/resource";

import {
    resourceTypeLabels
} from "../../types/resource";

import type {
    AvailableSlot
} from "../resources/ResourceAvailability";


// ==========================================
// PROPS
// ==========================================

interface BookingFormModalProps {

    resource: Resource;

    slot: AvailableSlot;

    onClose: () => void;

    onSuccess: (booking: Booking) => void;

}


// ==========================================
// CONFIGURATION
// ==========================================

const MINUTE_MS = 60 * 1000;

const SLOT_MS =
    BOOKING_CONSTRAINTS.SLOT_INTERVAL_MINUTES *
    MINUTE_MS;

const MAX_ADVANCE_MS =
    BOOKING_CONSTRAINTS.MAX_ADVANCE_DAYS *
    24 * 60 * 60 * 1000;

const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i;

const inputStyles = `
    w-full
    rounded-xl
    border
    border-slate-200
    bg-white
    px-4
    py-3
    text-sm
    text-slate-800
    outline-none
    transition
    focus:border-indigo-500
    focus:ring-2
    focus:ring-indigo-100
    disabled:cursor-not-allowed
    disabled:bg-slate-100
`;


// ==========================================
// DATE UTILITIES
// ==========================================

function formatTime(timestamp: number): string {

    return new Date(timestamp).toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        }
    );

}

function formatDate(timestamp: number): string {

    return new Date(timestamp).toLocaleDateString(
        "en-IN",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

}


// ==========================================
// GENERATE VALID START TIMES
// ==========================================

function generateStartTimes(
    slot: AvailableSlot,
    now: number
): number[] {

    const slotStart =
        new Date(slot.startTime).getTime();

    const slotEnd =
        new Date(slot.endTime).getTime();

    if (
        !Number.isFinite(slotStart) ||
        !Number.isFinite(slotEnd)
    ) {
        return [];
    }

    // Start time must be strictly in the future.

    const earliestStart = Math.max(
        slotStart,
        now + 1
    );

    // Align to the next UTC half-hour boundary.

    const alignedStart =
        Math.ceil(earliestStart / SLOT_MS) *
        SLOT_MS;

    const minimumDuration =
        BOOKING_CONSTRAINTS.MIN_DURATION_MINUTES *
        MINUTE_MS;

    const latestStart = Math.min(

        slotEnd - minimumDuration,

        now + MAX_ADVANCE_MS

    );

    const startTimes: number[] = [];

    for (
        let time = alignedStart;
        time <= latestStart;
        time += SLOT_MS
    ) {

        startTimes.push(time);

    }

    return startTimes;

}


// ==========================================
// GENERATE VALID DURATIONS
// ==========================================

function generateDurations(
    startTime: number,
    slotEnd: number
): number[] {

    const durations: number[] = [];

    const availableMinutes =
        (slotEnd - startTime) / MINUTE_MS;

    const maximumDuration = Math.min(

        availableMinutes,

        BOOKING_CONSTRAINTS.MAX_DURATION_MINUTES

    );

    for (

        let duration =
            BOOKING_CONSTRAINTS.MIN_DURATION_MINUTES;

        duration <= maximumDuration;

        duration +=
            BOOKING_CONSTRAINTS.SLOT_INTERVAL_MINUTES

    ) {

        durations.push(duration);

    }

    return durations;

}


// ==========================================
// FORMAT DURATION
// ==========================================

function formatDuration(minutes: number): string {

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
// BOOKING FORM MODAL
// ==========================================

export default function BookingFormModal({

    resource,

    slot,

    onClose,

    onSuccess

}: BookingFormModalProps) {


    // ==========================================
    // STATE
    // ==========================================

    const [now, setNow] = useState(
        () => Date.now()
    );

    const [selectedStart, setSelectedStart] =
        useState<number | null>(null);

    const [duration, setDuration] =
        useState<number>(
            BOOKING_CONSTRAINTS.MIN_DURATION_MINUTES
        );

    const [purpose, setPurpose] = useState("");

    const [ticketId, setTicketId] = useState("");

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const purposeRef =
        useRef<HTMLTextAreaElement>(null);

    const submittingRef = useRef(false);


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
    // MODAL BEHAVIOUR
    // ==========================================

    useEffect(() => {

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow = "hidden";

        purposeRef.current?.focus();

        return () => {

            document.body.style.overflow =
                previousOverflow;

        };

    }, []);


    // ==========================================
    // ESCAPE KEY
    // ==========================================

    useEffect(() => {

        function handleKeyDown(event: KeyboardEvent) {

            if (
                event.key === "Escape" &&
                !loading &&
                !submittingRef.current
            ) {

                onClose();

            }

        }

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {

            window.removeEventListener(
                "keydown",
                handleKeyDown
            );

        };

    }, [loading, onClose]);


    // ==========================================
    // DERIVED VALUES
    // ==========================================

    const slotStart =
        new Date(slot.startTime).getTime();

    const slotEnd =
        new Date(slot.endTime).getTime();

    const startTimes = generateStartTimes(
        slot,
        now
    );

    const startTime =
        selectedStart !== null &&
        startTimes.includes(selectedStart)

            ? selectedStart

            : selectedStart === null
                ? startTimes[0] ?? null
                : null;

    const durationOptions =
        startTime !== null

            ? generateDurations(
                startTime,
                slotEnd
            )

            : [];

    const validDuration =
        durationOptions.includes(duration)

            ? duration

            : durationOptions[0] ?? 0;

    const endTime =
        startTime !== null && validDuration > 0

            ? startTime +
                validDuration * MINUTE_MS

            : null;

    const normalizedPurpose = purpose.trim();

    const normalizedTicketId = ticketId.trim();

    const isPurposeValid =

        normalizedPurpose.length >=
            BOOKING_CONSTRAINTS.MIN_PURPOSE_LENGTH &&

        normalizedPurpose.length <=
            BOOKING_CONSTRAINTS.MAX_PURPOSE_LENGTH;

    const isTicketValid =

        normalizedTicketId === "" ||

        OBJECT_ID_REGEX.test(normalizedTicketId);

    const hasAvailableTimes =
        startTimes.length > 0;

    const canSubmit =

        resource.isActive &&

        OBJECT_ID_REGEX.test(resource._id) &&

        startTime !== null &&

        endTime !== null &&

        validDuration > 0 &&

        isPurposeValid &&

        isTicketValid &&

        !loading;


    // ==========================================
    // HANDLE START TIME CHANGE
    // ==========================================

    function handleStartTimeChange(value: string) {

        setSelectedStart(
            value === "" ? null : Number(value)
        );

        setDuration(
            BOOKING_CONSTRAINTS.MIN_DURATION_MINUTES
        );

        setError("");

    }


    // ==========================================
    // HANDLE RESET
    // ==========================================

    function handleReset() {

        if (loading || submittingRef.current) return;

        setSelectedStart(null);

        setDuration(
            BOOKING_CONSTRAINTS.MIN_DURATION_MINUTES
        );

        setPurpose("");

        setTicketId("");

        setError("");

    }


    // ==========================================
    // HANDLE CLOSE
    // ==========================================

    function handleClose() {

        if (loading || submittingRef.current) return;

        onClose();

    }


    // ==========================================
    // HANDLE BOOKING SUBMISSION
    // ==========================================

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {

        event.preventDefault();

        if (
            !canSubmit ||
            submittingRef.current ||
            startTime === null ||
            endTime === null
        ) {
            return;
        }

        setError("");

        // Read the actual clock at submission time.
        // This runs inside a user event handler.

        const currentTime = Date.now();

        if (startTime <= currentTime) {

            setNow(currentTime);

            setSelectedStart(startTime);

            setError(
                "The selected start time has passed. Please select another time."
            );

            return;

        }

        if (
            startTime >
            currentTime + MAX_ADVANCE_MS
        ) {

            setError(
                "Bookings cannot start more than 30 days ahead."
            );

            return;

        }

        if (
            startTime < slotStart ||
            endTime > slotEnd
        ) {

            setError(
                "The booking must remain within the selected available interval."
            );

            return;

        }

        if (
            startTime % SLOT_MS !== 0 ||
            endTime % SLOT_MS !== 0
        ) {

            setError(
                "Booking times must align to 30-minute UTC boundaries."
            );

            return;

        }

        const payload: CreateBookingPayload = {

            resourceId: resource._id,

            startTime:
                new Date(startTime).toISOString(),

            endTime:
                new Date(endTime).toISOString(),

            purpose: normalizedPurpose,

            ...(normalizedTicketId
                ? { ticketId: normalizedTicketId }
                : {})

        };

        submittingRef.current = true;

        setLoading(true);

        let createdBooking: Booking;

        try {

            const response =
                await createBooking(payload);

            createdBooking = response.booking;

        } catch (err) {

            if (axios.isAxiosError(err)) {

                const status = err.response?.status;

                const message =
                    err.response?.data?.error?.message ??
                    err.response?.data?.message;

                if (status === 409) {

                    setError(
                        typeof message === "string"

                            ? message

                            : "Booking conflict. Close this form and refresh resource availability before trying again."
                    );

                } else if (status === 404) {

                    setError(
                        typeof message === "string"

                            ? message

                            : "The selected resource or referenced ticket was not found."
                    );

                } else if (status === 400) {

                    setError(
                        typeof message === "string"

                            ? message

                            : "Invalid booking information. Please check your inputs."
                    );

                } else if (
                    status === 401 ||
                    status === 403
                ) {

                    setError(
                        "You are not authorized to create this booking. Please check your session."
                    );

                } else {

                    setError(
                        typeof message === "string"

                            ? message

                            : "Unable to create booking. Please try again."
                    );

                }

            } else {

                setError(
                    "Something went wrong. Please try again."
                );

            }

            return;

        } finally {

            submittingRef.current = false;

            setLoading(false);

        }

        onSuccess(createdBooking);

    }


    // ==========================================
    // RENDER
    // ==========================================

    return (

        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            onClick={handleClose}
        >

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="booking-modal-title"
                className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={event => event.stopPropagation()}
            >

                {/* Modal Header */}

                <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">

                    <div className="flex items-center gap-3">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100">

                            <CalendarPlus
                                size={25}
                                className="text-indigo-600"
                            />

                        </div>

                        <div>

                            <h2
                                id="booking-modal-title"
                                className="text-xl font-bold text-slate-900"
                            >

                                Book a Resource

                            </h2>

                            <p className="mt-1 text-xs text-slate-500">

                                Schedule a resource for your support activity.

                            </p>

                        </div>

                    </div>

                    <button
                        type="button"
                        aria-label="Close booking form"
                        disabled={loading}
                        onClick={handleClose}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                    >

                        <X size={22} />

                    </button>

                </div>


                {/* Booking Form */}

                <form
                    onSubmit={handleSubmit}
                    className="flex min-h-0 flex-1 flex-col"
                >

                    <div className="space-y-6 overflow-y-auto p-5 sm:p-6">


                        {/* Resource Information */}

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                            <div className="flex items-center justify-between gap-3">

                                <div className="flex items-center gap-3">

                                    <div className="rounded-xl bg-white p-3 shadow-sm">

                                        <Layers
                                            size={23}
                                            className="text-indigo-600"
                                        />

                                    </div>

                                    <div>

                                        <h3 className="font-semibold text-slate-900">

                                            {resource.name}

                                        </h3>

                                        <p className="mt-1 text-xs text-slate-500">

                                            {resourceTypeLabels[resource.type]}

                                        </p>

                                    </div>

                                </div>

                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                        resource.isActive
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-slate-200 text-slate-600"
                                    }`}
                                >

                                    {resource.isActive
                                        ? "Active"
                                        : "Inactive"}

                                </span>

                            </div>

                            <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">

                                <Users size={16} />

                                Capacity: {resource.capacity}

                            </div>

                        </div>


                        {/* Selected Available Interval */}

                        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">

                            <div className="flex items-center gap-2 text-indigo-700">

                                <CalendarDays size={18} />

                                <h3 className="text-sm font-semibold">

                                    Selected Available Interval

                                </h3>

                            </div>

                            <p className="mt-3 font-semibold text-slate-800">

                                {formatDate(slotStart)}

                            </p>

                            <p className="mt-1 text-sm text-indigo-600">

                                {formatTime(slotStart)}

                                {" — "}

                                {formatTime(slotEnd)}

                            </p>

                        </div>


                        {/* API Error */}

                        {error && (

                            <div
                                role="alert"
                                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
                            >

                                <AlertCircle
                                    size={20}
                                    className="shrink-0 text-red-600"
                                />

                                <p className="text-sm leading-relaxed text-red-700">

                                    {error}

                                </p>

                            </div>

                        )}


                        {/* No Valid Start Times */}

                        {!hasAvailableTimes && (

                            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">

                                <AlertCircle
                                    size={20}
                                    className="shrink-0 text-amber-600"
                                />

                                <div>

                                    <p className="text-sm font-semibold text-amber-700">

                                        No Valid Booking Times

                                    </p>

                                    <p className="mt-1 text-xs leading-relaxed text-amber-700">

                                        This interval does not contain a
                                        valid future 30-minute booking
                                        within the next 30 days.
                                        Please select another interval.

                                    </p>

                                </div>

                            </div>

                        )}


                        {/* Start Time and Duration */}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                            <div>

                                <label
                                    htmlFor="booking-start"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >

                                    Start Time *

                                </label>

                                <select
                                    id="booking-start"
                                    value={startTime ?? ""}
                                    onChange={event =>
                                        handleStartTimeChange(
                                            event.target.value
                                        )
                                    }
                                    disabled={
                                        loading ||
                                        !hasAvailableTimes
                                    }
                                    required
                                    className={inputStyles}
                                >

                                    {startTime === null && (

                                        <option value="">

                                            Select start time

                                        </option>

                                    )}

                                    {startTimes.map(time => (

                                        <option
                                            key={time}
                                            value={time}
                                        >

                                            {formatTime(time)}

                                        </option>

                                    ))}

                                </select>

                            </div>

                            <div>

                                <label
                                    htmlFor="booking-duration"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >

                                    Duration *

                                </label>

                                <select
                                    id="booking-duration"
                                    value={validDuration || ""}
                                    onChange={event => {

                                        if (startTime !== null) {

                                            setSelectedStart(startTime);

                                        }

                                        setDuration(
                                            Number(event.target.value)
                                        );

                                        setError("");

                                    }}
                                    disabled={
                                        loading ||
                                        durationOptions.length === 0
                                    }
                                    required
                                    className={inputStyles}
                                >

                                    {durationOptions.length === 0 && (

                                        <option value="">

                                            No duration available

                                        </option>

                                    )}

                                    {durationOptions.map(minutes => (

                                        <option
                                            key={minutes}
                                            value={minutes}
                                        >

                                            {formatDuration(minutes)}

                                        </option>

                                    ))}

                                </select>

                            </div>

                        </div>


                        {/* Calculated End Time */}

                        <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">

                            <div className="flex items-center gap-2 text-sm text-slate-600">

                                <Clock3
                                    size={18}
                                    className="text-indigo-600"
                                />

                                Calculated End Time

                            </div>

                            <span className="font-semibold text-slate-900">

                                {endTime !== null

                                    ? formatTime(endTime)

                                    : "—"}

                            </span>

                        </div>


                        {/* Booking Purpose */}

                        <div>

                            <label
                                htmlFor="booking-purpose"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >

                                Booking Purpose *

                            </label>

                            <textarea
                                ref={purposeRef}
                                id="booking-purpose"
                                value={purpose}
                                onChange={event => {

                                    if (startTime !== null) {

                                        setSelectedStart(startTime);

                                    }

                                    setPurpose(event.target.value);

                                    setError("");

                                }}
                                placeholder="Describe why you need this resource..."
                                rows={4}
                                minLength={
                                    BOOKING_CONSTRAINTS.MIN_PURPOSE_LENGTH
                                }
                                maxLength={
                                    BOOKING_CONSTRAINTS.MAX_PURPOSE_LENGTH
                                }
                                required
                                disabled={loading}
                                className={`${inputStyles} resize-none`}
                            />

                            <div className="mt-2 flex items-center justify-between gap-2">

                                <span className="text-xs text-slate-500">

                                    Minimum 5 characters

                                </span>

                                <span className="text-xs text-slate-500">

                                    {purpose.length}/200

                                </span>

                            </div>

                        </div>


                        {/* Optional Ticket Reference */}

                        <div>

                            <label
                                htmlFor="booking-ticket"
                                className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                            >

                                <Ticket size={16} />

                                Related Ticket ID

                                <span className="font-normal text-slate-400">

                                    (Optional)

                                </span>

                            </label>

                            <input
                                id="booking-ticket"
                                type="text"
                                value={ticketId}
                                onChange={event => {

                                    if (startTime !== null) {

                                        setSelectedStart(startTime);

                                    }

                                    setTicketId(event.target.value);

                                    setError("");

                                }}
                                placeholder="Enter the MongoDB ticket ID"
                                maxLength={24}
                                disabled={loading}
                                aria-invalid={!isTicketValid}
                                className={`${inputStyles} ${
                                    !isTicketValid
                                        ? "border-red-400"
                                        : ""
                                }`}
                            />

                            {!isTicketValid ? (

                                <p className="mt-2 text-xs text-red-600">

                                    Enter a valid 24-character MongoDB ObjectId.

                                </p>

                            ) : (

                                <p className="mt-2 text-xs text-slate-500">

                                    Link this booking to an existing support
                                    ticket if required.

                                </p>

                            )}

                        </div>


                        {/* Booking Rules */}

                        <div className="rounded-xl border border-slate-200 p-4">

                            <h3 className="text-sm font-semibold text-slate-800">

                                Booking Rules

                            </h3>

                            <ul className="mt-3 list-disc space-y-2 pl-5 text-xs leading-relaxed text-slate-500">

                                <li>

                                    Booking duration must be between
                                    30 minutes and 4 hours.

                                </li>

                                <li>

                                    Bookings must align to
                                    30-minute time boundaries.

                                </li>

                                <li>

                                    Bookings can start up to
                                    30 days in advance.

                                </li>

                                <li>

                                    You can have a maximum of
                                    3 future active bookings.

                                </li>

                                <li>

                                    All times are displayed in
                                    your local timezone.

                                </li>

                            </ul>

                        </div>


                        {/* Approval Information */}

                        <div className="flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4">

                            <Info
                                size={20}
                                className="shrink-0 text-indigo-600"
                            />

                            <div>

                                <p className="text-sm font-semibold text-indigo-700">

                                    Administrator Approval Required

                                </p>

                                <p className="mt-1 text-xs leading-relaxed text-indigo-600">

                                    Your booking request will remain
                                    pending until an administrator
                                    approves or rejects it.

                                </p>

                            </div>

                        </div>

                    </div>


                    {/* Modal Footer */}

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white p-5 sm:p-6">

                        <Button
                            variant="secondary"
                            size="md"
                            text="Reset"
                            disabled={loading}
                            onClick={handleReset}
                        />

                        <div className="flex flex-wrap items-center gap-3">

                            <Button
                                variant="secondary"
                                size="md"
                                text="Cancel"
                                disabled={loading}
                                onClick={handleClose}
                            />

                            <Button
                                variant="primary"
                                size="md"
                                type="submit"
                                text="Request Booking"
                                startIcon={
                                    <CalendarCheck size={18} />
                                }
                                loading={loading}
                                disabled={!canSubmit}
                            />

                        </div>

                    </div>

                </form>

            </div>

        </div>

    );

}