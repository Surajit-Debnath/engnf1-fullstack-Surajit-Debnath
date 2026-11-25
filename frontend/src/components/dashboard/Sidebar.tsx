import { Link, NavLink, useNavigate } from 'react-router-dom';

import {
  Layers3,
  LayoutDashboard,
  Ticket,
  ListFilter,
  CalendarDays,
  Boxes,
  CalendarCheck,
  Settings,
  LogOut,
  X,
} from 'lucide-react';

import type { Role } from '../../types/dashboard';

interface SidebarProps {
  role?: Role;
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  {
    name: 'Overview',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Tickets',
    path: '/dashboard/tickets',
    icon: Ticket,
  },
  {
    name: 'Triage Queue',
    path: '/dashboard/triage',
    icon: ListFilter,
  },
  {
    name: 'My Bookings',
    path: '/dashboard/bookings',
    icon: CalendarDays,
  },
  {
    name: 'Resources',
    path: '/dashboard/resources',
    icon: Boxes,
  },
];

const adminNavigation = [
  {
    name: 'Manage Resources',
    path: '/dashboard/admin/resources',
    icon: Settings,
  },
  {
    name: 'Manage Bookings',
    path: '/dashboard/admin/bookings',
    icon: CalendarCheck,
  },
];

export default function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      <aside
        className={`
                    fixed inset-y-0 left-0 z-50
                    flex w-64 flex-col bg-slate-950
                    text-white transition-transform duration-300
                    lg:translate-x-0
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-6">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-600 p-2.5">
              <Layers3 size={24} />
            </div>

            <span className="text-xl font-bold">
              Triage<span className="text-indigo-400">Sync</span>
            </span>
          </Link>

          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="text-slate-400 lg:hidden"
          >
            <X size={22} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-4 px-3 text-xs font-semibold tracking-widest text-slate-500">
            WORKSPACE
          </p>

          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  onClick={onClose}
                  className={({ isActive }) => `
                                        flex items-center gap-3
                                        rounded-xl px-4 py-3
                                        text-sm font-medium transition-colors
                                        ${
                                          isActive
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                        }
                                    `}
                >
                  <Icon size={20} />
                  {item.name}
                </NavLink>
              );
            })}
          </div>

          {/* Admin Navigation */}
          {role === 'ADMIN' && (
            <div className="mt-10">
              <p className="mb-4 px-3 text-xs font-semibold tracking-widest text-slate-500">
                ADMINISTRATION
              </p>

              <div className="space-y-2">
                {adminNavigation.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) => `
                                                flex items-center gap-3
                                                rounded-xl px-4 py-3
                                                text-sm font-medium transition
                                                ${
                                                  isActive
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                                }
                                            `}
                    >
                      <Icon size={20} />
                      {item.name}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Logout */}
        <div className="border-t border-slate-800 p-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
