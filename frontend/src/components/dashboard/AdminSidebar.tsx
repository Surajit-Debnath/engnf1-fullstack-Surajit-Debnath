import {
  Layers3,
  LayoutDashboard,
  Ticket,
  ListFilter,
  Server,
  CalendarCheck,
  LogOut,
  X,
  ShieldCheck,
} from 'lucide-react';

import { NavLink, useNavigate } from 'react-router-dom';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  {
    name: 'Overview',
    path: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'All Tickets',
    path: '/admin/dashboard/tickets',
    icon: Ticket,
  },
  {
    name: 'Triage Queue',
    path: '/admin/dashboard/triage',
    icon: ListFilter,
  },
  {
    name: 'Manage Resources',
    path: '/admin/dashboard/resources',
    icon: Server,
  },
  {
    name: 'Manage Bookings',
    path: '/admin/dashboard/bookings',
    icon: CalendarCheck,
  },
];

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  }

  return (
    <>
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
                    text-white transition-transform
                    duration-300 lg:translate-x-0
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
      >
        {/* Branding */}

        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-600 p-2">
              <Layers3 size={24} />
            </div>

            <span className="text-xl font-bold">TriageSync</span>
          </div>

          <button
            aria-label="Close sidebar"
            onClick={onClose}
            className="lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Admin Identity */}

        <div className="mx-4 mt-6 flex items-center gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3">
          <ShieldCheck size={24} className="text-indigo-400" />

          <div>
            <p className="text-sm font-semibold text-indigo-300">
              Administrator
            </p>

            <p className="text-xs text-slate-400">Management Console</p>
          </div>
        </div>

        {/* Navigation */}

        <nav className="flex-1 overflow-y-auto px-4 py-8">
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Administration
          </p>

          <div className="space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin/dashboard'}
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
                <item.icon size={20} />

                {item.name}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Logout */}

        <div className="border-t border-slate-800 p-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
