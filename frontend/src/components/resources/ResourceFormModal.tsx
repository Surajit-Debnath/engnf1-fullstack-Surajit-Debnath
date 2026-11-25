import { useState, useEffect } from "react";
import type { FormEvent } from "react";

import axios from "axios";

import {
    X,
    Plus,
    Pencil,
    Save,
    AlertCircle,
    Layers
} from "lucide-react";

import { Button } from "../ui/Button";

import {
    createResource,
    updateResource
} from "../../services/resourceService";

import {
    resourceTypes,
    resourceTypeLabels
} from "../../types/resource";

import type {
    Resource,
    ResourceType,
    CreateResourcePayload,
    UpdateResourcePayload
} from "../../types/resource";


// ==========================================
// COMPONENT PROPS
// ==========================================

interface ResourceFormModalProps {
    resource?: Resource | null;
    onClose: () => void;
    onSuccess: (resource: Resource) => void;
}


// ==========================================
// COMMON INPUT STYLES
// ==========================================

const inputStyles = `
    w-full rounded-xl border border-slate-300
    bg-white px-4 py-3 text-sm text-slate-700
    outline-none transition
    focus:border-indigo-600
    focus:ring-4 focus:ring-indigo-100
    disabled:cursor-not-allowed
    disabled:opacity-60
`;


// ==========================================
// RESOURCE FORM MODAL
// ==========================================

