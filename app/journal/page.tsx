import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function JournalPage() {
    return (
        <div className="min-h-screen bg-cream text-navy selection:bg-gold selection:text-white">
            <div className="container mx-auto px-4 py-12 md:py-24 max-w-4xl">

                {/* Back Link */}
                <Link href="/" className="inline-flex items-center gap-2 text-sm uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity mb-12">
                    <ArrowLeft className="h-4 w-4" />
                    Return Home
                </Link>

                {/* Article Header */}
                <header className="mb-16 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">The Philosophy</span>
                    <h1 className="text-4xl md:text-6xl font-serif leading-tight">
                        Seamless Connection, <br className="hidden md:block" />
                        <span className="italic text-slate-400">Timeless Efficiency.</span>
                    </h1>
                </header>

                {/* Main Content */}
                <div className="prose prose-lg prose-headings:font-serif prose-p:text-slate-600 prose-p:leading-relaxed max-w-none space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">

                    <p className="text-xl md:text-2xl font-light text-navy leading-relaxed border-l-2 border-gold pl-6 mb-12 italic">
                        "Esta WEB facilita la vida tanto de los clientes como de las empresas, optimizando el proceso de reservas de forma rápida y sencilla."
                    </p>

                    <div className="grid md:grid-cols-2 gap-12 text-base md:text-lg">
                        <div className="space-y-6">
                            <p>
                                <strong className="text-navy block mb-2 uppercase tracking-wide text-xs">Accessibility</strong>
                                La APP se basa en facilitar el acceso para realizar reservas sin necesidad de llamar o molestar a nadie. Permite consultar la disponibilidad en tiempo real desde cualquier dispositivo y en cualquier momento del día. Los clientes pueden elegir el horario que mejor se adapte a sus necesidades con total comodidad.
                            </p>
                            <p>
                                <strong className="text-navy block mb-2 uppercase tracking-wide text-xs">Management</strong>
                                Las empresas pueden gestionar su agenda de forma automática y organizada, evitando errores o solapamientos. El sistema actualiza los horarios al instante cuando una cita es reservada, garantizando información precisa.
                            </p>
                        </div>
                        <div className="space-y-6">
                            <p>
                                <strong className="text-navy block mb-2 uppercase tracking-wide text-xs">Efficiency</strong>
                                Reduce el tiempo invertido en atender llamadas y responder mensajes repetitivos. Mejora la experiencia del usuario ofreciendo confirmaciones y recordatorios automáticos.
                            </p>
                            <p>
                                <strong className="text-navy block mb-2 uppercase tracking-wide text-xs">Optimization</strong>
                                Aumenta la eficiencia del negocio y optimiza la ocupación de cada franja horaria disponible. En definitiva, es una solución moderna que simplifica las reservas y conecta a clientes y empresas de manera inteligente y eficaz.
                            </p>
                        </div>
                    </div>

                    <div className="mt-16 pt-8 border-t border-navy/10 flex justify-center">
                        <div className="text-center space-y-4">
                            <p className="text-sm uppercase tracking-widest opacity-50">Words by ResiDate</p>
                            <div className="h-px w-16 bg-gold mx-auto"></div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
