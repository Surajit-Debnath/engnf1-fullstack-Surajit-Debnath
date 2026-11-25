import {
    Search,
    SlidersHorizontal,
    RotateCcw
} from "lucide-react";

import { Button } from "../ui/Button";

import {
    resourceTypes,
    resourceTypeLabels
} from "../../types/resource";

import type {
    ResourceFilters as ResourceFilterValues,
    ResourceType
} from "../../types/resource";

interface ResourceFiltersProps {
    filters: ResourceFilterValues;
    onChange: (filters: ResourceFilterValues) => void;
    onReset: () => void;
}

const inputStyles = `
    w-full rounded-xl border border-slate-300
    bg-white px-4 py-3 text-sm text-slate-700
    outline-none transition
    focus:border-indigo-600
    focus:ring-4 focus:ring-indigo-100
`;

export default function ResourceFilters({
    filters,
    onChange,
    onReset
}: ResourceFiltersProps) {

    const hasFilters =
        filters.search.trim() !== "" ||
        filters.type !== "" ||
        filters.minCapacity !== "";

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">

            {/* Filter Header */}

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

                <div className="flex items-center gap-2">

                    <SlidersHorizontal
                        size={20}
                        className="text-indigo-600"
                    />

                    <h2 className="font-semibold text-slate-800">
                        Filter Resources
                    </h2>

                </div>

                <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    text="Reset Filters"
                    startIcon={<RotateCcw size={15} />}
                    disabled={!hasFilters}
                    onClick={onReset}
                />

            </div>

            {/* Filter Fields */}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

                {/* Search */}

                <div className="md:col-span-2">

                    <label
                        htmlFor="resource-search"
                        className="mb-2 block text-sm font-medium text-slate-700"
                    >
                        Search Resources
                    </label>

                    <div className="relative">

                        <Search
                            size={19}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            id="resource-search"
                            type="text"
                            placeholder="Search by resource name..."
                            value={filters.search}
                            onChange={event =>
                                onChange({
                                    ...filters,
                                    search: event.target.value
                                })
                            }
                            className={`${inputStyles} pl-10`}
                        />

                    </div>

                </div>

                {/* Resource Type */}

                <div>

                    <label
                        htmlFor="resource-type"
                        className="mb-2 block text-sm font-medium text-slate-700"
                    >
                        Resource Type
                    </label>

                    <select
                        id="resource-type"
                        value={filters.type}
                        onChange={event =>
                            onChange({
                                ...filters,
                                type: event.target.value as ResourceType | ""
                            })
                        }
                        className={inputStyles}
                    >

                        <option value="">All Types</option>

                        {resourceTypes.map(type => (
                            <option key={type} value={type}>
                                {resourceTypeLabels[type]}
                            </option>
                        ))}

                    </select>

                </div>

                {/* Minimum Capacity */}

                <div>

                    <label
                        htmlFor="resource-capacity"
                        className="mb-2 block text-sm font-medium text-slate-700"
                    >
                        Minimum Capacity
                    </label>

                    <input
                        id="resource-capacity"
                        type="number"
                        min={1}
                        max={500}
                        step={1}
                        placeholder="Any capacity"
                        value={filters.minCapacity}
                        onChange={event => {

                            const value = event.target.value;

                            if (value === "") {
                                onChange({
                                    ...filters,
                                    minCapacity: ""
                                });

                                return;
                            }

                            const capacity = Number(value);

                            if (
                                Number.isInteger(capacity) &&
                                capacity >= 1 &&
                                capacity <= 500
                            ) {
                                onChange({
                                    ...filters,
                                    minCapacity: capacity
                                });
                            }
                        }}
                        className={inputStyles}
                    />

                </div>

            </div>

        </section>
    );
}