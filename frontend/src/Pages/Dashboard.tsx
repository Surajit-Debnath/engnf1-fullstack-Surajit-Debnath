import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';

import {
  Ticket as TicketIcon,
  Clock3,
  CircleCheck,
  AlertCircle,
  BrainCircuit,
  CalendarClock,
  ArrowRight,
  RefreshCw,
  LoaderCircle
} from 'lucide-react';

import StatCard from '../components/dashboard/StatCard';
import { Button } from '../components/ui/Button';

import { api } from '../services/api';

import type {
  Ticket,
  TicketStats,
  TicketResponse,
  Booking,
  BookingResponse,
} from '../types/dashboard';

import type { DashboardContext } from '../components/layouts/DashboardLayout';

// Priority badge styles
const priorityStyles = {
  LOW: 'bg-emerald-50 text-emerald-700',
  MEDIUM: 'bg-amber-50 text-amber-700',
  HIGH: 'bg-orange-50 text-orange-700',
  URGENT: 'bg-red-50 text-red-700',
};

// Priority chart colors
const priorityColors = {
  LOW: 'bg-emerald-500',
  MEDIUM: 'bg-amber-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500',
};

// Ticket status styles
const statusStyles = {
  OPEN: 'bg-blue-50 text-blue-700',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-700',
  RESOLVED: 'bg-emerald-50 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-600',
};

