import { api } from './api';

import type { TicketResponse } from '../types/dashboard';

import type {
  TicketQuery,
  ImportTicket,
  ImportTicketResponse,
  TicketDetailsResponse,
    UpdateTicketPayload,
    UpdateTicketResponse
} from '../types/ticket';

export async function getTickets(query: TicketQuery, signal?: AbortSignal) {
  const response = await api.get<TicketResponse>('/tickets', {
    params: {
      q: query.q.trim() || undefined,
      category: query.category || undefined,
      priority: query.priority || undefined,
      status: query.status || undefined,
      page: query.page,
      limit: query.limit,
    },
    signal,
  });

  return response.data;
}

export async function importTickets(tickets: ImportTicket[]) {
  const response = await api.post<ImportTicketResponse>('/tickets/import', {
    tickets,
  });

  return response.data;
}


export async function getTicketDetails(
    id: string,
    signal?: AbortSignal
) {
    const response = await api.get<TicketDetailsResponse>(
        `/tickets/${id}`,
        { signal }
    );

    return response.data;
}

export async function updateTicket(
    id: string,
    updates: UpdateTicketPayload,
    actor: string
) {
    const response = await api.patch<UpdateTicketResponse>(
        `/tickets/${id}`,
        updates,
        {
            headers: {
                "X-Agent": actor
            }
        }
    );

    return response.data;
}