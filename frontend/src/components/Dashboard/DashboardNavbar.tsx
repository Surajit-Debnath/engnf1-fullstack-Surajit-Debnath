import { Menu, UserRound } from "lucide-react";
import { useLocation } from "react-router-dom";
import type { User } from "../../types/dashboard";

interface DashboardNavbarProps {
    user: User | null;
    onMenuClick: () => void;
}

const pageTitles: Record<string, string> = {
    "/dashboard": "Overview",
    "/dashboard/tickets": "Tickets",
    "/dashboard/triage": "Triage Queue",
    "/dashboard/bookings": "My Bookings",
    "/dashboard/resources": "Resources",
    "/dashboard/admin/resources": "Manage Resources",
    "/dashboard/admin/bookings": "Manage Bookings"
};

export default function DashboardNavbar({
    user,
    onMenuClick
}: DashboardNavbarProps) {

    const location = useLocation();

    const title = pageTitles[location.pathname] || "Dashboard";

    return (
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-lg sm:px-8">

            <div className="flex items-center gap-4">

                <button
                    onClick={onMenuClick}
                    aria-label="Open sidebar"
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                >
                    <Menu size={24} />
                </button>

                <h1 className="text-xl font-semibold text-slate-900">
                    {title}
                </h1>

            </div>

            {/* User Profile */}
            <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-600">

                    {user?.name
                        ? user.name.charAt(0).toUpperCase()
                        : <UserRound size={20} />
                    }

                </div>

                <div className="hidden sm:block">

                    <p className="text-sm font-semibold text-slate-800">
                        {user?.name || "User"}
                    </p>

                    <p className="text-xs text-slate-500">
                        {user?.role === "ADMIN"
                            ? "Administrator"
                            : user?.role === "USER"
                                ? "Support Workspace"
                                : "Loading profile..."
                        }
                    </p>

                </div>

            </div>

        </header>
    );
}