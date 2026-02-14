"use client";

import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/ui/mobile-nav";
import { Search } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useBusinessStore } from "@/lib/store";

export default function Home() {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [hasBusiness, setHasBusiness] = React.useState(false);

    React.useEffect(() => {
        const savedName = localStorage.getItem('registered_business_name');
        if (savedName) {
            setHasBusiness(true);
        }
    }, []);

    const { businesses, isHydrated } = useBusinessStore();

    const filteredBusinesses = React.useMemo(() => {
        return businesses.filter(b =>
            b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [businesses, searchTerm]);

    const stripPassword = (desc: string) => {
        return desc.replace(/\[PWD:.*?\]/g, '').trim();
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header / Navigation */}
            <header className="sticky top-0 z-50 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur">
                <div className="container flex h-[var(--header-height)] items-center justify-between px-4 md-px-6">
                    <div className="flex items-center gap-3">
                        <img src="/logo_fix.png" alt="ResiDate Logo" className="h-10 w-10 object-contain" style={{ minWidth: '40px' }} />
                        <h1 className="text-2xl font-bold uppercase tracking-widest font-serif">ResiDate</h1>
                    </div>
                    <nav className="hidden md-flex items-center gap-8 text-sm font-medium tracking-wide uppercase text-[var(--text-secondary)]">
                        <Link href="/destinations" className="hover:text-[var(--text-primary)] transition-colors">Destinos</Link>
                        <Link href="/journal" className="hover:text-[var(--text-primary)] transition-colors">Sobre nosotros</Link>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <Button variant="ghost" className="hidden sm-inline-flex">Acceder</Button>
                        </Link>
                        <Link href="/book">
                            <Button>Book Now</Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative h-80vh w-full overflow-hidden bg-navy flex items-center justify-center text-center px-4">
                    {/* Abstract Background for now, replacing image */}
                    <div className="absolute inset-0 bg-gradient-hero opacity-90 z-0"></div>

                    <div className="relative z-10 max-w-4xl space-y-6">
                        <h2 className="text-5xl md-text-7xl font-serif text-white tracking-tight leading-tight">
                            Experiencias<br />Inolvidables
                        </h2>
                        <p className="text-cream text-lg md-text-xl max-w-2xl mx-auto font-light tracking-wide opacity-90">
                            Reserva con nosotros si quieres una vida más fácil.
                        </p>

                        <div className="flex flex-col sm-flex-row gap-4 mt-8 justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-forwards opacity-0" style={{ animationFillMode: 'forwards' }}>
                            <Link href="/book">
                                <Button size="lg" className="btn-hero w-full sm-w-auto hover:scale-105 transition-transform duration-300">Book Now</Button>
                            </Link>
                            {hasBusiness && (
                                <Link href="/dashboard">
                                    <Button size="lg" className="btn-hero w-full sm-w-auto hover:scale-105 transition-transform duration-300">Access Portfolio</Button>
                                </Link>
                            )}
                        </div>


                    </div>
                </section>

                {/* Curated Section */}
                <section className="py-24 bg-[var(--bg-primary)]">
                    <div className="container px-4 md-px-6">
                        <div className="flex flex-col md-flex-row md-items-end justify-between mb-16 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-3xl font-serif text-[var(--text-primary)]">The Art of reserve</h3>
                                <div className="h-0.5 w-16 bg-[var(--color-gold)]"></div>
                            </div>

                            {/* Search Bar */}
                            <div className="relative w-full md-max-w-600 group mx-auto">
                                <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-6 w-6 text-navy opacity-40 group-focus-within:opacity-100 transition-opacity" />
                                <input
                                    type="text"
                                    placeholder="Buscar Negocios"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-[var(--bg-secondary)] border border-navy py-6 pl-18 pr-6 text-2xl tracking-widest focus:outline-none transition-all font-light placeholder:opacity-20 uppercase"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md-grid-cols-3 gap-8 md-gap-12">
                            {filteredBusinesses.length > 0 ? (
                                filteredBusinesses.map((business) => (
                                    <Link
                                        key={business.id}
                                        href={`/book?id=${business.id}`}
                                        className="group cursor-pointer no-underline text-inherit animate-in fade-in slide-in-from-bottom-2 duration-500"
                                    >
                                        <div className="aspect-[3/4] bg-[var(--bg-secondary)] relative overflow-hidden mb-6">
                                            <div className="absolute inset-0 bg-gray-200 group-hover:scale-105 transition-transform duration-700 ease-out flex items-center justify-center p-4">
                                                <span className="text-navy font-serif opacity-20 text-xs italic tracking-widest uppercase">Luxury Preview</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1 text-center">
                                            <h4 className="text-xl font-serif text-navy">{business.name}</h4>
                                            <p className="text-[10px] text-gold uppercase tracking-[0.2em] font-medium">{business.category} • {business.location}</p>
                                            <p className="text-sm text-slate font-light italic opacity-70 mt-3 line-clamp-2 max-w-[280px] mx-auto px-4 leading-relaxed">"{stripPassword(business.description)}"</p>
                                            <p className="text-[10px] font-bold pt-5 text-navy opacity-30 group-hover:opacity-100 group-hover:text-gold transition-all uppercase tracking-[0.4em]">Discover</p>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="col-span-1 md-col-span-3 py-20 text-center space-y-4">
                                    <p className="text-xl font-serif text-slate opacity-40 italic">
                                        {searchTerm
                                            ? "No sanctuaries found matching your search."
                                            : "Our directory is awaiting its first sanctuary."}
                                    </p>
                                    {searchTerm ? (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="text-[var(--color-gold)] text-sm uppercase tracking-widest font-medium border-b border-[var(--color-gold)]"
                                        >
                                            Ver todos los negocios
                                        </button>
                                    ) : (
                                        <Link href="/register/business">
                                            <Button variant="ghost" className="text-gold uppercase tracking-widest">Registra tu Negocio</Button>
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Partner Section */}
                <section className="py-24 bg-navy text-white text-center">
                    <div className="container px-4 md-px-6 max-w-4xl space-y-8">
                        <h3 className="text-4xl md-text-5xl font-serif tracking-tight">Expande tu Alcance</h3>
                        <p className="text-cream/80 text-lg md-text-xl font-light tracking-wide max-w-2xl mx-auto">
                            Únete a nuestra exclusiva colección de los negocios más extraordinarios del mundo y llega a un público global de usuarios exigentes.
                        </p>
                        <div className="pt-4">
                            <Link href="/register/business">
                                <Button size="lg" className="btn-hero px-12">Colabora con Nosotros</Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-[var(--border-subtle)] py-12 md:py-24 bg-[var(--bg-primary)]">
                <div className="container px-4 md-px-6 flex flex-col md-flex-row justify-between items-center gap-8 md-gap-0">
                    <div className="text-2xl font-serif uppercase tracking-widest">ResiDate</div>
                    <p className="text-sm text-[var(--text-secondary)]">© 2026 ResiDate. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
