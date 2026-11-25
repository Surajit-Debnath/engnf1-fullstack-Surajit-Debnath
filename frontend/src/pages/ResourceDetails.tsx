import { useEffect, useState } from "react";

import {
    Link,
    useParams,
    useOutletContext
} from "react-router-dom";

import axios from "axios";

import {
    ArrowLeft,
    DoorOpen,
    Monitor,
    Wrench,
    Users,
    Layers,
    CalendarDays,
    FileText,
    Pencil,
    RefreshCw,
    LoaderCircle,
    AlertCircle,
    CircleCheck,
    X
} from "lucide-react";

import { Button } from "../components/ui/Button";

import ResourceFormModal from "../components/resources/ResourceFormModal";

import { getResourceDetails } from "../services/resourceService";

import { resourceTypeLabels } from "../types/resource";

import type { Resource } from "../types/resource";
import type { User } from "../types/dashboard";
import ResourceAvailability from
    "../components/resources/ResourceAvailability";

import BookingFormModal from
    "../components/bookings/BookingFormModal";

import type {
    AvailableSlot
} from "../components/resources/ResourceAvailability";

import type {
    Booking
} from "../types/booking";

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
// DASHBOARD CONTEXT
// ==========================================

interface DashboardContext {
    user: User | null;
}

// ==========================================
// RESOURCE DETAILS PAGE
// ==========================================

