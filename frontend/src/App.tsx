import { Routes, Route } from "react-router-dom";

import LandingPage from "./Pages/LandingPage";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Dashboard from "./Pages/Dashboard";

import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/layouts/DashboardLayout";

function ComingSoon({ title }: { title: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">

            <h2 className="text-2xl font-bold text-slate-900">
                {title}
            </h2>

            <p className="mt-3 text-slate-500">
                This module is under development.
            </p>

        </div>
    );
}

export default function App() {

    return (
        <Routes>

            {/* Public Routes */}

            <Route path="/" element={<LandingPage />} />

            <Route path="/login" element={<Login />} />

            <Route path="/register" element={<Register />} />

            {/* Protected Dashboard Routes */}

            <Route element={<ProtectedRoute />}>

                <Route
                    path="/dashboard"
                    element={<DashboardLayout />}
                >

                    <Route index element={<Dashboard />} />

                    <Route
                        path="tickets"
                        element={<ComingSoon title="Tickets" />}
                    />

                    <Route
                        path="triage"
                        element={<ComingSoon title="Triage Queue" />}
                    />

                    <Route
                        path="bookings"
                        element={<ComingSoon title="My Bookings" />}
                    />

                    <Route
                        path="resources"
                        element={<ComingSoon title="Resources" />}
                    />

                    <Route
                        path="admin/resources"
                        element={<ComingSoon title="Manage Resources" />}
                    />

                    <Route
                        path="admin/bookings"
                        element={<ComingSoon title="Manage Bookings" />}
                    />

                </Route>

            </Route>

        </Routes>
    );
}