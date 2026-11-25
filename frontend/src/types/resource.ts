import type { BookingStatus } from "./dashboard";

export type ResourceType =
    | "ROOM"
    | "LAB"
    | "EQUIPMENT";

export interface Resource {
    _id: string;
    name: string;
    type: ResourceType;
    capacity: number;
    description: string | null;
    isActive: boolean;
    createdAt: string;
}

// Resource filters

export interface ResourceFilters {
    search: string;
    type: ResourceType | "";
    minCapacity: number | "";
}

export interface ResourceQuery extends ResourceFilters {
    page: number;
}

// GET resources response

export interface ResourceListResponse {
    data: Resource[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

// GET resource details response

export interface ResourceDetailsResponse {
    resource: Resource;
}

// POST resource payload

export interface CreateResourcePayload {
    name: string;
    type: ResourceType;
    capacity: number;
    description?: string | null;
}

// PATCH resource payload

export type UpdateResourcePayload =
    Partial<CreateResourcePayload>;

// Resource mutation response

export interface ResourceMutationResponse {
    resource: Resource;
}

// Availability query

export interface AvailabilityQuery {
    from: string;
    to: string;
}

// Occupied time slots

export interface ResourceBookingSlot {
    startTime: string;
    endTime: string;
    status: Extract<
        BookingStatus,
        "PENDING" | "APPROVED"
    >;
}

// GET availability response

export interface ResourceAvailabilityResponse {
    resourceId: string;
    from: string;
    to: string;
    bookings: ResourceBookingSlot[];
}

// Resource type options

export const resourceTypes: ResourceType[] = [
    "ROOM",
    "LAB",
    "EQUIPMENT"
];

export const resourceTypeLabels: Record<ResourceType, string> = {
    ROOM: "Room",
    LAB: "Lab",
    EQUIPMENT: "Equipment"
};