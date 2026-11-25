import {
    DoorOpen,
    Monitor,
    Wrench,
    Users,
    CalendarDays,
    Pencil,
    ArrowRight
} from "lucide-react";

import { Button } from "../ui/Button";

import {
    resourceTypeLabels
} from "../../types/resource";

import type {
    Resource,
    ResourceType
} from "../../types/resource";

interface ResourceCardProps {
    resource: Resource;
    onView: (resource: Resource) => void;
    onEdit?: (resource: Resource) => void;
}

const resourceIcons = {
    ROOM: DoorOpen,
    LAB: Monitor,
    EQUIPMENT: Wrench
};

const resourceColors: Record<ResourceType, string> = {
    ROOM: "bg-blue-50 text-blue-600",
    LAB: "bg-indigo-50 text-indigo-600",
    EQUIPMENT: "bg-amber-50 text-amber-600"
};

export default function ResourceCard({
    resource,
    onView,
    onEdit
}: ResourceCardProps) {

    const ResourceIcon = resourceIcons[resource.type];

    return (
        <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 transition duration-200 hover:border-indigo-200 hover:shadow-md">

            {/* Resource Icon and Status */}

            <div className="flex items-start justify-between">

                <div
                    className={`rounded-xl p-3 ${resourceColors[resource.type]}`}
                >
                    <ResourceIcon size={28} />
                </div>

                <span
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
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

                    {resource.isActive ? "Active" : "Inactive"}
                </span>

            </div>

            {/* Resource Information */}

            <div className="mt-5">

                <h3 className="wrap-break-words text-lg font-semibold text-slate-900">
                    {resource.name}
                </h3>

                <p className="mt-1 text-sm font-medium text-indigo-600">
                    {resourceTypeLabels[resource.type]}
                </p>

            </div>

            {/* Capacity */}

            <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">

                <Users size={18} className="text-slate-400" />

                <span>
                    Capacity:{" "}
                    <span className="font-semibold text-slate-800">
                        {resource.capacity}
                    </span>
                </span>

            </div>

            {/* Description */}

            <p className="mt-4 line-clamp-3 flex-1 wrap-break-words text-sm leading-relaxed text-slate-500">
                {resource.description || "No description provided."}
            </p>

            {/* Created Date */}

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">

                <CalendarDays size={15} />

                <span>
                    Added{" "}
                    {new Date(resource.createdAt).toLocaleDateString(
                        "en-IN",
                        {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                        }
                    )}
                </span>

            </div>

            {/* Resource Actions */}

            <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">

                <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    text="View Details"
                    endIcon={<ArrowRight size={16} />}
                    onClick={() => onView(resource)}
                    className="flex-1"
                />

                {onEdit && (
                    <Button
                        variant="secondary"
                        size="sm"
                        type="button"
                        text="Edit"
                        startIcon={<Pencil size={15} />}
                        onClick={() => onEdit(resource)}
                    />
                )}

            </div>

        </article>
    );
}