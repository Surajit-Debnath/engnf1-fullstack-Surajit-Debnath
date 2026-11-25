import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import axios from "axios";

import {
    Plus,
    RefreshCw,
    Layers,
    LoaderCircle,
    AlertCircle,
    CircleCheck,
    ChevronLeft,
    ChevronRight,
    PackageOpen,
    X
} from "lucide-react";

import { Button } from "../../components/ui/Button";

import ResourceCard from "../../components/resources/ResourceCard";
import ResourceFilters from "../../components/resources/ResourceFilters";
import ResourceFormModal from "../../components/resources/ResourceFormModal";

import { getResources } from "../../services/resourceService";

import type {
    Resource,
    ResourceFilters as ResourceFilterValues,
    ResourceListResponse
} from "../../types/resource";


// ==========================================
// DEFAULT FILTERS
// ==========================================

const defaultFilters: ResourceFilterValues = {
    search: "",
    type: "",
    minCapacity: ""
};


// ==========================================
// MANAGE RESOURCES PAGE
// ==========================================

export default function ManageResources() {

    const navigate = useNavigate();


    // ==========================================
    // PAGE STATE
    // ==========================================

    const [data, setData] =
        useState<ResourceListResponse | null>(null);

    const [filters, setFilters] =
        useState<ResourceFilterValues>({
            ...defaultFilters
        });

    const [debouncedSearch, setDebouncedSearch] =
        useState("");

    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [successMessage, setSuccessMessage] =
        useState("");

    const [refreshKey, setRefreshKey] = useState(0);


    // ==========================================
    // MODAL STATE
    // ==========================================

    const [isModalOpen, setIsModalOpen] =
        useState(false);

    const [selectedResource, setSelectedResource] =
        useState<Resource | null>(null);


    // ==========================================
    // SEARCH DEBOUNCING
    // ==========================================

    useEffect(() => {

        const timer = window.setTimeout(() => {

            setDebouncedSearch(filters.search.trim());

        }, 400);

        return () => window.clearTimeout(timer);

    }, [filters.search]);


    // ==========================================
    // FETCH RESOURCES
    // ==========================================

    useEffect(() => {

        const controller = new AbortController();

        async function fetchResources() {

            setLoading(true);
            setError("");

            try {

                const response = await getResources(
                    {
                        search: debouncedSearch,
                        type: filters.type,
                        minCapacity: filters.minCapacity,
                        page
                    },
                    controller.signal
                );

                if (controller.signal.aborted) return;

                // Handle a page that no longer exists.

                if (
                    page > 1 &&
                    page > Math.max(1, response.totalPages)
                ) {

                    setPage(
                        Math.max(1, response.totalPages)
                    );

                    return;
                }

                setData(response);

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
                            : "Unable to load resources."
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
            fetchResources,
            0
        );

        return () => {

            window.clearTimeout(timer);
            controller.abort();

        };

    }, [
        debouncedSearch,
        filters.type,
        filters.minCapacity,
        page,
        refreshKey
    ]);


    // ==========================================
    // FILTER HANDLERS
    // ==========================================

    function handleFiltersChange(
        nextFilters: ResourceFilterValues
    ) {

        setFilters(nextFilters);
        setPage(1);

    }

    function handleResetFilters() {

        setFilters({ ...defaultFilters });
        setDebouncedSearch("");
        setPage(1);

    }


    // ==========================================
    // REFRESH
    // ==========================================

    function handleRefresh() {

        setRefreshKey(previous => previous + 1);

    }


    // ==========================================
    // CREATE RESOURCE
    // ==========================================

    function handleCreateResource() {

        setSelectedResource(null);
        setSuccessMessage("");
        setIsModalOpen(true);

    }


    // ==========================================
    // EDIT RESOURCE
    // ==========================================

    function handleEditResource(resource: Resource) {

        setSelectedResource(resource);
        setSuccessMessage("");
        setIsModalOpen(true);

    }


    // ==========================================
    // CLOSE MODAL
    // ==========================================

    function handleCloseModal() {

        setIsModalOpen(false);
        setSelectedResource(null);

    }


    // ==========================================
    // RESOURCE SAVED
    // ==========================================

    function handleResourceSaved(resource: Resource) {

        const wasEditing = Boolean(selectedResource);

        setSuccessMessage(
            `Resource "${resource.name}" ${
                wasEditing ? "updated" : "created"
            } successfully.`
        );

        setIsModalOpen(false);
        setSelectedResource(null);

        if (!wasEditing) {

            setFilters({ ...defaultFilters });
            setDebouncedSearch("");
            setPage(1);

        }

        setRefreshKey(previous => previous + 1);

    }


    // ==========================================
    // VIEW RESOURCE
    // ==========================================

    function handleViewResource(resource: Resource) {

        navigate(
            `/admin/dashboard/resources/${resource._id}`
        );

    }


    // ==========================================
    // DERIVED VALUES
    // ==========================================

    const resources = data?.data ?? [];

    const total = data?.total ?? 0;

    const totalPages = data?.totalPages ?? 0;

    const pageSize = data?.pageSize ?? 10;

    const firstItem =
        total === 0
            ? 0
            : (page - 1) * pageSize + 1;

    const lastItem =
        Math.min(page * pageSize, total);

    const hasFilters =
        filters.search.trim() !== "" ||
        filters.type !== "" ||
        filters.minCapacity !== "";


    // ==========================================
    // RENDER PAGE
    // ==========================================

    return (

        <div className="space-y-6">

            {/* Page Header */}

            <div className="flex flex-wrap items-center justify-between gap-4">

                <div>

                    <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">

                        Manage Resources

                    </h1>

                    <p className="mt-2 text-sm text-slate-500">

                        Create and manage shared rooms,
                        labs and diagnostic equipment.

                    </p>

                </div>

                <div className="flex flex-wrap gap-3">

                    <Button
                        variant="secondary"
                        size="md"
                        type="button"
                        text="Refresh"
                        startIcon={
                            <RefreshCw
                                size={17}
                                className={
                                    loading ? "animate-spin" : ""
                                }
                            />
                        }
                        disabled={loading}
                        onClick={handleRefresh}
                    />

                    <Button
                        variant="primary"
                        size="md"
                        type="button"
                        text="Add Resource"
                        startIcon={<Plus size={19} />}
                        onClick={handleCreateResource}
                    />

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


            {/* Resource Summary */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5">

                <div className="flex items-center gap-4">

                    <div className="rounded-xl bg-indigo-50 p-4 text-indigo-600">

                        <Layers size={28} />

                    </div>

                    <div>

                        <p className="text-sm font-medium text-slate-500">

                            {hasFilters
                                ? "Matching Resources"
                                : "Total Resources"}

                        </p>

                        <h2 className="mt-1 text-3xl font-bold text-slate-900">

                            {loading || error ? "—" : total}

                        </h2>

                    </div>

                </div>

            </section>


            {/* Resource Filters */}

            <ResourceFilters
                filters={filters}
                onChange={handleFiltersChange}
                onReset={handleResetFilters}
            />


            {/* Resource List Header */}

            <div className="flex flex-wrap items-center justify-between gap-3">

                <h2 className="text-lg font-semibold text-slate-800">

                    All Resources

                </h2>

                {!loading && !error && (

                    <p className="text-sm text-slate-500">

                        Showing {firstItem}–{lastItem} of{" "}
                        {total} resources

                    </p>

                )}

            </div>


            {/* Loading State */}

            {loading ? (

                <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white">

                    <LoaderCircle
                        size={38}
                        className="animate-spin text-indigo-600"
                    />

                    <p className="mt-4 text-sm text-slate-500">

                        Loading resources...

                    </p>

                </div>

            ) : error ? (


                /* Error State */

                <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-red-200 bg-white p-6 text-center">

                    <div className="rounded-full bg-red-50 p-4">

                        <AlertCircle
                            size={32}
                            className="text-red-500"
                        />

                    </div>

                    <h3 className="mt-4 text-lg font-semibold text-slate-900">

                        Unable to Load Resources

                    </h3>

                    <p className="mt-2 max-w-md text-sm text-slate-500">

                        {error}

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

            ) : resources.length === 0 ? (


                /* Empty State */

                <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">

                    <div className="rounded-full bg-indigo-50 p-5">

                        <PackageOpen
                            size={38}
                            className="text-indigo-500"
                        />

                    </div>

                    <h3 className="mt-5 text-lg font-semibold text-slate-900">

                        {hasFilters
                            ? "No Matching Resources"
                            : "No Resources Yet"}

                    </h3>

                    <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">

                        {hasFilters
                            ? "Try adjusting your filters to find more resources."
                            : "Create your first resource to allow support agents to schedule troubleshooting sessions."}

                    </p>

                    <div className="mt-5">

                        {hasFilters ? (

                            <Button
                                variant="secondary"
                                size="md"
                                text="Clear Filters"
                                onClick={handleResetFilters}
                            />

                        ) : (

                            <Button
                                variant="primary"
                                size="md"
                                text="Add Resource"
                                startIcon={<Plus size={18} />}
                                onClick={handleCreateResource}
                            />

                        )}

                    </div>

                </div>

            ) : (


                /* Resource Cards */

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">

                    {resources.map(resource => (

                        <ResourceCard
                            key={resource._id}
                            resource={resource}
                            onView={handleViewResource}
                            onEdit={handleEditResource}
                        />

                    ))}

                </div>

            )}


            {/* Pagination */}

            {!loading &&
                !error &&
                totalPages > 1 && (

                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">

                    <p className="text-sm text-slate-500">

                        Page{" "}

                        <span className="font-semibold text-slate-800">

                            {page}

                        </span>

                        {" "}of {totalPages}

                    </p>

                    <div className="flex items-center gap-3">

                        <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            text="Previous"
                            startIcon={<ChevronLeft size={16} />}
                            disabled={page <= 1}
                            onClick={() =>
                                setPage(previous =>
                                    Math.max(1, previous - 1)
                                )
                            }
                        />

                        <span className="rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600">

                            {page}

                        </span>

                        <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            text="Next"
                            endIcon={<ChevronRight size={16} />}
                            disabled={page >= totalPages}
                            onClick={() =>
                                setPage(previous =>
                                    Math.min(
                                        totalPages,
                                        previous + 1
                                    )
                                )
                            }
                        />

                    </div>

                </div>

            )}


            {/* Create / Edit Resource Modal */}

            {isModalOpen && (

                <ResourceFormModal
                    key={selectedResource?._id ?? "create"}
                    resource={selectedResource}
                    onClose={handleCloseModal}
                    onSuccess={handleResourceSaved}
                />

            )}

        </div>

    );

}