import { api } from './api';

import type { AdminStats } from '../types/admin';

export async function getAdminStats(signal?: AbortSignal) {
  const response = await api.get<AdminStats>('/admin/stats', { signal });

  return response.data;
}
