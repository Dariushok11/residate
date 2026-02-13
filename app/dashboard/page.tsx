"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useBookingStore, useBusinessStore } from "@/lib/store";
import * as React from "react";

export default function DashboardPage() {
    const { slots, isHydrated } = useBookingStore();
    const { businesses } = useBusinessStore();
    const [businessName, setBusinessName] = React.useState("Your Sanctuary");
    const [businessId, setBusinessId] = React.useState<string | null>(null);

    React.useEffect(() => {
        const savedName = localStorage.getItem('registered_business_name');
        if (savedName) {
            setBusinessName(savedName);
            // Derive ID from name as we do in addBusiness
            setBusinessId(savedName.toLowerCase().replace(/\s+/g, '-'));
        }
    }, []);

    // Filter for the current business bookings
    const filteredSlots = React.useMemo(() => {
        if (!businessId) return [];
        return slots.filter(s => s.businessId === businessId && s.status === "booked");
    }, [slots, businessId]);

    const getServicePrice = (slot: any) => {
        if (!businessId) return 0;
        const business = businesses.find(b => b.id === businessId);
        if (!business) return 0;
        const service = business.services.find(s => s.name === slot.service);
        return service ? service.price : 0;
    };

    // Calculate pending requests
    const pendingCount = React.useMemo(() => {
        if (!businessId) return 0;
        return slots.filter(s => s.businessId === businessId && s.status === "pending").length;
    }, [slots, businessId]);

    const revenue = filteredSlots.reduce((acc, slot) => acc + getServicePrice(slot), 0);

    const handleExport = () => {
        const data = {
            businessName,
            businessId,
            exportedAt: new Date().toISOString(),
            revenue,
            bookings: filteredSlots.map(s => ({
                ...s,
                price: getServicePrice(s)
            }))
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${businessName.toLowerCase().replace(/\s+/g, '-')}-portfolio-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Page Header */}
            <div className="flex flex-col md-flex-row md-items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-navy">Registry Overview</h1>
                    <p className="text-slate italic">Welcome back to the sanctuary, {businessName}.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleExport}>Export Portfolio</Button>
                    <Link href="/book">
                        <Button>New Appointment</Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md-grid-cols-3 gap-6">
                <div className="bg-white p-8 shadow-2xl border border-navy/5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate opacity-60">Total Revenue</h3>
                    <div className="mt-4 flex items-end justify-between">
                        <span className="text-4xl font-serif text-navy">${revenue.toLocaleString()}</span>
                        <span className="text-sm text-green-600 font-medium">+12%</span>
                    </div>
                </div>

                <div className="bg-white p-8 shadow-2xl border border-navy/5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate opacity-60">Active Bookings</h3>
                    <div className="mt-4 flex items-end justify-between">
                        <span className="text-4xl font-serif text-navy">{filteredSlots.length}</span>
                        <span className="text-sm text-slate">Total</span>
                    </div>
                </div>

                <div className="bg-white p-8 shadow-2xl border border-navy/5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate opacity-60">Pending Requests</h3>
                    <div className="mt-4 flex items-end justify-between">
                        <span className="text-4xl font-serif text-gold">{pendingCount}</span>
                        <span className="text-sm text-slate">Requires Action</span>
                    </div>
                </div>
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white border border-[var(--border-subtle)]">
                <div className="p-6 border-b border-[var(--border-subtle)]">
                    <h3 className="text-lg font-serif">Recent Boarding</h3>
                </div>
                <div className="p-0">
                    {filteredSlots.length === 0 ? (
                        <div className="p-12 text-center text-slate italic opacity-40">No entries in the boarding ledger yet.</div>
                    ) : (
                        filteredSlots.sort((a, b) => b.timestamp - a.timestamp).map((slot) => (
                            <div key={slot.id} className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)] last:border-0 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-[var(--color-navy)] flex items-center justify-center text-white font-serif">
                                        {slot.clientName?.charAt(0) || 'G'}
                                    </div>
                                    <div>
                                        <p className="font-medium text-[var(--text-primary)]">{slot.clientName || 'Guest User'}</p>
                                        <p className="text-sm text-[var(--text-secondary)]">{slot.service} • {slot.hour}:00 {slot.hour >= 12 ? 'PM' : 'AM'}</p>
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-[var(--text-primary)]">
                                    ${getServicePrice(slot).toFixed(2)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