export default function ResourceDetails() {

    const { id } = useParams<{ id: string }>();

    const { user } =
        useOutletContext<DashboardContext>();

    const isAdmin = user?.role === "ADMIN";

    const dashboardPath = isAdmin
        ? "/admin/dashboard"
        : "/dashboard";

    const backPath = `${dashboardPath}/resources`;
    

    // ==========================================
    // PAGE STATE
    // ==========================================

    const [resource, setResource] =
        useState<Resource | null>(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [refreshKey, setRefreshKey] = useState(0);

    const [isModalOpen, setIsModalOpen] =
        useState(false);

    const [successMessage, setSuccessMessage] =
        useState("");

    // ==========================================
    // BOOKING STATE
    // ==========================================

    const [selectedBookingSlot, setSelectedBookingSlot] =useState<AvailableSlot | null>(null);

    const [availabilityRefreshKey, setAvailabilityRefreshKey] =useState(0);    
    // ==========================================
    // FETCH RESOURCE DETAILS
    // ==========================================

    useEffect(() => {

        const controller = new AbortController();

        async function fetchResource() {

            setLoading(true);
            setError("");
            setResource(null);

            if (!id || !/^[a-f\d]{24}$/i.test(id)) {

                setError("Invalid resource ID.");
                setLoading(false);

                return;

            }

            try {

                const response = await getResourceDetails(
                    id,
                    controller.signal
                );

                if (controller.signal.aborted) return;

                setResource(response.resource);

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

                    if (err.response?.status === 404) {

                        setError(
                            "Resource not found or no longer accessible."
                        );

                    } else {

                        setError(
                            typeof message === "string"
                                ? message
                                : "Unable to load resource details."
                        );

                    }

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
            fetchResource,
            0
        );

        return () => {

            window.clearTimeout(timer);
            controller.abort();

        };

    }, [id, refreshKey]);


    // ==========================================
    // REFRESH RESOURCE
    // ==========================================

    function handleRefresh() {

    setSelectedBookingSlot(null);

    setRefreshKey(previous => previous + 1);

    }


    // ==========================================
    // HANDLE RESOURCE UPDATE
    // ==========================================

    function handleResourceUpdated(
        updatedResource: Resource
    ) {

        setResource(updatedResource);

        setIsModalOpen(false);

        setSuccessMessage(
            `Resource "${updatedResource.name}" updated successfully.`
        );

        setRefreshKey(previous => previous + 1);

    }
    // ==========================================
// OPEN BOOKING MODAL
// ==========================================

function handleSlotSelected(slot: AvailableSlot) {

    if (!resource || !resource.isActive || !user) {
        return;
    }

    setSuccessMessage("");

    setSelectedBookingSlot(slot);

}


// ==========================================
// CLOSE BOOKING MODAL
// ==========================================

function handleBookingModalClose() {

    setSelectedBookingSlot(null);

}


// ==========================================
// HANDLE SUCCESSFUL BOOKING
// ==========================================

function handleBookingSuccess(booking: Booking) {

    setSelectedBookingSlot(null);

    setSuccessMessage(

        booking.status === "PENDING"

            ? "Booking request submitted successfully. Your request is awaiting administrator approval."

            : "Booking created successfully."

    );

    setAvailabilityRefreshKey(
        previous => previous + 1
    );

}

    // ==========================================
    // LOADING STATE
    // ==========================================

    if (loading) {

        return (

            <div className="flex min-h-[60vh] flex-col items-center justify-center">

                <LoaderCircle
                    size={42}
                    className="animate-spin text-indigo-600"
                />

                <p className="mt-4 text-sm text-slate-500">

                    Loading resource details...

                </p>

            </div>

        );

    }


    // ==========================================
    // ERROR STATE
    // ==========================================

    if (error || !resource) {

        return (

            <div className="space-y-6">

                <Link
                    to={backPath}
                    className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >

                    <ArrowLeft size={18} />

                    Back to Resources

                </Link>

                <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-red-200 bg-white p-6 text-center">

                    <div className="rounded-full bg-red-50 p-4">

                        <AlertCircle
                            size={36}
                            className="text-red-500"
                        />

                    </div>

                    <h2 className="mt-4 text-xl font-semibold text-slate-900">

                        Unable to Load Resource

                    </h2>

                    <p className="mt-2 max-w-md text-sm text-slate-500">

                        {error || "Resource not found."}

                    </p>

                    <div className="mt-5">

                        <Button
                            variant="primary"
                            size="md"
                            text="Try Again"
                            startIcon={<RefreshCw size={16} />}
                            onClick={handleRefresh}
                        />

                    </div>

                </div>

            </div>

        );

    }


    // ==========================================
    // DERIVED VALUES
    // ==========================================

    const ResourceIcon =
        resourceIcons[resource.type];

    const createdDate = new Date(
        resource.createdAt
    ).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });


    // ==========================================
    // RENDER PAGE
    // ==========================================

    return (

        <div className="space-y-6">

            {/* Page Navigation */}

            <div className="flex flex-wrap items-center justify-between gap-3">

                <Link
                    to={backPath}
                    className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 transition hover:text-indigo-800"
                >

                    <ArrowLeft size={18} />

                    {isAdmin
                        ? "Back to Manage Resources"
                        : "Back to Resources"}

                </Link>

                <div className="flex flex-wrap gap-3">

                    <Button
                        variant="secondary"
                        size="sm"
                        text="Refresh"
                        startIcon={<RefreshCw size={16} />}
                        onClick={handleRefresh}
                    />

                    {isAdmin && (

                        <Button
                            variant="primary"
                            size="sm"
                            text="Edit Resource"
                            startIcon={<Pencil size={16} />}
                            onClick={() => {

                                setSuccessMessage("");
                                setIsModalOpen(true);

                            }}
                        />

                    )}

                </div>

            </div>


            {/* Success Message */}

            {successMessage && (

                <div
                    role="status"
                    className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
                >

                    <div className="flex items-center gap-3">

                        <CircleCheck
                            size={21}
                            className="shrink-0 text-emerald-600"
                        />

                        <p className="text-sm font-medium text-emerald-700">

                            {successMessage}

                        </p>

                    </div>

                    <button
                        type="button"
                        aria-label="Dismiss success message"
                        onClick={() => setSuccessMessage("")}
                        className="rounded-lg p-1 text-emerald-600 hover:bg-emerald-100"
                    >

                        <X size={18} />

                    </button>

                </div>

            )}


            {/* Resource Header */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6">

                <div className="flex flex-wrap items-start gap-5">

                    <div
                        className={`rounded-2xl p-5 ${resourceColors[resource.type]}`}
                    >

                        <ResourceIcon size={42} />

                    </div>

                    <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-3">

                            <h1 className="wrap-break-words text-2xl font-bold text-slate-900 sm:text-3xl">

                                {resource.name}

                            </h1>

                            <span
                                className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                                    resource.isActive
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-slate-100 text-slate-600"
                                }`}
                            >

                                <span
                                    className={`h-2 w-2 rounded-full ${
                                        resource.isActive
                                            ? "bg-emerald-500"
                                            : "bg-slate-400"
                                    }`}
                                />

                                {resource.isActive
                                    ? "Active"
                                    : "Inactive"}

                            </span>

                        </div>

                        <p className="mt-2 text-sm font-medium text-indigo-600">

                            {resourceTypeLabels[resource.type]}

                        </p>

                        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">

                            <CalendarDays size={16} />

                            Added on {createdDate}

                        </div>

                    </div>

                </div>

            </section>


            {/* Inactive Resource Warning */}

            {!resource.isActive && (

                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">

                    <AlertCircle
                        size={22}
                        className="shrink-0 text-amber-600"
                    />

                    <div>

                        <p className="text-sm font-semibold text-amber-700">

                            Resource Inactive

                        </p>

                        <p className="mt-1 text-sm text-amber-600">

                            This resource is currently unavailable
                            for new bookings.

                        </p>

                    </div>

                </div>

            )}


            {/* Resource Information Cards */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

                {/* Capacity */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5">

                    <div className="flex items-center gap-4">

                        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">

                            <Users size={25} />

                        </div>

                        <div>

                            <p className="text-sm text-slate-500">

                                Capacity

                            </p>

                            <h2 className="mt-1 text-2xl font-bold text-slate-900">

                                {resource.capacity}

                            </h2>

                        </div>

                    </div>

                </div>


                {/* Resource Type */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5">

                    <div className="flex items-center gap-4">

                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">

                            <Layers size={25} />

                        </div>

                        <div>

                            <p className="text-sm text-slate-500">

                                Resource Type

                            </p>

                            <h2 className="mt-1 text-xl font-bold text-slate-900">

                                {resourceTypeLabels[resource.type]}

                            </h2>

                        </div>

                    </div>

                </div>


                {/* Resource Status */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5">

                    <div className="flex items-center gap-4">

                        <div
                            className={`rounded-xl p-3 ${
                                resource.isActive
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-slate-100 text-slate-500"
                            }`}
                        >

                            <CircleCheck size={25} />

                        </div>

                        <div>

                            <p className="text-sm text-slate-500">

                                Resource Status

                            </p>

                            <h2 className="mt-1 text-xl font-bold text-slate-900">

                                {resource.isActive
                                    ? "Active"
                                    : "Inactive"}

                            </h2>

                        </div>

                    </div>

                </div>

            </div>


            {/* Resource Description */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6">

                <div className="flex items-center gap-3">

                    <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">

                        <FileText size={22} />

                    </div>

                    <h2 className="text-lg font-semibold text-slate-900">

                        Resource Description

                    </h2>

                </div>

                <p className="mt-5 whitespace-pre-wrap wrap-break-words text-sm leading-relaxed text-slate-600">

                    {resource.description ||
                        "No description has been provided for this resource."}

                </p>

            </section>


            {/* Resource Availability */}

<section className="rounded-2xl border border-slate-200 bg-white p-6">

    <div className="flex items-center gap-3">

        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">

            <CalendarDays size={24} />

        </div>

        <div>

            <h2 className="text-lg font-semibold text-slate-900">

                Resource Availability

            </h2>

            <p className="mt-1 text-sm text-slate-500">

                View occupied time slots and schedule
                a resource booking.

            </p>

        </div>

    </div>

    {resource.isActive ? (

        <div className="mt-6">

            <ResourceAvailability

                key={resource._id}

                resourceId={resource._id}

                refreshTrigger={availabilityRefreshKey}

                onSelectSlot={
                    user
                        ? handleSlotSelected
                        : undefined
                }

            />

        </div>

    ) : (

        <div className="mt-6 rounded-xl bg-slate-50 p-6 text-center">

            <p className="text-sm text-slate-500">

                Availability is not displayed for
                inactive resources.

            </p>

        </div>

    )}

</section>

            {/* Edit Resource Modal — Admin Only */}

            {isAdmin && isModalOpen && (

                <ResourceFormModal
                    key={resource._id}
                    resource={resource}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleResourceUpdated}
                />

            )}
            {/* Booking Form Modal */}

            {selectedBookingSlot && resource.isActive && user && (
            
                <BookingFormModal
            
                    key={`${resource._id}-${selectedBookingSlot.startTime}`}

                    resource={resource}
            
                    slot={selectedBookingSlot}
            
                    onClose={handleBookingModalClose}
            
                    onSuccess={handleBookingSuccess}
            
                />
            
            )}            

        </div>

    );

}