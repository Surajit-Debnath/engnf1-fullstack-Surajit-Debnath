import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export default function Pagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * limit + 1;

  const end = Math.min(page * limit, total);

  const firstPage = Math.max(1, page - 2);
  const lastPage = Math.min(totalPages, page + 2);

  const pages = Array.from(
    {
      length: Math.max(0, lastPage - firstPage + 1),
    },
    (_, index) => firstPage + index
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 p-5">
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-sm text-slate-500">
          Showing
          <span className="mx-1 font-semibold text-slate-800">
            {start}–{end}
          </span>
          of {total} tickets
        </p>

        <select
          aria-label="Tickets per page"
          value={limit}
          onChange={(event) => onLimitChange(Number(event.target.value))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none"
        >
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={18} />
        </button>

        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            aria-current={pageNumber === page ? 'page' : undefined}
            onClick={() => onPageChange(pageNumber)}
            className={`
                            h-9 min-w-9 rounded-lg px-2
                            text-sm font-semibold transition
                            ${
                              pageNumber === page
                                ? 'bg-indigo-600 text-white'
                                : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }
                        `}
          >
            {pageNumber}
          </button>
        ))}

        <button
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
