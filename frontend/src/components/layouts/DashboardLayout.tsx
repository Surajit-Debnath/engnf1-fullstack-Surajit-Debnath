import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../Dashboard/Sidebar";
import DashboardNavbar from "../Dashboard/DashboardNavbar";

import { api } from "../../services/api";
import type { User } from "../../types/dashboard";

export interface DashboardContext {
    user: User | null;
}

export default function DashboardLayout() {

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [profileError, setProfileError] = useState("");

    useEffect(() => {

        const controller = new AbortController();

        async function fetchUser() {
            try {

                const response = await api.get("/auth/me", {
                    signal: controller.signal
                });

                // Your backend returns { resp: [user] }
                const currentUser = response.data.resp?.[0];

                if (!currentUser) {
                    setProfileError("User profile not found.");
                    return;
                }

                setUser(currentUser);

            } catch {

                if (!controller.signal.aborted) {
                    setProfileError("Unable to load user profile.");
                }

            }
        }

        fetchUser();

        return () => controller.abort();

    }, []);

    return (
        <div className="min-h-screen bg-slate-50">

            <Sidebar
                role={user?.role}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="min-h-screen lg:ml-64">

                <DashboardNavbar
                    user={user}
                    onMenuClick={() => setSidebarOpen(true)}
                />

                <main className="p-4 sm:p-6 lg:p-8">

                    {profileError && (
                        <div
                            role="alert"
                            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
                        >
                            {profileError}
                        </div>
                    )}

                    <Outlet context={{ user }} />

                </main>

            </div>

        </div>
    );
}