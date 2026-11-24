import { Search, RotateCcw } from 'lucide-react';

import {
  categories,
  priorities,
  statuses,
  formatLabel,
} from '../../types/ticket';

import type { TicketFilters as Filters } from '../../types/ticket';

interface TicketFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onReset: () => void;
}

const selectStyles = `
    w-full rounded-xl border border-slate-300
    bg-white px-4 py-3 text-sm text-slate-700
    outline-none transition
    focus:border-indigo-600 focus:ring-4
    focus:ring-indigo-100
`;

export default function TicketFilters({
  filters,
  onChange,
  onReset,
}: TicketFiltersProps) {
  return (
    <div className="space-y-4 border-b border-slate-200 p-5">
      {/* Search */}

      <div className="relative">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          aria-label="Search tickets"
          placeholder="Search ticket subject or body..."
          value={filters.q}
          maxLength={200}
          onChange={(event) =>
            onChange({
              ...filters,
              q: event.target.value,
            })
          }
          className="w-full rounded-xl border border-slate-300 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
        />
      </div>

      {/* Dropdown Filters */}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <select
          aria-label="Filter by category"
          className={selectStyles}
          value={filters.category}
          onChange={(event) =>
            onChange({
              ...filters,
              category: event.target.value as Filters['category'],
            })
          }
        >
          <option value="">All Categories</option>

          {categories.map((category) => (
            <option key={category} value={category}>
              {formatLabel(category)}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by priority"
          className={selectStyles}
          value={filters.priority}
          onChange={(event) =>
            onChange({
              ...filters,
              priority: event.target.value as Filters['priority'],
            })
          }
        >
          <option value="">All Priorities</option>

          {priorities.map((priority) => (
            <option key={priority} value={priority}>
              {formatLabel(priority)}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by status"
          className={selectStyles}
          value={filters.status}
          onChange={(event) =>
            onChange({
              ...filters,
              status: event.target.value as Filters['status'],
            })
          }
        >
          <option value="">All Statuses</option>

          {statuses.map((status) => (
            <option key={status} value={status}>
              {formatLabel(status)}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          <RotateCcw size={16} />
          Reset Filters
        </button>
      </div>
    </div>
  );
}
