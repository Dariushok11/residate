"use client";

import { Button } from "@/components/ui/button";
import { X, Mail, KeyRound, Lock, ChevronRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useSearchParams } from 'next/navigation';

function RecoverContent() {
    const searchParams = useSearchParams();
    const urlEmail = searchParams.get('email') || "";

    const [step, setStep] = React.useState<"email" | "pin" | "password">("email");
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState("");

    const [email, setEmail] = React.useState(urlEmail);
    const [pin, setPin] = React.useState("");
    const [newPassword, setNewPassword] = React.useState("");

    const handleSendPin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch('/api/forgot-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Error al enviar el PIN.");
                setIsLoading(false);
                return;
            }

            if (data.emailError) {
                // El PIN fue guardado pero el correo no se pudo enviar (restricción de Resend en modo prueba)
                setError(`⚠️ El PIN fue generado pero el correo no pudo enviarse: ${data.emailError}`);
            }

            // Avanzamos siempre para no revelar si el correo existe
            setStep("pin");
        } catch (err) {
            setError("Error de conexión. Inténtalo de nuevo.");
        }
        setIsLoading(false);
    };

    const handleVerifyPin = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setStep("password");
    };

    const handleVerifyAndReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            // Verificar PIN y actualizar contraseña en el servidor (seguro, bypasa RLS)
            const res = await fetch('/api/reset-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, pin, newPassword })
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "PIN inválido o caducado.");
                setIsLoading(false);
                return;
            }

            alert("✨ Contraseña actualizada correctamente. Redirigiendo al Login...");
            window.location.href = "/login";

        } catch (err) {
            console.error(err);
            setError("Error de conexión al restablecer contraseña.");
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white shadow-2xl border border-navy/5 overflow-hidden flex flex-col relative">
                
                {/* Header */}
                <div className="bg-navy p-12 text-center relative">
                    <Link href="/login" className="absolute right-6 top-6 text-white/40 hover:text-white transition-colors">
                        <X className="h-6 w-6" />
                    </Link>
                    <div className="space-y-4">
                        <h1 className="text-3xl font-serif text-gold tracking-widest uppercase">Seguridad</h1>
                        <p className="text-white/60 text-sm uppercase tracking-widest">Recuperación de Llave</p>
                    </div>
                </div>

                <div className="p-12 space-y-8">
                    {/* Error Message */}
                    {error && (
                        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded p-4 text-sm text-red-700">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {step === "email" && (
                        <form onSubmit={handleSendPin} className="space-y-6 animate-in fade-in">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-serif text-navy">Recuperar Acceso</h2>
                                <p className="text-slate text-sm italic">Te enviaremos un PIN temporal de 6 dígitos.</p>
                            </div>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/50" />
                                <input
                                    type="email"
                                    placeholder="Email del Registro"
                                    className="w-full bg-cream border-none p-4 pl-12 text-sm focus:ring-1 focus:ring-gold outline-none transition-all font-serif"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <Button className="w-full" disabled={isLoading}>{isLoading ? "Enviando..." : "Solicitar PIN"}</Button>
                        </form>
                    )}

                    {step === "pin" && (
                        <form onSubmit={handleVerifyPin} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-serif text-navy">Verificación</h2>
                                <p className="text-slate text-sm italic">Revisa la bandeja de entrada de {email}.</p>
                            </div>
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/50" />
                                <input
                                    type="text"
                                    placeholder="PIN de 6 dígitos"
                                    maxLength={6}
                                    className="w-full bg-cream border-none p-4 pl-12 text-center tracking-[0.5em] text-lg focus:ring-1 focus:ring-gold outline-none transition-all font-serif"
                                    required
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                />
                            </div>
                            <Button className="w-full">Validar PIN</Button>
                            <button
                                type="button"
                                className="w-full text-center text-sm text-slate hover:text-navy transition-colors"
                                onClick={() => { setStep("email"); setError(""); }}
                            >
                                ← Volver a pedir el PIN
                            </button>
                        </form>
                    )}

                    {step === "password" && (
                        <form onSubmit={handleVerifyAndReset} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-serif text-navy">Nueva Llave</h2>
                                <p className="text-slate text-sm italic">Crea una nueva llave secreta para tu negocio.</p>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/50" />
                                <input
                                    type="password"
                                    placeholder="Nueva contraseña"
                                    className="w-full bg-cream border-none p-4 pl-12 text-sm focus:ring-1 focus:ring-gold outline-none transition-all font-serif"
                                    required
                                    minLength={5}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                            <Button className="w-full flex items-center justify-center gap-2 group" disabled={isLoading}>
                                {isLoading ? "Actualizando..." : "Restablecer Acceso"}
                                {!isLoading && <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function RecoverPage() {
    return (
        <React.Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center font-serif text-navy">Loading...</div>}>
            <RecoverContent />
        </React.Suspense>
    );
}
