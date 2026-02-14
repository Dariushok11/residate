"use client";

import Link from "next/link";
import { LayoutDashboard, Calendar, Users, Settings, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === "/dashboard") {
            return pathname === "/dashboard";
        }
        return pathname.startsWith(path);
    };

    return (
        <div className="flex min-h-screen bg-cream">
            {/* Sidebar - "The Ledger" Style */}
            <aside className="hidden w-64 flex-col border-r bg-navy text-white md-flex">
                <div className="flex px-6 items-center border-b border-white/5 h-20">
                    <Link href="/" className="text-xl font-serif font-bold tracking-widest text-gold hover:opacity-80 transition-all">ResiDate</Link>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {/* Navigation Items */}
                    <h4 className="px-2 py-2 text-xs font-bold uppercase tracking-wider opacity-60">Management</h4>

                    <Link
                        href="/dashboard"
                        className={`flex items-center gap-3 px-3 py-3 text-sm font-medium transition-all ${isActive("/dashboard")
                            ? "bg-white-10 text-gold border-l-2 border-gold"
                            : "hover:bg-white-10"
                            }`}
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Overview
                    </Link>

                    <Link
                        href="/dashboard/calendar"
                        className={`flex items-center gap-3 px-3 py-3 text-sm font-medium transition-all ${isActive("/dashboard/calendar")
                            ? "bg-white-10 text-gold border-l-2 border-gold"
                            : "hover:bg-white-10"
                            }`}
                    >
                        <Calendar className="h-4 w-4" />
                        Bookings
                    </Link>

                    <Link
                        href="/dashboard/clients"
                        className={`flex items-center gap-3 px-3 py-3 text-sm font-medium transition-all ${isActive("/dashboard/clients")
                            ? "bg-white-10 text-gold border-l-2 border-gold"
                            : "hover:bg-white-10"
                            }`}
                    >
                        <Users className="h-4 w-4" />
                        Clients
                    </Link>

                    <Link
                        href="/dashboard/settings"
                        className={`flex items-center gap-3 px-3 py-3 text-sm font-medium transition-all ${isActive("/dashboard/settings")
                            ? "bg-white-10 text-gold border-l-2 border-gold"
                            : "hover:bg-white-10"
                            }`}
                    >
                        <Settings className="h-4 w-4" />
                        Settings
                    </Link>
                </nav>

                <div className="border-t border-white/5 p-4">
                    <Link href="/" className="flex w-full items-center gap-3 px-3 py-3 text-sm font-medium hover:bg-red-500/10 transition-all text-white/60 hover:text-white">
                        <LogOut className="h-4 w-4" />
                        Log Out
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col mb-20 md-mb-0">
                <div className="flex-1 p-4 md-p-12 overflow-y-auto">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-navy border-t border-white/10 flex items-center justify-around h-20 md-hidden">
                <Link
                    href="/dashboard"
                    className={`flex flex-col items-center justify-center gap-1 transition-all ${isActive("/dashboard") ? "text-gold" : "text-white/60"}`}
                >
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="text-[10px] uppercase tracking-widest font-bold">Overview</span>
                </Link>

                <Link
                    href="/dashboard/calendar"
                    className={`flex flex-col items-center justify-center gap-1 transition-all ${isActive("/dashboard/calendar") ? "text-gold" : "text-white/60"}`}
                >
                    <Calendar className="h-5 w-5" />
                    <span className="text-[10px] uppercase tracking-widest font-bold">Bookings</span>
                </Link>

                <Link
                    href="/dashboard/clients"
                    className={`flex flex-col items-center justify-center gap-1 transition-all ${isActive("/dashboard/clients") ? "text-gold" : "text-white/60"}`}
                >
                    <Users className="h-5 w-5" />
                    <span className="text-[10px] uppercase tracking-widest font-bold">Clients</span>
                </Link>

                <Link
                    href="/dashboard/settings"
                    className={`flex flex-col items-center justify-center gap-1 transition-all ${isActive("/dashboard/settings") ? "text-gold" : "text-white/60"}`}
                >
                    <Settings className="h-5 w-5" />
                    <span className="text-[10px] uppercase tracking-widest font-bold">Settings</span>
                </Link>
            </nav>
        </div>
    );
}
