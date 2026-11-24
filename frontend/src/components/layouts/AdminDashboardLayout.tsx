import { useState } from 'react';

import { Outlet, useOutletContext } from 'react-router-dom';

import AdminSidebar from '../dashboard/AdminSidebar';
import DashboardNavbar from '../dashboard/DashboardNavbar';

import type { DashboardContext } from './DashboardLayout';

export default function AdminDashboardLayout() {
  const { user } = useOutletContext<DashboardContext>();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar
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
