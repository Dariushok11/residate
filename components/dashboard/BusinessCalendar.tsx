"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBookingStore, useBusinessStore } from "@/lib/store";

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Helper to get a stable unique key for a specific date
const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export function BusinessCalendar() {
    // Estado para la fecha/hora actual y la fecha de visualización
    const [now, setNow] = React.useState<Date | null>(null);
    const [viewDate, setViewDate] = React.useState<Date | null>(null);
    const { toggleBlock, getSlot, addBooking } = useBookingStore();
    const { businesses } = useBusinessStore();
    const [isClient, setIsClient] = React.useState(false);

    // Estados para el modal de bloqueo y calendario
    const [showBlockModal, setShowBlockModal] = React.useState(false);
    const [showGCalModal, setShowGCalModal] = React.useState(false); // Nuevo estado para modal GCal
    const [blockReason, setBlockReason] = React.useState("Personal Commitment");
    const [icalUrlInput, setIcalUrlInput] = React.useState(""); // Estado para el input de URL
    const [selectedSlot, setSelectedSlot] = React.useState<{ day: string, hour: number } | null>(null);
    const [mobileDayIndex, setMobileDayIndex] = React.useState(0);
    const [isGCalConnected, setIsGCalConnected] = React.useState(false);
    const [isSyncing, setIsSyncing] = React.useState(false);

    const [currentBusinessId, setCurrentBusinessId] = React.useState<string>("default-business");

    React.useEffect(() => {
        const savedId = localStorage.getItem('registered_business_id');
        if (savedId) {
            setCurrentBusinessId(savedId);
        } else if (businesses.length > 0) {
            setCurrentBusinessId(businesses[0].id);
        }
    }, [businesses]);

    React.useEffect(() => {
        setIsClient(true);
        const currentDate = new Date();
        setNow(currentDate);
        setViewDate(currentDate);

        // Actualizar cada minuto para el reloj
        const timer = setInterval(() => {
            setNow(new Date());
        }, 1000);

        // Check if GCal is connected from setting
        const gcal = localStorage.getItem('residate-gcal-connected');
        if (gcal === 'true') {
            setIsGCalConnected(true);
            // In a real app, we might auto-sync here on load
            syncCalendar();
        }

        return () => clearInterval(timer);
    }, []);

    const syncCalendar = async () => {
        const icalUrl = localStorage.getItem('residate-ical-url');
        if (!icalUrl) return;

        setIsSyncing(true);
        try {
            // Import dynamically to avoid SSR issues if any, though standard import is fine usually
            const { parseICal } = await import('@/lib/icalParser');

            const response = await fetch(`/api/ical?url=${encodeURIComponent(icalUrl)}`);
            if (!response.ok) throw new Error('Failed to fetch calendar');

            const icalData = await response.text();
            const events = parseICal(icalData);

            console.log("Synced events:", events.length);

            // Map events to our slots
            // This is a simplified mapping for the demo. Real mapping needs timezone handling.
            const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; // ical uses 0=sun
            const businessDayMap: { [key: string]: string } = { "Mon": "Mon", "Tue": "Tue", "Wed": "Wed", "Thu": "Thu", "Fri": "Fri", "Sat": "Sat", "Sun": "Sun" };

            let syncedCount = 0;
            events.forEach(event => {
                if (event.start) {
                    const start = event.start;
                    const dayKey = formatDateKey(start);

                    const hour = start.getHours();
                    // Only sync if within business hours 8-20
                    if (hour >= 8 && hour <= 20) {
                        addBooking(
                            currentBusinessId,
                            dayKey,
                            hour,
                            "Google Calendar", // clientName
                            event.summary || "Busy", // service
                            "gcal@sync.com" // clientEmail
                        );
                        syncedCount++;
                    }
                }
            });

            if (syncedCount > 0) {
                // visual feedback optional here, maybe simple toast
            }

        } catch (error) {
            console.error("Sync failed", error);
        } finally {
            setIsSyncing(false);
        }
    };

    if (!isClient || !now || !viewDate) {
        return <div className="p-12 text-center text-gray-400 font-serif">Cargando Agenda...</div>;
    }

    // Funciones de navegación
    const handlePrevWeek = () => {
        const newDate = new Date(viewDate);
        newDate.setDate(viewDate.getDate() - 7);
        setViewDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(viewDate);
        newDate.setDate(viewDate.getDate() + 7);
        setViewDate(newDate);
    };

    // Formatear fecha actual para el reloj
    const formattedDate = new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(now);
    const timeString = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const clockString = `${formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)} a las ${timeString}`;

    // Calcular la semana de VISUALIZACIÓN (based on viewDate)
    const currentViewDay = viewDate.getDay(); // 0 is Sunday
    const distanceToMonday = currentViewDay === 0 ? 6 : currentViewDay - 1;
    const monday = new Date(viewDate);
    monday.setDate(monday.getDate() - distanceToMonday);

    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return {
            name: new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(d),
            date: d.getDate(),
            fullDate: d,
            dayKey: formatDateKey(d)
        };
    });

    // Formato del rango de la semana para el título
    const weekStart = weekDays[0].fullDate;
    const weekEnd = weekDays[6].fullDate;
    const weekRangeString = `${weekStart.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    const handleSlotClick = (dayIndex: number, hour: number) => {
        const dayKey = weekDays[dayIndex].dayKey;

        const existingSlot = getSlot(currentBusinessId, dayKey, hour);

        // Open modal for ANY slot click, allowing edit or new block
        // Pre-fill modal
        setSelectedSlot({ day: dayKey, hour: hour });
        setBlockReason(existingSlot ? (existingSlot.service || "") : ""); // Pre-fill if exists
        setShowBlockModal(true);
    };

    const handleCreateBlock = () => {
        if (!selectedSlot) return; // Should not happen

        // Simplemente añadimos/sobrescribimos bloqueo
        // "Personal" -> clientName indicates manual block
        addBooking(currentBusinessId, selectedSlot.day, selectedSlot.hour, "Personal", blockReason, "personal@blocked.com");

        // alert(`✅ Bloqueo guardado.`); // Removing alert for smoother UX
        setShowBlockModal(false);
        setBlockReason(""); // Reset
        setSelectedSlot(null);
    };

    const handleDeleteBlock = () => {
        if (!selectedSlot) return;
        toggleBlock(currentBusinessId, selectedSlot.day, selectedSlot.hour); // This toggles it OFF if it exists
        setShowBlockModal(false);
        setBlockReason(""); // Reset
        setSelectedSlot(null);
    };

    // START NEW GCAL LOGIC
    const handleStartGCalConnect = () => {
        if (isGCalConnected) {
            // Si ya está conectado, desconectar directamente (o pedir confirmación)
            const confirmDisconnect = window.confirm("¿Seguro que quieres desconectar Google Calendar?");
            if (confirmDisconnect) {
                setIsGCalConnected(false);
                localStorage.removeItem('residate-gcal-connected');
                localStorage.removeItem('residate-ical-url');
                // Optional: Recargar para limpiar eventos si no están en una base de datos real
                // window.location.reload(); 
            }
        } else {
            setIcalUrlInput("");
            setShowGCalModal(true);
        }
    };

    // Función para guardar URL y conectar desde el modal
    const handleConfirmGCal = () => {
        const url = icalUrlInput;
        if (url && (url.startsWith('http') || url.startsWith('webcal'))) {
            let fetchUrl = url;
            if (url.startsWith('webcal://')) {
                fetchUrl = url.replace('webcal://', 'https://');
            }

            localStorage.setItem('residate-ical-url', fetchUrl);
            localStorage.setItem('residate-gcal-connected', 'true');
            setIsGCalConnected(true);
            syncCalendar();
            setShowGCalModal(false);
        } else {
            alert("URL inválida. Asegúrate de copiar la dirección secreta en formato iCal.");
        }
    };
    // END NEW GCAL LOGIC

    return (
        <>
            {/* 
              MODALES USANDO PORTAL
              Se renderizan directamente en el body para evitar problemas de z-index o overflow con contenedores padres
            */}

            {showGCalModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" style={{ isolation: 'isolate' }}>
                    <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-md p-8 space-y-6 animate-in zoom-in-95 duration-200 relative" onClick={e => e.stopPropagation()}>
                        <div className="space-y-2 text-center">
                            <h3 className="font-serif text-2xl text-navy">Sincronizar Google Calendar</h3>
                            <p className="text-sm text-slate-500">
                                Pega tu "Dirección privada en formato iCal" para sincronizar tus eventos automáticamente.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-slate-500 font-bold">URL de iCal (Termina en .ics)</label>
                            <input
                                type="text"
                                value={icalUrlInput}
                                onChange={(e) => setIcalUrlInput(e.target.value)}
                                placeholder="https://calendar.google.com/calendar/ical/..."
                                className="w-full p-3 border border-slate-200 bg-slate-50 rounded-md focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-sm text-navy"
                                autoFocus
                            />
                            <p className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded">
                                Tip: Ve a Configuración de GCal {">"} Tu Calendario {">"} Integrar calendario {">"} Dirección secreta en formato iCal.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button onClick={() => setShowGCalModal(false)} variant="outline" className="flex-1 h-10 border-slate-200">Cancelar</Button>
                            <Button onClick={handleConfirmGCal} className="flex-1 bg-navy text-white h-10 hover:bg-navy/90 shadow-md">
                                {isSyncing ? "Verificando..." : "Conectar Calendario"}
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showBlockModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" style={{ isolation: 'isolate' }}>
                    <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-sm p-6 space-y-4 animate-in zoom-in-95 duration-200 relative" onClick={e => e.stopPropagation()}>
                        <h3 className="font-serif text-lg text-navy">
                            {selectedSlot && getSlot(currentBusinessId, selectedSlot.day, selectedSlot.hour) ? 'Editar Bloqueo' : 'Nuevo Bloqueo'}
                        </h3>
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-slate-500">Motivo (ej. Comida, Médico)</label>
                            <input
                                type="text"
                                value={blockReason}
                                onChange={(e) => setBlockReason(e.target.value)}
                                className="w-full p-2 border border-slate-200 bg-slate-50 rounded-md focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-navy"
                                autoFocus
                                placeholder="Escribe aquí..."
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button onClick={() => setShowBlockModal(false)} variant="outline" className="flex-1">Cancelar</Button>
                            {selectedSlot && getSlot(currentBusinessId, selectedSlot.day, selectedSlot.hour) && (
                                <Button
                                    onClick={handleDeleteBlock}
                                    variant="outline"
                                    className="flex-none bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                                >
                                    Desbloquear
                                </Button>
                            )}
                            <Button onClick={handleCreateBlock} className="flex-1 bg-navy text-white">Guardar</Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* CONTENEDOR PRINCIPAL DEL CALENDARIO */}
            <div className="bg-white border shadow-sm animate-in fade-in duration-700 relative z-0">
                {/* Calendar Header with Navigation */}
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-serif text-navy">Agenda Semanal</h2>
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-serif text-gold uppercase tracking-wide">
                                {weekRangeString}
                            </h3>
                            {/* Live Clock Small */}
                            <span className="text-[10px] text-slate-400 font-mono border-l pl-3 border-slate-200">
                                {clockString}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-end md:self-auto">
                        <Button
                            onClick={handleStartGCalConnect}
                            variant="outline"
                            size="sm"
                            className={`px-3 gap-2 ${isGCalConnected ? 'bg-green-50 text-green-700 border-green-200' : ''}`}
                        >
                            <div className={`h-2 w-2 rounded-full ${isGCalConnected ? 'bg-green-500' : 'bg-slate-300'}`} />
                            {isGCalConnected ? 'GCal Conectado' : 'Conectar GCal'}
                        </Button>
                        <div className="h-4 w-px bg-slate-200 mx-1" />
                        <Button onClick={handlePrevWeek} variant="outline" size="sm" className="px-2"><ChevronLeft className="h-4 w-4" /></Button>
                        <Button onClick={handleNextWeek} variant="outline" size="sm" className="px-2"><ChevronRight className="h-4 w-4" /></Button>
                        <Button onClick={() => setShowBlockModal(true)} size="sm" className="bg-navy text-white hover:bg-navy/90">Nuevo Bloqueo</Button>
                    </div>
                </div>

                {/* Mobile Day Selector */}
                <div className="flex bg-cream border-b md-hidden overflow-x-auto no-scrollbar">
                    {weekDays.map((day, idx) => (
                        <button
                            key={idx}
                            onClick={() => setMobileDayIndex(idx)}
                            className={cn(
                                "flex-1 min-w-80 py-4 flex flex-col items-center justify-center border-r border-navy/5 transition-all",
                                mobileDayIndex === idx ? "bg-navy text-white" : "text-navy hover:bg-navy/5"
                            )}
                        >
                            <span className="uppercase tracking-widest text-[9px] font-bold opacity-60">{day.name}</span>
                            <span className="text-lg font-serif">{day.date}</span>
                        </button>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-2 md-grid-cols-8 divide-x overflow-x-hidden">
                    {/* Time Column */}
                    <div className="col-span-1 bg-cream border-r">
                        <div className="h-14 border-b flex items-center justify-center text-[10px] uppercase tracking-widest opacity-40 font-bold">GMT</div>
                        {HOURS.map(hour => (
                            <div key={hour} className="h-24 flex items-center justify-center text-xs opacity-60 font-medium font-serif border-b border-dashed text-navy">
                                {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                            </div>
                        ))}
                    </div>

                    {/* Days Columns */}
                    {weekDays.map((day, index) => {
                        // Verificar si es el día actual para resaltarlo
                        const isToday = day.date === now.getDate() && day.fullDate.getMonth() === now.getMonth() && day.fullDate.getFullYear() === now.getFullYear();

                        return (
                            <div
                                key={index}
                                className={cn(
                                    "col-span-1 min-w-0 md-min-w-100",
                                    isToday ? 'bg-navy/5' : '',
                                    mobileDayIndex !== index && "hidden md-block"
                                )}
                            >
                                <div className={cn(
                                    "h-14 flex flex-col items-center justify-center border-b font-serif text-navy hidden md-flex",
                                    isToday ? 'bg-navy text-white' : 'bg-cream'
                                )}>
                                    <span className="uppercase tracking-wider text-[10px] font-bold">{day.name}</span>
                                    <span className="text-lg leading-none">{day.date}</span>
                                </div>

                                <div>
                                    {HOURS.map(hour => {
                                        const dayKey = day.dayKey;
                                        const slot = getSlot(currentBusinessId, dayKey, hour);

                                        return (
                                            <div
                                                key={`${dayKey}-${hour}`}
                                                onClick={() => handleSlotClick(index, hour)}
                                                className={cn(
                                                    "h-24 border-b border-dashed p-1 transition-all cursor-pointer relative group",
                                                    !slot && "hover:bg-gold/10"
                                                )}
                                            >
                                                {/* Indicador de hora actual si es visible en esta semana */}
                                                {isToday && hour === now.getHours() && (
                                                    <div
                                                        className="absolute w-full border-t-2 border-red-500 z-10 pointer-events-none flex items-center"
                                                        style={{ top: `${(now.getMinutes() / 60) * 100}%` }}
                                                    >
                                                        <div className="h-2 w-2 rounded-full bg-red-500 -ml-1"></div>
                                                    </div>
                                                )}

                                                {slot ? (
                                                    <div className={cn(
                                                        "h-full w-full p-2 flex flex-col justify-between border-l-2 shadow-sm text-xs animate-in zoom-in-95 duration-200",
                                                        slot.status === "booked" && "bg-white border-navy text-navy",
                                                        slot.status === "pending" && "bg-gold/10 border-gold text-navy",
                                                        slot.status === "blocked" && "bg-slate-100 border-slate-400 opacity-80",
                                                    )}>
                                                        {slot.status === "blocked" ? (
                                                            <>
                                                                <div className="flex items-center gap-1 font-bold text-slate-600">
                                                                    <Lock className="h-3 w-3" />
                                                                    {/* Show the service (reason) as the main title if available, otherwise generic */}
                                                                    <span className="truncate">
                                                                        {slot.service || (slot.clientName === "Google Calendar" ? "GCal Event" : "Ocupado")}
                                                                    </span>
                                                                </div>
                                                                <span className="opacity-70 truncate italic text-[10px]">
                                                                    {slot.clientName === "Google Calendar" ? "Google Calendar" : "Bloqueo Personal"}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="font-bold font-serif truncate flex items-center gap-1">
                                                                    {slot.isVIP && <span className="text-gold">★</span>}
                                                                    {slot.clientName || 'Booked'}
                                                                </div>
                                                                <span className="opacity-70 truncate italic">{slot.service || 'Appointment'}</span>
                                                                <div className="flex justify-between items-end mt-1">
                                                                    <span className="text-[10px] opacity-50">{hour}:00</span>
                                                                    {slot.status === "pending" && <span className="bg-gold text-white px-1.5 py-0.5 text-[10px] uppercase tracking-wider rounded-sm">Review</span>}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="h-6 w-6 rounded-full bg-navy/10 flex items-center justify-center text-navy text-xs">+</div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
