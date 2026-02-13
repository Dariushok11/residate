"use client";

import { Button } from "@/components/ui/button";
import { Search, MapPin, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useBusinessStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function DestinationsPage() {
    const [searchTerm, setSearchTerm] = React.useState('');
    const { businesses, isHydrated } = useBusinessStore();

    // Filter logic
    const filteredBusinesses = React.useMemo(() => {
        return (businesses || []).filter(b =>
            b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [businesses, searchTerm]);

    return (
        <div className="min-h-screen bg-cream selection:bg-gold selection:text-white">

            {/* Header / Hero Section */}
            <div className="bg-navy text-white pt-32 pb-20 px-4 md:px-8 relative">
                {/* Back Button */}
                <div className="absolute top-8 left-4 md:left-8 z-20">
                    <Link href="/" className="inline-flex items-center gap-2 text-xs md:text-sm uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity text-white">
                        <ArrowLeft className="h-4 w-4" />
                        Return Home
                    </Link>
                </div>

                <div className="max-w-4xl mx-auto text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">Explore The Collection</span>
                    <h1 className="text-4xl md:text-5xl font-serif">Curated Destinations</h1>

                    {/* Search Bar - Stylized to match Main Page */}
                    <div className="max-w-2xl mx-auto mt-12 relative group text-left">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-navy opacity-40 group-focus-within:opacity-100 transition-opacity z-10" />
                        <input
                            type="text"
                            placeholder="SEARCH SANCTUARIES..."
                            className="w-full bg-white text-navy py-5 pl-16 pr-6 text-lg md:text-xl tracking-widest focus:outline-none transition-all font-light placeholder:text-navy/30 uppercase border-none shadow-2xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Results Grid */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-20">
                {!isHydrated ? (
                    <div className="text-center py-20 opacity-50 font-serif italic">Loading collection...</div>
                ) : filteredBusinesses.length === 0 ? (
                    <div className="text-center py-20 space-y-4">
                        <p className="text-2xl font-serif text-navy/50">No destinations found matching your criteria.</p>
                        <Button variant="ghost" onClick={() => setSearchTerm('')} className="text-gold hover:text-navy">Clear Filters</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredBusinesses.map((business, index) => (
                            <Link
                                key={business.id}
                                href={`/book?id=${business.id}`}
                                className="group block bg-white border border-navy/5 hover:border-gold/30 hover:shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 overflow-hidden"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {/* Image Placeholder (could be real image later) */}
                                <div className="h-64 bg-slate-100 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-navy/20 group-hover:bg-navy/0 transition-colors duration-500"></div>
                                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                                        <span className="text-white text-xs uppercase tracking-widest font-medium opacity-80">{business.category}</span>
                                    </div>
                                </div>

                                <div className="p-8 space-y-4">
                                    <div>
                                        <h3 className="text-2xl font-serif text-navy group-hover:text-gold transition-colors">{business.name}</h3>
                                        <div className="flex items-center gap-2 text-slate-500 mt-2 text-sm">
                                            <MapPin className="h-3 w-3" />
                                            <span>{business.location}</span>
                                        </div>
                                    </div>

                                    <p className="text-slate-600 line-clamp-2 text-sm leading-relaxed">
                                        {business.description || "An exclusive sanctuary for wellness and rejuvenation."}
                                    </p>

                                    <div className="pt-6 flex items-center justify-between border-t border-navy/5">
                                        <span className="text-xs uppercase tracking-widest text-navy/60 group-hover:text-navy transition-colors">View Availability</span>
                                        <ArrowRight className="h-4 w-4 text-gold group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
