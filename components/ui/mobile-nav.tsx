"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Link from "next/link";

export function MobileNav() {
    const [open, setOpen] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const toggleOpen = () => setOpen(!open);

    return (
        <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={toggleOpen}>
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
            </Button>

            {mounted && open && createPortal(
                <div className="fixed inset-0 z-[99999] bg-white text-navy animate-in slide-in-from-left-full duration-300 flex flex-col antialiased" style={{ opacity: 1 }}>
                    <div className="flex justify-between items-center p-4 border-b border-navy/10 bg-white">
                        <span className="text-xl font-serif uppercase tracking-widest pl-2 text-navy">ResiDate</span>
                        <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-navy hover:bg-navy/10 rounded-full h-10 w-10 p-0">
                            <X className="h-6 w-6" />
                        </Button>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto bg-white">
                        <nav className="flex flex-col items-center justify-center gap-8 w-full max-w-sm mx-auto text-xl font-serif uppercase tracking-widest text-navy">
                            <Link href="/book" onClick={() => setOpen(false)} className="hover:text-gold transition-colors block py-2">Destinations</Link>
                            <Link href="/book" onClick={() => setOpen(false)} className="hover:text-gold transition-colors block py-2">Experiences</Link>
                            <Link href="/book" onClick={() => setOpen(false)} className="hover:text-gold transition-colors block py-2">Membership</Link>
                            <Link href="/book" onClick={() => setOpen(false)} className="hover:text-gold transition-colors block py-2">Journal</Link>

                            <div className="h-px w-10 bg-gold my-4 opacity-50"></div>

                            <div className="flex flex-col gap-4 w-full pt-4">
                                <Link href="/login" onClick={() => setOpen(false)} className="w-full">
                                    <Button variant="outline" className="w-full border-navy text-navy hover:bg-navy hover:text-white h-12 uppercase tracking-wider text-sm">
                                        Client Login
                                    </Button>
                                </Link>
                                <Link href="/book" onClick={() => setOpen(false)} className="w-full">
                                    <Button className="w-full bg-navy hover:bg-navy/90 text-white h-12 uppercase tracking-wider text-sm font-bold">
                                        Book Your Registry
                                    </Button>
                                </Link>
                            </div>
                        </nav>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
