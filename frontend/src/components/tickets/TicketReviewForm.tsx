import { useState } from "react";
import type { FormEvent } from "react";

import axios from "axios";

import {
    ShieldCheck,
    Save,
    RotateCcw,
    UserRound,
    UserMinus,
    AlertCircle,
    CircleCheck,
    Info
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
    const [success, setSuccess] = useState("");


    // Detect modified fields

    const hasChanges =
        category !== ticket.category ||
        priority !== ticket.priority ||
        status !== ticket.status ||
        (assigneeId.trim() || null) !==
            (ticket.assigneeId ?? null);


    const categoryChanged =
        category !== ticket.category;

    const willBeReviewed =
        categoryChanged ||
        (
            ticket.status === "OPEN" &&
            status !== "OPEN"
        );


    // Reset form

    function resetForm() {

        setCategory(ticket.category);
        setPriority(ticket.priority);
        setStatus(ticket.status);
        setAssigneeId(ticket.assigneeId ?? "");

        setError("");
        setSuccess("");

    }


    // Submit changes

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {

        event.preventDefault();

        if (loading || !hasChanges) return;

        setError("");
        setSuccess("");

        if (!user?.email) {

            setError(
                "Unable to identify the authenticated user."
            );

            return;
        }

        const normalizedAssignee =
            assigneeId.trim() || null;


        // Validate MongoDB ObjectId

        if (
            normalizedAssignee !== null &&
            !/^[a-f\d]{24}$/i.test(normalizedAssignee)
        ) {

            setError(
                "Assignee ID must be a valid 24-character MongoDB ObjectId."
            );

            return;
        }


        // Send only modified fields

        const updates: UpdateTicketPayload = {};

        if (category !== ticket.category) {
            updates.category = category;
        }

        if (priority !== ticket.priority) {
            updates.priority = priority;
        }

        if (status !== ticket.status) {
            updates.status = status;
        }

        if (
            normalizedAssignee !==
            (ticket.assigneeId ?? null)
        ) {
            updates.assigneeId = normalizedAssignee;
        }

        if (Object.keys(updates).length === 0) return;


        setLoading(true);

        try {

            const response = await updateTicket(
                ticket._id,
                updates,
                user.email
            );

            // Synchronize form with backend response

            setCategory(response.ticket.category);
            setPriority(response.ticket.priority);
            setStatus(response.ticket.status);

            setAssigneeId(
                response.ticket.assigneeId ?? ""
            );

            onUpdated(response);

            setSuccess(
                "Ticket updated successfully."
            );

        } catch (err) {

            if (axios.isAxiosError(err)) {

                const message =
                    err.response?.data?.error?.message ??
                    err.response?.data?.message;

                setError(
                    typeof message === "string"
                        ? message
                        : "Unable to update the ticket."
                );

            } else {

                setError("Something went wrong.");

            }

        } finally {

            setLoading(false);

        }

    }


    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">

            {/* Header */}

            <div className="flex items-center gap-3">

                <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">

                    <ShieldCheck size={24} />

                </div>

                <div>

                    <h2 className="text-lg font-semibold text-slate-900">
                        Human Review
                    </h2>

                    <p className="text-sm text-slate-500">
                        Review and update ticket information
                    </p>

                </div>

            </div>


            <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-5"
            >

                {/* Error Message */}

                {error && (

                    <div
                        role="alert"
                        className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >

                        <AlertCircle
                            size={18}
                            className="shrink-0"
                        />

                        {error}

                    </div>

                )}


                {/* Success Message */}

                {success && (

                    <div
                        role="status"
                        className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
                    >

                        <CircleCheck size={18} />

                        {success}

                    </div>

                )}


                {/* Category */}

                <div>

                    <label
                        htmlFor="review-category"
                        className="mb-2 block text-sm font-medium text-slate-700"
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
                            setSuccess("");
                        }}
                        className={inputStyles}
                    >

                        {categories.map(item => (

                            <option key={item} value={item}>
                                {formatLabel(item)}
                            </option>

                        ))}

                    </select>

                </div>


                {/* Priority */}

                <div>

                    <label
                        htmlFor="review-priority"
                        className="mb-2 block text-sm font-medium text-slate-700"
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
                            setSuccess("");
                        }}
                        className={inputStyles}
                    >

                        {priorities.map(item => (

                            <option key={item} value={item}>
                                {formatLabel(item)}
                            </option>

                        ))}

                    </select>

                </div>


                {/* Status */}

                <div>

                    <label
                        htmlFor="review-status"
                        className="mb-2 block text-sm font-medium text-slate-700"
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
                            setSuccess("");
                        }}
                        className={inputStyles}
                    >

                        {statuses.map(item => (

                            <option key={item} value={item}>
                                {formatLabel(item)}
                            </option>

                        ))}

                    </select>

                </div>


                {/* Assignee */}

                <div>

                    <label
                        htmlFor="review-assignee"
                        className="mb-2 block text-sm font-medium text-slate-700"
                    >
                        Assignee ID
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
                            setSuccess("");
                        }}
                        className={inputStyles}
                    />

                    <div className="mt-3 flex flex-wrap gap-2">

                        <Button
                            variant="secondary"
                            size="sm"
                            text="Assign to Me"
                            startIcon={<UserRound size={15} />}
                            disabled={loading || !user?._id}
                            onClick={() => {
                                setAssigneeId(user?._id ?? "");
                                setSuccess("");
                            }}
                        />

                        <Button
                            variant="secondary"
                            size="sm"
                            text="Unassign"
                            startIcon={<UserMinus size={15} />}
                            disabled={loading || !assigneeId}
                            onClick={() => {
                                setAssigneeId("");
                                setSuccess("");
                            }}
                        />

                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                        Enter a valid user ObjectId or assign
                        the ticket to yourself.
                    </p>

                </div>


                {/* Human Override Warning */}

                {categoryChanged && (

                    <div className="flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4">

                        <ShieldCheck
                            size={20}
                            className="shrink-0 text-indigo-600"
                        />

                        <div>

                            <p className="text-sm font-semibold text-indigo-700">
                                Human Override Protection
                            </p>

                            <p className="mt-1 text-xs leading-relaxed text-indigo-600">
                                Changing the category activates
                                human override protection.
                                Future imports will preserve
                                the manually selected category.
                            </p>

                        </div>

                    </div>

                )}


                {/* Review Information */}

                {!ticket.isReviewed && willBeReviewed && (

                    <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">

                        <Info
                            size={18}
                            className="shrink-0"
                        />

                        Saving these changes will mark
                        the ticket as reviewed.

                    </div>

                )}


                {/* Actions */}

                <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">

                    <Button
                        variant="secondary"
                        size="md"
                        text="Reset"
                        startIcon={<RotateCcw size={16} />}
                        disabled={loading || !hasChanges}
                        onClick={resetForm}
                    />

                    <Button
                        variant="primary"
                        size="md"
                        type="submit"
                        text="Save Changes"
                        startIcon={<Save size={18} />}
                        loading={loading}
                        disabled={!hasChanges || !user}
                        className="flex-1"
                    />

                </div>

            </form>

        </section>
    );
}