export default function ResourceFormModal({
    resource,
    onClose,
    onSuccess
}: ResourceFormModalProps) {

    const isEditing = Boolean(resource);


    // ==========================================
    // FORM STATE
    // ==========================================

    const [name, setName] = useState(
        resource?.name ?? ""
    );

    const [type, setType] = useState<ResourceType>(
        resource?.type ?? "ROOM"
    );

    const [capacity, setCapacity] = useState(
        resource ? String(resource.capacity) : "1"
    );

    const [description, setDescription] = useState(
        resource?.description ?? ""
    );

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const [fieldErrors, setFieldErrors] = useState<
        Record<string, string>
    >({});


    // ==========================================
    // DETECT CHANGES
    // ==========================================

    const hasChanges =
        !resource ||
        name.trim() !== resource.name ||
        type !== resource.type ||
        Number(capacity) !== resource.capacity ||
        (description.trim() || null) !==
            (resource.description || null);


    // ==========================================
    // PREVENT BACKGROUND SCROLL
    // ==========================================

    useEffect(() => {

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow =
                previousOverflow;
        };

    }, []);


    // ==========================================
    // ESCAPE KEY HANDLING
    // ==========================================

    useEffect(() => {

        function handleKeyDown(event: KeyboardEvent) {

            if (event.key === "Escape" && !loading) {
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
    // CLEAR FIELD ERRORS
    // ==========================================

    function clearFieldError(field: string) {

        setError("");

        setFieldErrors(previous => ({
            ...previous,
            [field]: ""
        }));

    }


    // ==========================================
    // FORM VALIDATION
    // ==========================================

    function validateForm(): boolean {

        const errors: Record<string, string> = {};

        const normalizedName = name.trim();

        const numericCapacity = Number(capacity);

        const normalizedDescription =
            description.trim();


        // Resource name

        if (normalizedName.length < 3) {

            errors.name =
                "Resource name must contain at least 3 characters.";

        } else if (normalizedName.length > 60) {

            errors.name =
                "Resource name cannot exceed 60 characters.";

        }


        // Resource type

        if (!resourceTypes.includes(type)) {

            errors.type = "Select a valid resource type.";

        }


        // Capacity

        if (
            capacity.trim() === "" ||
            !Number.isInteger(numericCapacity) ||
            numericCapacity < 1 ||
            numericCapacity > 500
        ) {

            errors.capacity =
                "Capacity must be an integer between 1 and 500.";

        }


        // Description

        if (normalizedDescription.length > 300) {

            errors.description =
                "Description cannot exceed 300 characters.";

        }

        setFieldErrors(errors);

        return Object.keys(errors).length === 0;

    }


    // ==========================================
    // HANDLE SUBMISSION
    // ==========================================

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {

        event.preventDefault();

        if (loading || !hasChanges) return;

        setError("");

        if (!validateForm()) return;


        const payload: CreateResourcePayload = {
            name: name.trim(),
            type,
            capacity: Number(capacity),
            description: description.trim() || null
        };


        setLoading(true);

        try {

            // UPDATE EXISTING RESOURCE

            if (resource) {

                const updates: UpdateResourcePayload = {};

                if (payload.name !== resource.name) {

                    updates.name = payload.name;

                }

                if (payload.type !== resource.type) {

                    updates.type = payload.type;

                }

                if (
                    payload.capacity !== resource.capacity
                ) {

                    updates.capacity = payload.capacity;

                }

                if (
                    payload.description !==
                    (resource.description || null)
                ) {

                    updates.description =
                        payload.description;

                }

                if (Object.keys(updates).length === 0) {

                    setError("No changes to save.");

                    return;

                }

                const response = await updateResource(
                    resource._id,
                    updates
                );

                onSuccess(response.resource);

            } else {

                // CREATE NEW RESOURCE

                const response = await createResource(
                    payload
                );

                onSuccess(response.resource);

            }

        } catch (err) {

            if (axios.isAxiosError(err)) {

                const status = err.response?.status;

                const message =
                    err.response?.data?.error?.message ??
                    err.response?.data?.message;


                // Duplicate resource name

                if (status === 409) {

                    setFieldErrors(previous => ({
                        ...previous,
                        name: "A resource with this name already exists."
                    }));

                    setError(
                        "Please choose a different resource name."
                    );

                } else {

                    setError(
                        typeof message === "string"
                            ? message
                            : "Unable to save resource. Please try again."
                    );

                }

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
    // RENDER MODAL
    // ==========================================

    return (

        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
            onClick={event => {

                if (
                    event.target === event.currentTarget &&
                    !loading
                ) {
                    onClose();
                }

            }}
        >

            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="resource-modal-title"
                className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >

                {/* Modal Header */}

                <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">

                    <div className="flex items-center gap-3">

                        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">

                            {isEditing ? (
                                <Pencil size={24} />
                            ) : (
                                <Layers size={24} />
                            )}

                        </div>

                        <div>

                            <h2
                                id="resource-modal-title"
                                className="text-xl font-semibold text-slate-900"
                            >

                                {isEditing
                                    ? "Edit Resource"
                                    : "Add Resource"}

                            </h2>

                            <p className="mt-1 text-sm text-slate-500">

                                {isEditing
                                    ? "Update shared resource information."
                                    : "Create a new shared resource."}

                            </p>

                        </div>

                    </div>

                    <button
                        type="button"
                        aria-label="Close resource form"
                        disabled={loading}
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                    >

                        <X size={22} />

                    </button>

                </div>


                {/* Resource Form */}

                <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="flex min-h-0 flex-1 flex-col"
                >

                    <div className="space-y-5 overflow-y-auto p-6">


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


                        {/* Resource Name */}

                        <div>

                            <label
                                htmlFor="resource-name"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >

                                Resource Name
                                <span className="ml-1 text-red-500">
                                    *
                                </span>

                            </label>

                            <input
                                id="resource-name"
                                type="text"
                                value={name}
                                maxLength={60}
                                required
                                autoFocus
                                disabled={loading}
                                placeholder="e.g. Conference Room A"
                                onChange={event => {

                                    setName(event.target.value);

                                    clearFieldError("name");

                                }}
                                className={`${inputStyles} ${
                                    fieldErrors.name
                                        ? "border-red-500"
                                        : ""
                                }`}
                            />

                            <div className="mt-2 flex justify-between gap-2">

                                <p className="text-xs text-red-600">

                                    {fieldErrors.name}

                                </p>

                                <span className="shrink-0 text-xs text-slate-400">

                                    {name.length}/60

                                </span>

                            </div>

                        </div>


                        {/* Type and Capacity */}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">


                            {/* Resource Type */}

                            <div>

                                <label
                                    htmlFor="resource-form-type"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >

                                    Resource Type
                                    <span className="ml-1 text-red-500">
                                        *
                                    </span>

                                </label>

                                <select
                                    id="resource-form-type"
                                    value={type}
                                    disabled={loading}
                                    onChange={event => {

                                        setType(
                                            event.target.value as ResourceType
                                        );

                                        clearFieldError("type");

                                    }}
                                    className={`${inputStyles} ${
                                        fieldErrors.type
                                            ? "border-red-500"
                                            : ""
                                    }`}
                                >

                                    {resourceTypes.map(item => (

                                        <option
                                            key={item}
                                            value={item}
                                        >

                                            {resourceTypeLabels[item]}

                                        </option>

                                    ))}

                                </select>

                                {fieldErrors.type && (

                                    <p className="mt-2 text-xs text-red-600">

                                        {fieldErrors.type}

                                    </p>

                                )}

                            </div>


                            {/* Capacity */}

                            <div>

                                <label
                                    htmlFor="resource-form-capacity"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >

                                    Capacity
                                    <span className="ml-1 text-red-500">
                                        *
                                    </span>

                                </label>

                                <input
                                    id="resource-form-capacity"
                                    type="number"
                                    min={1}
                                    max={500}
                                    step={1}
                                    required
                                    value={capacity}
                                    disabled={loading}
                                    onChange={event => {

                                        setCapacity(
                                            event.target.value
                                        );

                                        clearFieldError("capacity");

                                    }}
                                    className={`${inputStyles} ${
                                        fieldErrors.capacity
                                            ? "border-red-500"
                                            : ""
                                    }`}
                                />

                                {fieldErrors.capacity ? (

                                    <p className="mt-2 text-xs text-red-600">

                                        {fieldErrors.capacity}

                                    </p>

                                ) : (

                                    <p className="mt-2 text-xs text-slate-400">

                                        Maximum capacity: 500

                                    </p>

                                )}

                            </div>

                        </div>


                        {/* Description */}

                        <div>

                            <label
                                htmlFor="resource-description"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >

                                Description

                                <span className="ml-2 text-xs font-normal text-slate-400">

                                    Optional

                                </span>

                            </label>

                            <textarea
                                id="resource-description"
                                rows={4}
                                maxLength={300}
                                value={description}
                                disabled={loading}
                                placeholder="Describe the resource and its purpose..."
                                onChange={event => {

                                    setDescription(
                                        event.target.value
                                    );

                                    clearFieldError("description");

                                }}
                                className={`${inputStyles} resize-none ${
                                    fieldErrors.description
                                        ? "border-red-500"
                                        : ""
                                }`}
                            />

                            <div className="mt-2 flex justify-between gap-2">

                                <p className="text-xs text-red-600">

                                    {fieldErrors.description}

                                </p>

                                <span className="shrink-0 text-xs text-slate-400">

                                    {description.length}/300

                                </span>

                            </div>

                        </div>


                        {/* Resource Status — Edit Mode */}

                        {resource && (

                            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">

                                <span className="text-sm font-medium text-slate-600">

                                    Current Status

                                </span>

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

                        )}

                    </div>


                    {/* Modal Footer */}

                    <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 p-6">

                        <Button
                            variant="secondary"
                            size="md"
                            type="button"
                            text="Cancel"
                            disabled={loading}
                            onClick={onClose}
                        />

                        <Button
                            variant="primary"
                            size="md"
                            type="submit"
                            text={
                                isEditing
                                    ? "Save Changes"
                                    : "Create Resource"
                            }
                            startIcon={
                                isEditing
                                    ? <Save size={18} />
                                    : <Plus size={18} />
                            }
                            loading={loading}
                            disabled={!hasChanges || loading}
                        />

                    </div>

                </form>

            </section>

        </div>

    );

}