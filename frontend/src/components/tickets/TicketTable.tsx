import { ArrowUpRight, Ticket as TicketIcon, ShieldCheck } from 'lucide-react';

import { Link } from 'react-router-dom';

import type { Ticket } from '../../types/dashboard';

import TicketBadge from './TicketBadge';

interface TicketTableProps {
  tickets: Ticket[];
}

export default function TicketTable({ tickets }: TicketTableProps) {
  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-20">
        <div className="rounded-full bg-slate-100 p-5">
          <TicketIcon size={36} className="text-slate-400" />
        </div>

        <h3 className="font-semibold text-slate-800">No tickets found</h3>

        <p className="text-center text-sm text-slate-500">
          Try changing your filters or importing new tickets.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-6 py-4">Ticket</th>
            <th className="px-6 py-4">Category</th>
            <th className="px-6 py-4">Priority</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Review</th>
            <th className="px-6 py-4">Created</th>
            <th className="px-6 py-4">Action</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {tickets.map((ticket) => (
            <tr
              key={ticket._id}
              className="transition-colors hover:bg-slate-50"
            >
              {/* Ticket Information */}

              <td className="min-w-65 px-6 py-5">
                <p className="mb-1 text-xs font-semibold text-indigo-600">
                  {ticket.externalId}
                </p>

                <p className="font-semibold text-slate-800">{ticket.subject}</p>

                <p className="mt-1 max-w-65 truncate text-xs text-slate-500">
                  {ticket.body}
                </p>
              </td>

              {/* Category */}

              <td className="px-6 py-5">
                <TicketBadge type="category" value={ticket.category} />

                {ticket.isHumanOverride && (
                  <div className="mt-2 flex items-center gap-1 whitespace-nowrap text-xs text-indigo-600">
                    <ShieldCheck size={13} />
                    Human Override
                  </div>
                )}
              </td>

              {/* Priority */}

              <td className="px-6 py-5">
                <TicketBadge type="priority" value={ticket.priority} />
              </td>

              {/* Status */}

              <td className="px-6 py-5">
                <TicketBadge type="status" value={ticket.status} />
              </td>

              {/* Review */}

              <td className="px-6 py-5">
                <TicketBadge
                  type="review"
                  value={ticket.isReviewed ? 'REVIEWED' : 'PENDING_REVIEW'}
                />
              </td>

              {/* Created Date */}

              <td className="whitespace-nowrap px-6 py-5 text-xs text-slate-500">
                {new Date(ticket.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </td>

              {/* Details */}

              <td className="px-6 py-5">
                <Link
                  to={`/dashboard/tickets/${ticket._id}`}
                  className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100"
                >
                  View
                  <ArrowUpRight size={14} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
