"use client";

import { Button } from "@/components/ui/button";
import { Search, UserPlus, Mail, MoreHorizontal } from "lucide-react";

const INVITE_SUBJECT = "Invitation to ResiDate Sanctuary";
const INVITE_BODY = "Greetings,\n\nYou are cordially invited to experience our sanctuary. Please visit our registry to curate your next stay.\n\nWarm regards,";

import { useBookingStore } from "@/lib/store";
import { useState, useEffect } from "react";

export default function ClientsPage() {
    const { slots, toggleVIP, removeClient } = useBookingStore();
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [businessId, setBusinessId] = useState<string | null>(null);

    useEffect(() => {
        const savedId = localStorage.getItem('registered_business_id');
        if (savedId) {
            setBusinessId(savedId);
        }
    }, []);

    // Filter slots to get unique clients who have "booked" and belong to this business
    const clients = slots
        .filter(s => s.status === "booked" && s.clientEmail && s.businessId === businessId)
        .reduce((acc: any[], curr) => {
            const existing = acc.find(c => c.email === curr.clientEmail);
            const now = new Date();

            // Try to parse booking date from day string (YYYY-MM-DD)
            let bookingDate = new Date();
            try {
                if (curr.day) {
                    const parts = curr.day.split('-');
                    if (parts.length === 3) {
                        bookingDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), curr.hour || 0);
                    }
                } else {
                    bookingDate = new Date(curr.timestamp);
                }
            } catch (e) {
                bookingDate = new Date(curr.timestamp);
            }

            const isFuture = bookingDate > now;

            if (!existing) {
                acc.push({
                    id: curr.id,
                    name: curr.clientName || "Guest User",
                    email: curr.clientEmail,
                    isVIP: curr.isVIP || false,
                    hasFutureBooking: isFuture,
                    lastVisitDate: bookingDate,
                    lastVisit: bookingDate.toLocaleDateString()
                });
            } else {
                if (isFuture) existing.hasFutureBooking = true;
                if (curr.isVIP) existing.isVIP = true;

                // Keep the most recent visit date
                if (bookingDate > existing.lastVisitDate) {
                    existing.lastVisitDate = bookingDate;
                    existing.lastVisit = bookingDate.toLocaleDateString();
                }
                // Update name if we capture it
                if (curr.clientName && (!existing.name || existing.name === "Guest User")) {
                    existing.name = curr.clientName;
                }
            }
            return acc;
        }, [])
        .map(client => ({
            ...client,
            status: client.isVIP ? "VIP" : (client.hasFutureBooking ? "Active" : "Inactive")
        }));

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        window.location.href = `mailto:${inviteEmail}?subject=${encodeURIComponent(INVITE_SUBJECT)}&body=${encodeURIComponent(INVITE_BODY)}`;
        setIsInviteOpen(false);
        setInviteEmail("");
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 relative">
            {/* Invitation Modal */}
            {isInviteOpen && (
                <div className="fixed inset-0 bg-navy/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white p-8 w-full max-w-md shadow-2xl border border-navy/10 animate-in zoom-in-95">
                        <h3 className="text-2xl font-serif text-navy mb-2">Invite a Guest</h3>
                        <p className="text-slate mb-6">Send an exclusive invitation to join the registry.</p>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="text-xs uppercase tracking-widest font-bold text-navy opacity-50 block mb-2">Guest Email</label>
                                <input
                                    autoFocus
                                    type="email"
                                    required
                                    className="w-full bg-cream border-none p-4 text-navy focus:ring-1 focus:ring-gold outline-none"
                                    placeholder="guest@example.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-4 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setIsInviteOpen(false)} className="flex-1">Cancel</Button>
                                <Button type="submit" className="flex-1">Send Invitation</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col md-flex-row md-items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-navy">Client Registry</h1>
                    <p className="text-slate italic">Curating relationships with the world's most discerning guests.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="flex items-center gap-2" onClick={() => setIsInviteOpen(true)}>
                        <Mail className="h-4 w-4" />
                        Invite Guest
                    </Button>

                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-4 shadow-2xl border border-navy/5 flex flex-col md-flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/50" />
                    <input
                        type="text"
                        placeholder="Search the registry..."
                        className="w-full bg-cream border-none p-3 pl-12 text-sm focus:ring-1 focus:ring-gold outline-none transition-all font-serif"
                    />
                </div>
                <div className="flex gap-2 w-full md-w-auto">
                    <select className="bg-cream border-none p-3 text-sm focus:ring-1 focus:ring-gold outline-none transition-all font-serif text-slate">
                        <option>All Statuses</option>
                        <option>VIP Only</option>
                        <option>Active</option>
                    </select>
                </div>
            </div>

            {/* Clients Table/Grid */}
            <div className="bg-white shadow-2xl border border-navy/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-navy text-white/60 text-xs font-bold uppercase tracking-widest">
                                <th className="p-6">Client</th>
                                <th className="p-6">Status</th>
                                <th className="p-6">Last Visit</th>
                                <th className="p-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-navy/5">
                            {clients.length > 0 ? (
                                clients.map((client) => (
                                    <tr key={client.id} className="hover:bg-cream transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-navy/5 flex items-center justify-center text-navy font-serif group-hover:bg-gold group-hover:text-navy transition-all duration-300">
                                                    {client.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-serif text-navy">{client.name}</p>
                                                    <p className="text-xs text-slate">{client.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${client.status === 'VIP' ? 'bg-gold/10 text-gold' :
                                                client.status === 'Active' ? 'bg-green-50 text-green-800' :
                                                    'bg-slate/10 text-slate'
                                                }`}>
                                                {client.status}
                                            </span>
                                        </td>
                                        <td className="p-6 text-sm text-slate">
                                            {client.lastVisit}
                                        </td>
                                        <td className="p-6 relative">
                                            <button
                                                onClick={() => setOpenMenuId(openMenuId === client.email ? null : client.email)}
                                                className="text-slate hover:text-navy transition-colors"
                                            >
                                                <MoreHorizontal className="h-5 w-5" />
                                            </button>

                                            {openMenuId === client.email && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-10"
                                                        onClick={() => setOpenMenuId(null)}
                                                    />
                                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-2xl border border-navy/10 z-20 animate-in fade-in zoom-in-95">
                                                        <button
                                                            onClick={() => {
                                                                toggleVIP(client.email);
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="w-full text-left px-4 py-3 text-sm hover:bg-cream transition-colors flex items-center gap-2 text-navy"
                                                        >
                                                            <span className="text-gold">★</span>
                                                            {client.isVIP ? 'Remove VIP Status' : 'Mark as VIP'}
                                                        </button>
                                                        <div className="h-px bg-navy/5" />
                                                        <button
                                                            onClick={() => {
                                                                if (confirm(`¿Eliminar a ${client.name} del registro?`)) {
                                                                    removeClient(client.email);
                                                                }
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 transition-colors text-red-600"
                                                        >
                                                            Delete Client
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-slate italic opacity-50">
                                        No recent client activity found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
