import { useState } from "react";
import type { FormEvent } from "react";

import axios from "axios";

import {
    ShieldCheck,
    RotateCcw,
    UserRound,
    UserMinus,
    AlertCircle,
    CircleCheck,
    Info,
    ArrowRight
} from "lucide-react";

import { Button } from "../ui/Button";

import { updateTicket } from "../../services/ticketService";

import {
    categories,
    priorities,
    statuses,
    formatLabel
} from "../../types/ticket";

import type {
    UpdateTicketPayload,
    UpdateTicketResponse
} from "../../types/ticket";

import type {
    Ticket,
    TicketCategory,
    TicketPriority,
    TicketStatus,
    User
} from "../../types/dashboard";


interface TicketReviewFormProps {
    ticket: Ticket;
    user: User | null;
    onUpdated: (response: UpdateTicketResponse) => void;
}


const inputStyles = `
    w-full rounded-xl border border-slate-300
    bg-white px-4 py-3 text-sm text-slate-700
    outline-none transition
    focus:border-indigo-600 focus:ring-4
    focus:ring-indigo-100
    disabled:cursor-not-allowed disabled:opacity-60
`;


export default function TicketReviewForm({
    ticket,
    user,
    onUpdated
}: TicketReviewFormProps) {

    // ==========================================
    // FORM STATE
    // ==========================================

    const [category, setCategory] =
        useState<TicketCategory>(ticket.category);

    const [priority, setPriority] =
        useState<TicketPriority>(ticket.priority);

    const [status, setStatus] =
        useState<TicketStatus>(ticket.status);

    const [assigneeId, setAssigneeId] =
        useState(ticket.assigneeId ?? "");

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");


    // ==========================================
    // DETECT CHANGES
    // ==========================================

    const normalizedAssignee =
        assigneeId.trim() || null;

    const categoryChanged =
        category !== ticket.category;

    const priorityChanged =
        priority !== ticket.priority;

    const statusChanged =
        status !== ticket.status;

    const assigneeChanged =
        normalizedAssignee !== (ticket.assigneeId ?? null);


    const hasChanges =
        categoryChanged ||
        priorityChanged ||
        statusChanged ||
        assigneeChanged;


    // ==========================================
    // REVIEW RULES
    // ==========================================

    const statusChangedFromOpen =
        ticket.status === "OPEN" && status !== "OPEN";

    const canCompleteReview = categoryChanged || statusChangedFromOpen;

    const willHaveHumanOverride =
        ticket.isHumanOverride || categoryChanged;

    // ==========================================
    // RESET FORM
    // ==========================================

    function resetForm() {

        setCategory(ticket.category);

        setPriority(ticket.priority);

        setStatus(ticket.status);

        setAssigneeId(ticket.assigneeId ?? "");

        setError("");

    }


    // ==========================================
    // SUBMIT REVIEW
    // ==========================================

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {

        event.preventDefault();

        if (loading || ticket.isReviewed || !canCompleteReview) return;

        setError("");


        // Validate authenticated user

        if (!user?.email) {

            setError(
                "Unable to identify the authenticated user."
            );

            return;
        }


        // Validate assignee ObjectId

        if (
            normalizedAssignee !== null &&
            !/^[a-f\d]{24}$/i.test(normalizedAssignee)
        ) {

            setError(
                "Assignee ID must be a valid 24-character MongoDB ObjectId."
            );

            return;
        }


        // Prepare PATCH payload

        const updates: UpdateTicketPayload = {};

        if (categoryChanged) {
            updates.category = category;
        }

        if (priorityChanged) {

            updates.priority = priority;

        }

        if (statusChanged) {

            updates.status = status;

        }

        if (assigneeChanged) {

            updates.assigneeId = normalizedAssignee;

        }


        setLoading(true);


        try {

            const response = await updateTicket(
                ticket._id,
                updates,
                user.email
            );


            // Synchronize with actual backend response

            setCategory(response.ticket.category);

            setPriority(response.ticket.priority);

            setStatus(response.ticket.status);

            setAssigneeId(
                response.ticket.assigneeId ?? ""
            );


            // Confirm backend has completed the review

            if (!response.ticket.isReviewed) {

                setError(
                    "Changes were saved, but the ticket is still awaiting review. Refresh the ticket before continuing."
                );

                return;
            }


            // Parent handles navigation to Triage Queue

            onUpdated(response);


        } catch (err) {

            if (axios.isAxiosError(err)) {

                const message =
                    err.response?.data?.error?.message ??
                    err.response?.data?.message;

                setError(
                    typeof message === "string"
                        ? message
                        : "Unable to save ticket review."
                );

            } else {

                setError(
                    "Something went wrong. Please try again."
                );

            }

        } finally {

            setLoading(false);

        }

    }
    // ==========================================
    // RENDER FORM
    // ==========================================

    return (

        <section className="rounded-2xl border border-slate-200 bg-white p-6">

            {/* Header */}

            <div className="flex items-center gap-3">

                <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">

                    <ShieldCheck size={26} />

                </div>

                <div>

                    <h2 className="text-lg font-semibold text-slate-900">

                        Human Review

                    </h2>

                    <p className="mt-1 text-sm text-slate-500">

                        Verify classification and update ticket information.

                    </p>

                </div>

            </div>


            <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-6"
            >


                {/* Error Message */}

                {error && (

                    <div
                        role="alert"
                        className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >

                        <AlertCircle
                            size={20}
                            className="shrink-0"
                        />

                        <p>{error}</p>

                    </div>

                )}


                {/* Review Instructions */}

                {!ticket.isReviewed && (

                    <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4">

                        <Info
                            size={20}
                            className="shrink-0 text-indigo-600"
                        />

                        <div>

                            <p className="text-sm font-semibold text-indigo-700">

                                Complete Ticket Review

                            </p>

                            <p className="mt-2 text-xs leading-relaxed text-indigo-600">

                                Verify the automated category and priority.
                                To complete the review, change the category or
                                transition the status from Open to another status.
                                Changing only priority or assignee does not
                                complete the review.

                            </p>

                        </div>

                    </div>

                )}


                {/* Category */}

                <div>

                    <label
                        htmlFor="review-category"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                    >

                        Ticket Category

                    </label>

                    <select
                        id="review-category"
                        value={category}
                        disabled={loading}
                        onChange={event => {

                            setCategory(
                                event.target.value as TicketCategory
                            );

                            setError("");

                        }}
                        className={inputStyles}
                    >

                        {categories.map(item => (

                            <option
                                key={item}
                                value={item}
                            >

                                {formatLabel(item)}

                            </option>

                        ))}

                    </select>

                    <p className="mt-2 text-xs text-slate-500">

                        Automated classification:{" "}

                        <span className="font-semibold text-indigo-600">

                            {formatLabel(ticket.autoCategory)}

                        </span>

                    </p>

                    {categoryChanged && (

                        <p className="mt-1 text-xs font-medium text-amber-600">

                            Category has been manually changed.

                        </p>

                    )}

                </div>


                {/* Priority */}

                <div>

                    <label
                        htmlFor="review-priority"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                    >

                        Ticket Priority

                    </label>

                    <select
                        id="review-priority"
                        value={priority}
                        disabled={loading}
                        onChange={event => {

                            setPriority(
                                event.target.value as TicketPriority
                            );

                            setError("");

                        }}
                        className={inputStyles}
                    >

                        {priorities.map(item => (

                            <option
                                key={item}
                                value={item}
                            >

                                {formatLabel(item)}

                            </option>

                        ))}

                    </select>

                </div>


                {/* Status */}

                <div>

                    <label
                        htmlFor="review-status"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                    >

                        Ticket Status

                    </label>

                    <select
                        id="review-status"
                        value={status}
                        disabled={loading}
                        onChange={event => {

                            setStatus(
                                event.target.value as TicketStatus
                            );

                            setError("");

                        }}
                        className={inputStyles}
                    >

                        {statuses.map(item => (

                            <option
                                key={item}
                                value={item}
                            >

                                {formatLabel(item)}

                            </option>

                        ))}

                    </select>



                </div>


                {/* Assignee */}

                <div>

                    <label
                        htmlFor="review-assignee"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                    >

                        Assigned Agent

                    </label>

                    <input
                        id="review-assignee"
                        type="text"
                        value={assigneeId}
                        disabled={loading}
                        placeholder="Unassigned"
                        maxLength={24}
                        onChange={event => {

                            setAssigneeId(event.target.value);

                            setError("");

                        }}
                        className={inputStyles}
                    />


                    {/* Current Assignee */}

                    {assigneeId && user &&
                        assigneeId === user._id && (

                        <p className="mt-2 flex items-center gap-2 text-xs font-medium text-indigo-600">

                            <UserRound size={14} />

                            Assigned to you ({user.name})

                        </p>

                    )}


                    {/* Assignment Actions */}

                    <div className="mt-3 flex flex-wrap gap-2">

                        <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            text="Assign to Me"
                            startIcon={<UserRound size={15} />}
                            disabled={
                                loading ||
                                !user?._id ||
                                assigneeId === user._id
                            }
                            onClick={() => {

                                setAssigneeId(user?._id ?? "");

                                setError("");

                            }}
                        />

                        <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            text="Unassign"
                            startIcon={<UserMinus size={15} />}
                            disabled={loading || !assigneeId}
                            onClick={() => {

                                setAssigneeId("");

                                setError("");

                            }}
                        />

                    </div>

                    <p className="mt-2 text-xs text-slate-500">

                        Assign yourself or enter a valid user ObjectId.

                    </p>

                </div>


                {/* Human Override Protection */}

                {categoryChanged && (

                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">

                        <ShieldCheck
                            size={22}
                            className="shrink-0 text-amber-600"
                        />

                        <div>

                            <p className="text-sm font-semibold text-amber-700">

                                Human Override Protection

                            </p>

                            <p className="mt-1 text-xs leading-relaxed text-amber-600">

                                Changing the category activates
                                human override protection.
                                Future automatic imports will
                                preserve the manually selected category.

                            </p>

                        </div>

                    </div>

                )}


                {/* Review Summary */}

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                    <h3 className="mb-4 text-sm font-semibold text-slate-800">

                        Review Summary

                    </h3>

                    <div className="space-y-3">

                        {/* Review Status */}

                        <div className="flex items-center justify-between gap-3">

                            <span className="text-xs text-slate-600">

                                Review Status After Saving

                            </span>

                            <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    ticket.isReviewed || canCompleteReview
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-amber-100 text-amber-700"
                                }`}
                            >

                                {ticket.isReviewed || canCompleteReview
                                    ? "Reviewed"
                                    : "Awaiting Review"}

                            </span>

                        </div>


                        {/* Human Override */}

                        <div className="flex items-center justify-between gap-3">

                            <span className="text-xs text-slate-600">

                                Human Override

                            </span>

                            <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    willHaveHumanOverride
                                        ? "bg-indigo-100 text-indigo-700"
                                        : "bg-slate-200 text-slate-600"
                                }`}
                            >

                                {willHaveHumanOverride
                                    ? "Protected"
                                    : "Not Activated"}

                            </span>

                        </div>


                        {/* Number of Changes */}

                        <div className="flex items-center justify-between gap-3">

                            <span className="text-xs text-slate-600">

                                Modified Fields

                            </span>

                            <span className="text-sm font-semibold text-slate-800">

                                {
                                    Number(categoryChanged) +
                                    Number(priorityChanged) +
                                    Number(statusChanged) +
                                    Number(assigneeChanged)
                                }

                            </span>

                        </div>

                    </div>

                </div>


                {/* Review Completion Feedback */}

                {!ticket.isReviewed && canCompleteReview && (

                    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                        <CircleCheck
                            size={20}
                            className="shrink-0 text-emerald-600"
                        />

                        <div>

                            <p className="text-sm font-semibold text-emerald-700">

                                Ready to Complete Review

                            </p>

                            <p className="mt-1 text-xs leading-relaxed text-emerald-600">

                                Saving these changes will mark
                                the ticket as reviewed and return
                                you to the Triage Queue.

                            </p>

                        </div>

                    </div>

                )}


                {!ticket.isReviewed && !canCompleteReview && (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <Info size={20} className="shrink-0 text-amber-600" />
                        <div>
                            <p className="text-sm font-semibold text-amber-700">
                                Review Action Required
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-amber-600">
                                Change the category or transition the status from
                                Open to enable Save Review.
                            </p>
                        </div>
                    </div>
                )}

                {/* Form Actions */}

                <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5">

                    <Button
                        variant="secondary"
                        size="md"
                        type="button"
                        text="Reset"
                        startIcon={<RotateCcw size={16} />}
                        disabled={loading || !hasChanges}
                        onClick={resetForm}
                    />

                        <Button
                            variant="primary"
                            size="md"
                            type="submit"
                            text="Save Review"
                            startIcon={<ShieldCheck size={18} />}
                            endIcon={<ArrowRight size={16} />}
                            loading={loading}
                            disabled={
                                !user?.email || loading || ticket.isReviewed || !canCompleteReview
                            }
                            className="flex-1"
                        />

                </div>

                <p className="text-center text-xs text-slate-400">

                    You will return to the Triage Queue
                    after a successful review.

                </p>

            </form>

        </section>

    );

}
