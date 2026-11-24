import { useState } from 'react';

import { Outlet, useOutletContext } from 'react-router-dom';

import Sidebar from '../dashboard/Sidebar';
import DashboardNavbar from '../dashboard/DashboardNavbar';

import type { User } from '../../types/dashboard';

export interface DashboardContext {
  user: User | null;
}

export default function DashboardLayout() {
  const { user } = useOutletContext<DashboardContext>();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        role={user?.role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen lg:ml-64">
        <DashboardNavbar user={user} onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
}
