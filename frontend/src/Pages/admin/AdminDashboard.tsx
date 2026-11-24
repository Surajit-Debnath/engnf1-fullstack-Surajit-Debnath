import { useEffect, useState } from 'react';

import {
  Ticket,
  Server,
  Clock3,
  AlertTriangle,
  RefreshCw,
  LoaderCircle,
  AlertCircle,
  ArrowRight,
  Trophy,
  ShieldCheck,
} from 'lucide-react';

import { Link, useOutletContext } from 'react-router-dom';

import StatCard from '../../components/dashboard/StatCard';
import { Button } from '../../components/ui/Button';

import { getAdminStats } from '../../services/adminService';

import type { AdminStats } from '../../types/admin';

import type { DashboardContext } from '../../components/layouts/DashboardLayout';

import { formatLabel } from '../../types/ticket';

const bookingColors = {
  APPROVED: 'bg-emerald-500',
  PENDING: 'bg-amber-500',
  REJECTED: 'bg-red-500',
  CANCELLED: 'bg-slate-400',
};

const priorityColors = {
  URGENT: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-emerald-500',
};

export default function AdminDashboard() {
  const { user } = useOutletContext<DashboardContext>();

  const [stats, setStats] = useState<AdminStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchStats() {
      setLoading(true);
      setError('');

      try {
        const response = await getAdminStats(controller.signal);

        if (!controller.signal.aborted) {
          setStats(response);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError('Unable to load administrator statistics.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    const timer = setTimeout(fetchStats, 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [refreshKey]);

  function refreshDashboard() {
    setRefreshKey((prev) => prev + 1);
  }

  const totalTickets =
    stats?.ticketStats.byStatus.reduce(
      (total, item) => total + item.count,
      0
    ) ?? 0;

  const urgentTickets =
    stats?.ticketStats.byPriority.find((item) => item._id === 'URGENT')
      ?.count ?? 0;

  const totalBookings = Object.values(stats?.bookingsByStatus ?? {}).reduce(
    (total, count) => total + count,
    0
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <LoaderCircle size={40} className="animate-spin text-indigo-600" />

        <p className="text-sm text-slate-500">Loading admin dashboard...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <AlertCircle size={40} className="text-red-500" />

        <h2 className="text-xl font-semibold">Unable to load dashboard</h2>

        <p className="text-slate-500">{error}</p>

        <Button
          variant="primary"
          size="md"
          text="Try Again"
          onClick={refreshDashboard}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-400 space-y-8">
      {/* Header */}

      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
            <ShieldCheck size={15} />
            Administrator Workspace
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome, {user?.name.split(' ')[0] || 'Admin'}!
          </h1>

          <p className="mt-2 text-slate-500">
            Monitor and manage your entire support system.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          text="Refresh"
          startIcon={<RefreshCw size={18} />}
          onClick={refreshDashboard}
        />
      </section>

      {/* Statistics */}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Tickets"
          value={totalTickets}
          icon={Ticket}
          color="indigo"
          description="All support requests"
        />

        <StatCard
          title="Active Resources"
          value={stats.activeResources}
          icon={Server}
          color="blue"
          description="Active shared resources"
        />

        <StatCard
          title="Pending Bookings"
          value={stats.bookingsByStatus.PENDING ?? 0}
          icon={Clock3}
          color="amber"
          description="Awaiting admin approval"
        />

        <StatCard
          title="Urgent Tickets"
          value={urgentTickets}
          icon={AlertTriangle}
          color="red"
          description="Require immediate attention"
        />
      </section>

      {/* Analytics */}

      <section className="grid gap-6 xl:grid-cols-2">
        {/* Booking Status */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Booking Distribution
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {totalBookings} total resource bookings
          </p>

          <div className="mt-8 space-y-6">
            {Object.entries(bookingColors).map(([status, color]) => {
              const count =
                stats.bookingsByStatus[status as keyof typeof bookingColors] ??
                0;

              return (
                <div key={status}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-slate-600">
                      {formatLabel(status)}
                    </span>

                    <span className="font-semibold">{count}</span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{
                        width: `${
                          totalBookings ? (count / totalBookings) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ticket Priority */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Ticket Priority Distribution
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Monitor support ticket urgency
          </p>

          <div className="mt-8 space-y-6">
            {Object.entries(priorityColors).map(([priority, color]) => {
              const count =
                stats.ticketStats.byPriority.find(
                  (item) => item._id === priority
                )?.count ?? 0;

              return (
                <div key={priority}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-slate-600">
                      {formatLabel(priority)}
                    </span>

                    <span className="font-semibold">{count}</span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${color}`}
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
        </div>
      </section>

      {/* Top Resources */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <Trophy size={24} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Most Booked Resources
              </h2>

              <p className="text-sm text-slate-500">
                Top three resources by booking count
              </p>
            </div>
          </div>

          <Link
            to="/admin/dashboard/resources"
            className="flex items-center gap-2 text-sm font-semibold text-indigo-600"
          >
            Manage Resources
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          {stats.topResources.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No resource bookings available.
            </p>
          ) : (
            stats.topResources.map((resource, index) => (
              <div
                key={resource.resourceId}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600">
                    #{index + 1}
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {resource.name}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatLabel(resource.type)}
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                  {resource.bookingCount} bookings
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Quick Actions */}

      <section className="grid gap-5 md:grid-cols-2">
        <Link
          to="/admin/dashboard/resources"
          className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-indigo-300 hover:shadow-md"
        >
          <Server size={28} className="mb-4 text-indigo-600" />

          <h3 className="font-bold text-slate-900">Manage Resources</h3>

          <p className="mt-2 text-sm text-slate-500">
            Create, configure and manage rooms, laboratories and diagnostic
            equipment.
          </p>

          <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-indigo-600">
            Open Resource Management
            <ArrowRight
              size={16}
              className="transition group-hover:translate-x-1"
            />
          </div>
        </Link>

        <Link
          to="/admin/dashboard/bookings"
          className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-indigo-300 hover:shadow-md"
        >
          <Clock3 size={28} className="mb-4 text-amber-600" />

          <h3 className="font-bold text-slate-900">Manage Booking Requests</h3>

          <p className="mt-2 text-sm text-slate-500">
            Review, approve and reject resource reservation requests.
          </p>

          <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-indigo-600">
            Review Bookings
            <ArrowRight
              size={16}
              className="transition group-hover:translate-x-1"
            />
          </div>
        </Link>
      </section>
    </div>
  );
}
