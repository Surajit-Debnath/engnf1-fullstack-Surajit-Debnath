import { api } from "./api";

import type {
    ResourceQuery,
    ResourceListResponse,
    ResourceDetailsResponse,
    CreateResourcePayload,
    UpdateResourcePayload,
    ResourceMutationResponse,
    AvailabilityQuery,
    ResourceAvailabilityResponse
} from "../types/resource";

// ==========================================
// GET ALL RESOURCES
// ==========================================

export async function getResources(
    query: ResourceQuery,
    signal?: AbortSignal
): Promise<ResourceListResponse> {

    const response = await api.get<ResourceListResponse>(
        "/resources",
        {
            params: {
                search: query.search.trim() || undefined,
                type: query.type || undefined,
                minCapacity: query.minCapacity || undefined,
                page: query.page
            },
            signal
        }
    );

    return response.data;
}


// ==========================================
// GET RESOURCE DETAILS
// ==========================================

export async function getResourceDetails(
    id: string,
    signal?: AbortSignal
): Promise<ResourceDetailsResponse> {

    const response = await api.get<ResourceDetailsResponse>(
        `/resources/${id}`,
        { signal }
    );

    return response.data;
}


// ==========================================
// CREATE RESOURCE — ADMIN ONLY
// ==========================================

export async function createResource(
    payload: CreateResourcePayload
): Promise<ResourceMutationResponse> {

    const response = await api.post<ResourceMutationResponse>(
        "/resources",
        payload
    );

    return response.data;
}


// ==========================================
// UPDATE RESOURCE — ADMIN ONLY
// ==========================================

export async function updateResource(
    id: string,
    payload: UpdateResourcePayload
): Promise<ResourceMutationResponse> {

    const response = await api.patch<ResourceMutationResponse>(
        `/resources/${id}`,
        payload
    );

    return response.data;
}


// ==========================================
// GET RESOURCE AVAILABILITY
// ==========================================

export async function getResourceAvailability(
    id: string,
    query: AvailabilityQuery,
    signal?: AbortSignal
): Promise<ResourceAvailabilityResponse> {

    const response =
        await api.get<ResourceAvailabilityResponse>(
            `/resources/${id}/availability`,
            {
                params: {
                    from: query.from,
                    to: query.to
                },
                signal
            }
        );

    return response.data;
}