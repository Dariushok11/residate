"use client";

import { Button } from "@/components/ui/button";
import { X, Calendar as CalendarIcon, Clock, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { useSearchParams } from 'next/navigation';
import { cn } from "@/lib/utils";
import { useBookingStore, useBusinessStore } from "@/lib/store";

// Helper to convert time string to number
const timeToHour = (time: string) => {
    const [t, period] = time.split(' ');
    let [h] = t.split(':').map(Number);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h;
};

import { Suspense } from "react";

function BookingContent() {
    const searchParams = useSearchParams();
    const urlId = searchParams.get('id');

    const [step, setStep] = React.useState<"service" | "date" | "confirm" | "success">("service");
    const [selectedService, setSelectedService] = React.useState<string | null>(null);
    const [selectedTime, setSelectedTime] = React.useState<string | null>(null);
    const [currentDate, setCurrentDate] = React.useState(new Date()); // State for navigation
    const [guestEmail, setGuestEmail] = React.useState("");
    const [businessId, setBusinessId] = React.useState<string>(urlId || "");

    const { addBooking, getSlot, isHydrated, resetStore } = useBookingStore();
    const { businesses } = useBusinessStore();

    const [businessName, setBusinessName] = React.useState<string>("The Sanctuary");
    const [availableServices, setAvailableServices] = React.useState<any[]>([
        { id: "1", name: "Signature Facial", duration: 60, price: 150 },
        { id: "2", name: "Deep Tissue Massage", duration: 90, price: 220 },
        { id: "3", name: "Wellness Consultation", duration: 45, price: 120 },
    ]);

    React.useEffect(() => {
        const savedName = localStorage.getItem('registered_business_name');

        // 1. Check if the businessId matches a stored business
        if (businessId) {
            const matched = businesses.find(b => b.id === businessId);
            if (matched) {
                setBusinessName(matched.name);
                if (matched.services && matched.services.length > 0) {
                    setAvailableServices(matched.services);
                }
                return;
            }
        }

        // 2. If no specific businessId from URL, try to align with the Main Dashboard (which uses businesses[0])
        if (!urlId && businesses.length > 0) {
            setBusinessId(businesses[0].id);
            setBusinessName(businesses[0].name);
            if (businesses[0].services && businesses[0].services.length > 0) {
                setAvailableServices(businesses[0].services);
            }
        } else if (savedName) {
            // 3. Fallback to local storage name if businesses store is empty (edge case)
            setBusinessName(savedName);
            if (!businessId) {
                setBusinessId(savedName.toLowerCase().replace(/\s+/g, '-'));
            }
        }
    }, [businesses, businessId, urlId]);

    const currentService = availableServices.find(s => s.id === selectedService);

    // Only show generic slots for the prototype "Friday"
    // Updated slots to cover 8 AM to 8 PM (20:00)
    const timeSlots = [
        "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
        "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
        "6:00 PM", "7:00 PM", "8:00 PM"
    ];

    const handleBooking = () => {
        if (!selectedService || !selectedTime) return;
        const currentService = availableServices.find(s => s.id === selectedService);
        const serviceName = currentService?.name || "Service";
        const hour = timeToHour(selectedTime);
        const dayKey = currentDate.toLocaleDateString('en-US', { weekday: 'short' });

        // Uses the currently selected business ID and dynamic day
        addBooking(businessId, dayKey, hour, "Guest User", serviceName, guestEmail);
        setStep("success");
    };

    // We bypass the hydration check for the prototype to ensure immediate rendering
    // if (!isHydrated) return <div className="min-h-screen flex items-center justify-center font-serif">Loading Ledger...</div>;

    return (
        <div className="flex min-h-screen items-center justify-center bg-cream p-4">
            <div className="w-full max-w-2xl bg-white shadow-2xl border flex flex-col md-flex-row h-600 overflow-hidden">

                {/* Summary Sidebar */}
                <div className="w-full md-w-1-3 bg-navy p-8 text-white flex flex-col justify-between">
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-serif text-white mb-2">Your Booking</h2>
                            <div className="h-px w-8 bg-gold opacity-50"></div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <p className="text-slate text-xs uppercase tracking-widest opacity-60 mb-1">Business</p>
                                <div className="flex items-center justify-between">
                                    <p className="font-medium text-lg text-white">
                                        {businessName}
                                    </p>
                                </div>
                            </div>
                            {selectedService && (
                                <div className="animate-in fade-in">
                                    <p className="text-slate text-xs uppercase tracking-widest opacity-60 mb-1">Experience</p>
                                    <p className="font-medium text-lg text-gold">{currentService?.name}</p>
                                </div>
                            )}
                            {selectedTime && (
                                <div className="space-y-4 animate-in fade-in">
                                    <p className="text-slate text-xs uppercase tracking-widest opacity-60 mb-1">Time</p>
                                    <p className="font-medium text-lg text-white">{selectedTime}</p>
                                    <p className="text-sm opacity-80 text-white italic">{currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <button
                            onClick={() => {
                                resetStore();
                                window.location.reload();
                            }}
                            className="text-[10px] uppercase tracking-widest opacity-20 hover:opacity-100 transition-opacity bg-transparent border-none text-white cursor-pointer"
                        >
                            Reset Ledger
                        </button>
                        <div className="text-[10px] uppercase tracking-widest opacity-30">ReservaPro Platform</div>
                    </div>
                </div>

                {/* Interaction Area */}
                <div className="flex-1 p-8 md-p-12 relative overflow-y-auto">
                    {/* Botón Cerrar */}
                    <button
                        onClick={() => window.history.back()}
                        className="absolute right-8 top-8 text-slate hover:text-navy transition-colors z-20 bg-transparent border-none p-0 cursor-pointer"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    {/* Steps */}
                    {step === "service" && (
                        <div className="space-y-8 animate-in fade-in">
                            <div>
                                <h3 className="text-3xl font-serif text-navy">Select Experience</h3>
                                <p className="text-slate mt-1">Choose from our curated menu.</p>
                            </div>
                            <div className="space-y-3">
                                {availableServices.map(service => (
                                    <div
                                        key={service.id}
                                        onClick={() => setSelectedService(service.id)}
                                        className={cn(
                                            "p-5 border cursor-pointer transition-all hover:bg-cream flex justify-between items-center group",
                                            selectedService === service.id ? "border-navy bg-navy-muted" : "border-gray-200"
                                        )}
                                    >
                                        <div>
                                            <h4 className="font-serif text-xl group-hover:text-navy transition-colors">{service.name}</h4>
                                            <p className="text-sm text-slate">{service.duration} min</p>
                                        </div>
                                        <span className="font-medium text-navy text-lg">${service.price}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-6 flex justify-end">
                                <Button onClick={() => setStep("date")} disabled={!selectedService} size="lg">Next: Availability</Button>
                            </div>
                        </div>
                    )}

                    {step === "date" && (
                        <div className="space-y-8 animate-in fade-in">
                            <div className="flex items-center justify-between">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const newDate = new Date(currentDate);
                                        newDate.setDate(newDate.getDate() - 1);
                                        // Prevent going to past dates
                                        if (newDate >= new Date(new Date().setHours(0, 0, 0, 0))) {
                                            setCurrentDate(newDate);
                                            setSelectedTime(null);
                                        }
                                    }}
                                    disabled={currentDate <= new Date(new Date().setHours(0, 0, 0, 0))}
                                    className="text-navy hover:bg-navy/10"
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </Button>

                                <div className="text-center">
                                    <h3 className="text-3xl font-serif text-navy">Availability</h3>
                                    <p className="text-slate mt-1 italic capitalize">
                                        {new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(currentDate)}
                                    </p>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const newDate = new Date(currentDate);
                                        newDate.setDate(newDate.getDate() + 1);
                                        setCurrentDate(newDate);
                                        setSelectedTime(null);
                                    }}
                                    className="text-navy hover:bg-navy/10"
                                >
                                    <ChevronRight className="h-6 w-6" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {timeSlots.map(time => {
                                    const hour = (function (t) {
                                        const [timePart, period] = t.split(' ');
                                        let [h] = timePart.split(':').map(Number);
                                        if (period === 'PM' && h !== 12) h += 12;
                                        if (period === 'AM' && h === 12) h = 0;
                                        return h;
                                    })(time);

                                    // Get day key properly (e.g., "Fri") for generic match or date specific
                                    const dayKey = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
                                    const slot = getSlot(businessId, dayKey, hour);
                                    const isAvailable = !slot;

                                    return (
                                        <button
                                            key={time}
                                            onClick={() => isAvailable && setSelectedTime(time)}
                                            disabled={!isAvailable}
                                            className={cn(
                                                "py-5 border text-sm font-medium transition-all flex flex-col items-center justify-center gap-1",
                                                isAvailable
                                                    ? (selectedTime === time ? "bg-navy text-white border-navy" : "border-gray-200 text-navy hover:border-navy")
                                                    : "bg-slate-50 border-slate-100 cursor-not-allowed opacity-70"
                                            )}
                                        >
                                            <span className={cn(
                                                selectedTime === time ? "text-white" : "text-navy",
                                                !isAvailable && "text-slate-400 line-through decoration-slate-300"
                                            )}>{time}</span>
                                            {!isAvailable && (
                                                <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-full">
                                                    Ocupado
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>


                            <div className="pt-8 flex justify-between items-center">
                                <button onClick={() => setStep("service")} className="btn-link">Back to Services</button>
                                <Button onClick={() => setStep("confirm")} disabled={!selectedTime} size="lg">Confirm Details</Button>
                            </div>
                        </div>
                    )}

                    {step === "confirm" && (
                        <div className="space-y-8 animate-in fade-in mt-4">
                            <div>
                                <h3 className="text-3xl font-serif text-navy">Secure Booking</h3>
                                <p className="text-slate mt-1">Please confirm your appointment details.</p>
                            </div>

                            <div className="bg-cream p-8 border border-navy/10 rounded-sm space-y-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate uppercase tracking-widest">Service Fee</span>
                                    <span className="font-medium text-navy text-lg">${currentService?.price || 0}.00</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate uppercase tracking-widest">Processing & Tax</span>
                                    <span className="font-medium text-navy text-lg">${Math.round((currentService?.price || 0) * 0.08)}.00</span>
                                </div>
                                <div className="h-px bg-navy/10"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xl font-serif text-navy">Total Value</span>
                                    <span className="text-2xl font-bold text-gold">${(currentService?.price || 0) + Math.round((currentService?.price || 0) * 0.08)}.00</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-medium text-navy uppercase tracking-widest">Guest Contact Email</label>
                                <input
                                    type="email"
                                    placeholder="guest@example.com"
                                    className="w-full text-lg p-4 bg-cream border border-navy/10 focus:outline-none focus:border-navy transition-all"
                                    value={guestEmail}
                                    onChange={(e) => setGuestEmail(e.target.value)}
                                />
                            </div>

                            <div className="pt-4 flex items-center gap-8">
                                <button onClick={() => setStep("date")} className="btn-link">Edit Time</button>
                                <Button className="flex-1" onClick={handleBooking} disabled={!guestEmail} size="lg">Finalize Booking</Button>
                            </div>
                        </div>
                    )}

                    {step === "success" && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95">
                            <div className="h-24 w-24 rounded-full bg-green-50 flex items-center justify-center text-green-800 border-2 border-green-100">
                                <CheckCircle2 className="h-12 w-12" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-4xl font-serif text-navy">Confirmed.</h3>
                                <p className="text-slate text-lg">A confirmation has been sent to your registry.</p>
                            </div>
                            <Button variant="outline" className="mt-8 px-12" onClick={() => window.location.href = "/"} size="lg">Return to Sanctuary</Button>
                        </div>
                    )}

                </div>
            </div>
        </div >
    );
}

export default function BookingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-serif text-navy">Loading Concierge...</div>}>
            <BookingContent />
        </Suspense>
    );
}
