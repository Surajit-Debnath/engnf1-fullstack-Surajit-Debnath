import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import axios from "axios";

import {
    RefreshCw,
    Layers,
    CalendarDays,
    LoaderCircle,
    AlertCircle,
    PackageOpen,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

import { Button } from "../components/ui/Button";

import ResourceCard from "../components/resources/ResourceCard";
import ResourceFilters from "../components/resources/ResourceFilters";

import { getResources } from "../services/resourceService";

import type {
    Resource,
    ResourceFilters as ResourceFilterValues,
    ResourceListResponse
} from "../types/resource";


// ==========================================
// DEFAULT FILTERS
// ==========================================

const defaultFilters: ResourceFilterValues = {
    search: "",
    type: "",
    minCapacity: ""
};


// ==========================================
// RESOURCES PAGE
// ==========================================

export default function Resources() {

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

    const [refreshKey, setRefreshKey] = useState(0);


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

                const lastPage = Math.max(
                    1,
                    response.totalPages
                );

                if (page > lastPage) {

                    setPage(lastPage);
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
    // REFRESH RESOURCES
    // ==========================================

    function handleRefresh() {

        setRefreshKey(previous => previous + 1);

    }


    // ==========================================
    // VIEW RESOURCE DETAILS
    // ==========================================

    function handleViewResource(resource: Resource) {

        navigate(
            `/dashboard/resources/${resource._id}`
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

                        Resources

                    </h1>

                    <p className="mt-2 text-sm text-slate-500">

                        Browse shared resources and schedule
                        your troubleshooting sessions.

                    </p>

                </div>

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

            </div>


            {/* Welcome Banner */}

            <section className="relative overflow-hidden rounded-2xl bg-linear-to-r from-indigo-600 to-indigo-800 p-6 text-white sm:p-8">

                <div className="relative z-10 max-w-xl">

                    <div className="mb-4 inline-flex rounded-xl bg-white/15 p-3">

                        <CalendarDays size={26} />

                    </div>

                    <h2 className="text-xl font-semibold sm:text-2xl">

                        Find the right resource

                    </h2>

                    <p className="mt-3 text-sm leading-relaxed text-indigo-100">

                        Browse available rooms, laboratories
                        and diagnostic equipment for your
                        support sessions. Select a resource
                        to view its details and check its
                        booking availability.

                    </p>

                </div>

                <CalendarDays
                    size={180}
                    strokeWidth={1}
                    className="absolute -bottom-8 -right-4 hidden rotate-12 text-white/10 sm:block"
                />

            </section>


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
                                : "Active Resources"}

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

                    Browse Resources

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
                            : "No Resources Available"}

                    </h3>

                    <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">

                        {hasFilters
                            ? "Try adjusting your search or filters."
                            : "No active resources are currently listed. Please contact your administrator."}

                    </p>

                    {hasFilters && (

                        <div className="mt-5">

                            <Button
                                variant="secondary"
                                size="md"
                                text="Clear Filters"
                                onClick={handleResetFilters}
                            />

                        </div>

                    )}

                </div>

            ) : (


                /* Resource Cards */

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">

                    {resources.map(resource => (

                        <ResourceCard
                            key={resource._id}
                            resource={resource}
                            onView={handleViewResource}
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

        </div>

    );

}