// Format enum values for display
function formatLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Dashboard() {
  const { user } = useOutletContext<DashboardContext>();

  // Dashboard data
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Current time state — fixes React purity error
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // ==========================================
  // UPDATE CURRENT TIME
  // ==========================================

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // FETCH DASHBOARD DATA
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();

    async function fetchDashboard() {
      setLoading(true);
      setError('');

      try {
        const [statsResponse, ticketsResponse, bookingsResponse] =
          await Promise.all([
            api.get<TicketStats>('/stats', {
              signal: controller.signal,
            }),

            api.get<TicketResponse>('/tickets', {
              params: {
                page: 1,
                limit: 5,
              },
              signal: controller.signal,
            }),

            api.get<BookingResponse>('/bookings/mine', {
              params: {
                page: 1,
              },
              signal: controller.signal,
            }),
          ]);

        if (controller.signal.aborted) return;

        setStats(statsResponse.data);
        setTickets(ticketsResponse.data.tickets ?? []);
        setBookings(bookingsResponse.data.bookings ?? []);

        setCurrentTime(Date.now());
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Dashboard error:', err);

          setError('Unable to load dashboard data. Please try again.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => controller.abort();
  }, [refreshKey]);

  // ==========================================
  // DERIVED STATISTICS
  // ==========================================

  const totalTickets = Object.values(stats?.byStatus ?? {}).reduce(
    (total, count) => total + count,
    0
  );

  const pendingReview = Math.max(0, totalTickets - (stats?.reviewedCount ?? 0));

  const resolvedTickets = stats?.byStatus?.RESOLVED ?? 0;

  const urgentTickets = stats?.byPriority?.URGENT ?? 0;

  const agreementRate = Math.min(
    100,
    Math.max(0, stats?.modelAgreementRate ?? 0)
  );

  // ==========================================
  // UPCOMING BOOKINGS — FIXED
  // ==========================================

  const upcomingBookings = bookings
    .filter(
      (booking) =>
        booking.status === 'APPROVED' &&
        new Date(booking.startTime).getTime() > currentTime
    )
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
    .slice(0, 3);

  // ==========================================
  // REFRESH HANDLER
  // ==========================================

  function refreshDashboard() {
    setCurrentTime(Date.now());
    setRefreshKey((prev) => prev + 1);
  }

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <LoaderCircle size={40} className="animate-spin text-indigo-600" />

        <p className="text-sm text-slate-500">Loading your dashboard...</p>
      </div>
    );
  }

  // ==========================================
  // ERROR STATE
  // ==========================================

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5">
        <div className="rounded-full bg-red-50 p-5">
          <AlertCircle size={40} className="text-red-500" />
        </div>

        <h2 className="text-xl font-semibold text-slate-900">
          Something went wrong
        </h2>

        <p className="text-center text-slate-600">{error}</p>

        <Button
          variant="primary"
          size="md"
          text="Try Again"
          startIcon={<RefreshCw size={18} />}
          onClick={refreshDashboard}
        />
      </div>
    );
  }

  // ==========================================
  // DASHBOARD UI
  // ==========================================

  return (
    <div className="mx-auto max-w-400 space-y-8">
      {/* Welcome Section */}

      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome back
            {user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
          </h1>

          <p className="mt-2 text-slate-500">
            Here's what's happening in your support workspace.
          </p>
        </div>

      </section>

      {/* Statistics Cards */}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Tickets"
          value={totalTickets}
          icon={TicketIcon}
          color="indigo"
          description="All support tickets"
        />

        <StatCard
          title="Pending Review"
          value={pendingReview}
          icon={Clock3}
          color="amber"
          description="Awaiting human review"
        />

        <StatCard
          title="Resolved Tickets"
          value={resolvedTickets}
          icon={CircleCheck}
          color="green"
          description="Currently marked resolved"
        />

        <StatCard
          title="Urgent Tickets"
          value={urgentTickets}
          icon={AlertCircle}
          color="red"
          description="All tickets with urgent priority"
        />
      </section>

      {/* Distribution Charts */}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Category Distribution */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Tickets by Category
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Distribution of support requests
          </p>

          <div className="mt-8 space-y-6">
            {Object.entries(stats?.byCategory ?? {}).map(
              ([category, count]) => (
                <div key={category}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-slate-600">
                      {formatLabel(category)}
                    </span>

                    <span className="font-semibold text-slate-900">
                      {count}
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-indigo-50">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                      style={{
                        width: `${
                          totalTickets ? (count / totalTickets) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )
            )}

            {Object.keys(stats?.byCategory ?? {}).length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">
                No category data available.
              </p>
            )}
          </div>
        </section>

        {/* Priority Distribution */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Priority Distribution
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Understand the urgency of support tickets
          </p>

          <div className="mt-8 space-y-6">
            {(['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const).map((priority) => {
              const count = stats?.byPriority?.[priority] ?? 0;

              return (
                <div key={priority}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-slate-600">
                      {formatLabel(priority)}
                    </span>

                    <span className="font-semibold text-slate-900">
                      {count}
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${priorityColors[priority]}`}
                      style={{
                        width: `${
                          totalTickets ? (count / totalTickets) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Classification Performance */}

      <section className="rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-50 to-white p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-indigo-600 p-3 text-white">
            <BrainCircuit size={28} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Classification Performance
            </h2>

            <p className="text-sm text-slate-500">
              Agreement between automated and reviewed categories
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Model Agreement Rate</p>

            <h3 className="mt-2 text-4xl font-bold text-indigo-600">
              {stats?.reviewedCount ? `${agreementRate.toFixed(1)}%` : 'N/A'}
            </h3>
          </div>

          <div>
            <p className="text-sm text-slate-500">Reviewed Tickets</p>

            <h3 className="mt-2 text-4xl font-bold text-slate-900">
              {stats?.reviewedCount ?? 0}
            </h3>
          </div>
        </div>

        <div className="mt-6 h-3 overflow-hidden rounded-full bg-indigo-100">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-500"
            style={{
              width: `${stats?.reviewedCount ? agreementRate : 0}%`,
            }}
          />
        </div>
      </section>

      {/* Recent Tickets */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Tickets
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Latest incoming support requests
            </p>
          </div>

          <Link
            to="/dashboard/tickets"
            className="flex shrink-0 items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View All
            <ArrowRight size={16} />
          </Link>
        </div>

        {tickets.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-slate-400">
            <TicketIcon size={36} />

            <p>No tickets available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">Ticket ID</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket._id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-6 py-5 font-medium text-indigo-600">
                      {ticket.externalId}
                    </td>

                    <td className="min-w-55 px-6 py-5 font-medium text-slate-800">
                      {ticket.subject}
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-slate-600">
                      {formatLabel(ticket.category)}
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityStyles[ticket.priority]}`}
                      >
                        {formatLabel(ticket.priority)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[ticket.status]}`}
                      >
                        {formatLabel(ticket.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Upcoming Bookings */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Upcoming Bookings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your upcoming approved reservations
            </p>
          </div>

          <Link
            to="/dashboard/bookings"
            className="flex shrink-0 items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View All
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          {upcomingBookings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center">
              <CalendarClock
                size={36}
                className="mx-auto mb-3 text-slate-400"
              />

              <p className="text-sm text-slate-500">
                No upcoming reservations in your recent bookings.
              </p>

              <Link
                to="/dashboard/resources"
                className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:underline"
              >
                Browse Resources
              </Link>
            </div>
          ) : (
            upcomingBookings.map((booking) => (
              <div
                key={booking._id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                    <CalendarClock size={24} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {booking.purpose}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(booking.startTime).toLocaleString()}
                      {' – '}
                      {new Date(booking.endTime).toLocaleString()}
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  Approved
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
