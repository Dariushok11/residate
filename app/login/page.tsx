"use client";

import { Button } from "@/components/ui/button";
import { X, Lock, Mail, ChevronRight } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");

    const handleForgotKey = async (e: React.MouseEvent) => {
        // Envio de correo real via Resend API
        e.preventDefault();
        if (!email) {
            alert("Por favor, introduce tu correo electrónico primero.");
            return;
        }

        try {
            const response = await fetch('/api/forgot-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                alert(`✨ ¡Enviado! Revisa la bandeja de entrada de ${email}.`);
            } else {
                alert("❌ Hubo un error al enviar el correo. Por favor, inténtalo de nuevo.");
            }
        } catch (error) {
            alert("❌ No se pudo conectar con el servidor de correos.");
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Find the business by email in Supabase
            const { data, error } = await supabase
                .from('businesses')
                .select('name, id')
                .eq('email', email)
                .single();

            if (data) {
                // Update localStorage so the dashboard shows the correct business data
                localStorage.setItem('registered_business_name', data.name);
                localStorage.setItem('registered_business_id', data.id);
                window.location.href = "/dashboard";
            } else {
                alert("❌ No se encontró ningún negocio registrado con este email.");
                setIsLoading(false);
            }
        } catch (err) {
            console.error(err);
            alert("❌ Error durante el acceso. Por favor, inténtalo de nuevo.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white shadow-2xl border border-navy/5 overflow-hidden flex flex-col">

                {/* Header Section */}
                <div className="bg-navy p-12 text-center relative">
                    <Link href="/" className="absolute right-6 top-6 text-white/40 hover:text-white transition-colors">
                        <X className="h-6 w-6" />
                    </Link>
                    <div className="space-y-4">
                        <h1 className="text-3xl font-serif text-gold tracking-widest uppercase">ResiDate</h1>
                        <p className="text-white/60 text-sm uppercase tracking-widest">Client Portal</p>
                    </div>
                </div>

                {/* Form Section */}
                <div className="p-12 space-y-8">
                    <div className="space-y-2 text-center">
                        <h2 className="text-2xl font-serif text-navy">Welcome Back</h2>
                        <p className="text-slate italic">Enter your credentials to access your sanctuary.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/50" />
                                <input
                                    type="email"
                                    placeholder="Registry Email"
                                    className="w-full bg-cream border-none p-4 pl-12 text-sm focus:ring-1 focus:ring-gold outline-none transition-all font-serif"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/50" />
                                <input
                                    type="password"
                                    placeholder="Secret Key"
                                    className="w-full bg-cream border-none p-4 pl-12 text-sm focus:ring-1 focus:ring-gold outline-none transition-all font-serif"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                            <label className="flex items-center gap-2 cursor-pointer text-slate">
                                <input type="checkbox" className="accent-gold h-3 w-3" />
                                <span>Remember Registry</span>
                            </label>
                            <a href="#" onClick={handleForgotKey} className="text-gold hover:text-navy transition-colors font-medium">Forgot Key?</a>
                        </div>

                        <Button
                            className="w-full flex items-center justify-center gap-2 group"
                            disabled={isLoading}
                        >
                            {isLoading ? "Validating..." : "Sign In to Registry"}
                            {!isLoading && <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                        </Button>
                    </form>

                    {/* Removed Membership Link */}
                </div>
            </div>
        </div>
    );
}
