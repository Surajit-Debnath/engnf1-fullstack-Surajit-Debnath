import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import AdminDashboard from './pages/admin/AdminDashboard';
import DashboardLayout from './components/layouts/DashboardLayout';
import AdminDashboardLayout from './components/layouts/AdminDashboardLayout';
import RoleProtectedRoute from './components/auth/RoleProtectedRoute';
import TicketDetails from "./pages/TicketDetails";
import TriageQueue from "./pages/TriageQueue";
import ManageResources from "./pages/admin/ManageResources";
import Resources from "./pages/Resources";
import ResourceDetails from "./pages/ResourceDetails";
import MyBookings from "./pages/MyBookings";
import BookingDetails from "./pages/BookingDetails";
import ManageBookings from "./pages/admin/ManageBookings";
// function ComingSoon({ title }: { title: string }) {
//   return (
//     <div className="flex min-h-[60vh] flex-col items-center justify-center">
//       <h1 className="text-3xl font-bold text-slate-900">{title}</h1>

//       <p className="mt-3 text-slate-500">This module is under development.</p>
//     </div>
//   );
// }

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}

      <Route path="/" element={<LandingPage />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      {/* USER ROUTES */}

      <Route element={<RoleProtectedRoute allowedRoles={['USER']} />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />

          <Route path="tickets" element={<Tickets />} />

          <Route
            path="tickets/:id"
            element={<TicketDetails />}
          />

          <Route path="triage" element={<TriageQueue/>} />
           <Route
                path="triage/:id"
                element={<TicketDetails reviewMode />}
            />
          <Route path="bookings" element={<MyBookings />} />
          <Route
                  path="bookings/:id"
                  element={<BookingDetails/>}
              />
          <Route path="resources" element={<Resources/>} />
          <Route
               path="resources/:id"
               element={<ResourceDetails />}
          />
        </Route>
      </Route>

      {/* ADMIN ROUTES */}

      <Route element={<RoleProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboardLayout />}>
          <Route index element={<AdminDashboard />} />

          <Route path="tickets" element={<Tickets />} />

          <Route
            path="tickets/:id"
            element={<TicketDetails />}
          />

          <Route path="triage" element={<TriageQueue />} />
          <Route
               path="triage/:id"
               element={<TicketDetails reviewMode />}
           />
          <Route
            path="resources"
            element={<ManageResources/>}
          />
           <Route
                path="resources/:id"
                element={<ResourceDetails/>}
            />

          <Route
            path="bookings"
            element={<ManageBookings />}
          />
          <Route
            path="bookings/:id"
            element={<BookingDetails />}
          />
        </Route>
      </Route>

      {/* Unknown Routes */}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
