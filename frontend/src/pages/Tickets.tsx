import { useEffect, useState } from 'react';

import {
  Upload,
  RefreshCw,
  LoaderCircle,
  AlertCircle,
  Ticket as TicketIcon,
  Clock3,
  CircleCheck,
  AlertTriangle,
} from 'lucide-react';

import axios from 'axios';

import { Button } from '../components/ui/Button';

import StatCard from '../components/dashboard/StatCard';

import TicketFilters from '../components/tickets/TicketFilters';
import TicketTable from '../components/tickets/TicketTable';
import Pagination from '../components/tickets/Pagination';
import TicketImportModal from '../components/tickets/TicketImportModal';

import { getTickets } from '../services/ticketService';
import { api } from '../services/api';

import type { TicketResponse, TicketStats } from '../types/dashboard';

import type { TicketFilters as Filters } from '../types/ticket';

const initialFilters: Filters = {
  q: '',
  category: '',
  priority: '',
  status: '',
};

export default function Tickets() {
  // Filters and pagination

  const [filters, setFilters] = useState<Filters>(initialFilters);

  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Backend data

  const [data, setData] = useState<TicketResponse | null>(null);

  const [stats, setStats] = useState<TicketStats | null>(null);

  // UI states

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statsError, setStatsError] = useState('');

  const [showImportModal, setShowImportModal] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  // ==========================================
  // SEARCH DEBOUNCE
  // ==========================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.q);
    }, 400);

    return () => clearTimeout(timer);
  }, [filters.q]);

  // ==========================================
  // FETCH TICKETS
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getTickets(
          {
            q: debouncedSearch,
            category: filters.category,
            priority: filters.priority,
            status: filters.status,
            page,
            limit,
          },
          controller.signal
        );

        if (controller.signal.aborted) return;

        // Handle a page that no longer exists

        if (page > 1 && page > response.totalPages) {
          setPage(Math.max(1, response.totalPages));

          return;
        }

        setData(response);
      } catch (err) {
        if (controller.signal.aborted) return;

        if (axios.isAxiosError(err)) {
          const message = err.response?.data?.message;

          setError(
            typeof message === 'string' ? message : 'Unable to fetch tickets.'
          );
        } else {
          setError('Unable to fetch tickets.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    debouncedSearch,
    filters.category,
    filters.priority,
    filters.status,
    page,
    limit,
    refreshKey,
  ]);

  // ==========================================
  // FETCH GLOBAL STATISTICS
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setStatsError('');

      try {
        const response = await api.get<TicketStats>('/stats', {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setStats(response.data);
        }
      } catch {
        if (!controller.signal.aborted) {
          setStatsError('Unable to load ticket statistics.');
        }
      }
    }, 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [refreshKey]);

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  function handleFilterChange(newFilters: Filters) {
    setFilters(newFilters);
    setPage(1);
  }

  function resetFilters() {
    setFilters(initialFilters);
    setDebouncedSearch('');
    setPage(1);
  }

  function handleLimitChange(newLimit: number) {
    setLimit(newLimit);
    setPage(1);
  }

  function refreshTickets() {
    setRefreshKey((previous) => previous + 1);
  }

  function handleImportSuccess() {
    resetFilters();
    refreshTickets();
  }

  // ==========================================
  // DERIVED STATISTICS
  // ==========================================

  const totalTickets = Object.values(stats?.byStatus ?? {}).reduce(
    (total, count) => total + count,
    0
  );

  const openTickets = stats?.byStatus?.OPEN ?? 0;

  const resolvedTickets = stats?.byStatus?.RESOLVED ?? 0;

  const urgentTickets = stats?.byPriority?.URGENT ?? 0;

  // ==========================================
  // PAGE UI
  // ==========================================

  return (
    <div className="mx-auto max-w-400 space-y-8">
      {/* Page Header */}

      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Ticket Management
          </h1>

          <p className="mt-2 text-slate-500">
            Manage, search and review incoming support tickets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            text="Refresh"
            startIcon={<RefreshCw size={18} />}
            onClick={refreshTickets}
          />

          <Button
            variant="primary"
            size="md"
            text="Import Tickets"
            startIcon={<Upload size={18} />}
            onClick={() => setShowImportModal(true)}
          />
        </div>
      </section>

      {/* Statistics */}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Tickets"
          value={stats ? totalTickets : '—'}
          icon={TicketIcon}
          color="indigo"
          description="All incoming support requests"
        />

        <StatCard
          title="Open Tickets"
          value={stats ? openTickets : '—'}
          icon={Clock3}
          color="blue"
          description="Currently marked open"
        />

        <StatCard
          title="Resolved Tickets"
          value={stats ? resolvedTickets : '—'}
          icon={CircleCheck}
          color="green"
          description="Currently marked resolved"
        />

        <StatCard
          title="Urgent Tickets"
          value={stats ? urgentTickets : '—'}
          icon={AlertTriangle}
          color="red"
          description="Tickets with urgent priority"
        />
      </section>

      {statsError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          {statsError}
        </div>
      )}

      {/* Ticket Management Section */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              All Tickets
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Browse and filter your support tickets.
            </p>
          </div>

          {!loading && !error && data && (
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
              {data.total} matching tickets
            </span>
          )}
        </div>

        {/* Search and Filters */}

        <TicketFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={resetFilters}
        />

        {/* Loading State */}

        {loading ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-4">
            <LoaderCircle size={36} className="animate-spin text-indigo-600" />

            <p className="text-sm text-slate-500">Loading tickets...</p>
          </div>
        ) : error ? (
          /* Error State */

          <div className="flex min-h-80 flex-col items-center justify-center gap-4 p-6">
            <div className="rounded-full bg-red-50 p-4">
              <AlertCircle size={36} className="text-red-500" />
            </div>

            <h3 className="font-semibold text-slate-900">
              Unable to load tickets
            </h3>

            <p className="text-center text-sm text-slate-500">{error}</p>

            <Button
              variant="primary"
              size="md"
              text="Try Again"
              startIcon={<RefreshCw size={16} />}
              onClick={refreshTickets}
            />
          </div>
        ) : (
          /* Ticket Data */

          <>
            <TicketTable tickets={data?.tickets ?? []} />

            <Pagination
              page={data?.page ?? page}
              limit={data?.limit ?? limit}
              total={data?.total ?? 0}
              totalPages={data?.totalPages ?? 0}
              onPageChange={setPage}
              onLimitChange={handleLimitChange}
            />
          </>
        )}
      </section>

      {/* Import Modal */}

      {showImportModal && (
        <TicketImportModal
          onClose={() => setShowImportModal(false)}
          onSuccess={handleImportSuccess}
        />
      )}
    </div>
  );
}
