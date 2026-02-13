"use client";

import { useState, useEffect, useCallback } from 'react';

// Types
export type SlotStatus = "available" | "booked" | "blocked" | "pending";

export interface BusinessService {
    id: string;
    name: string;
    price: number;
    duration: number; // in minutes
}

export interface BookingSlot {
    id: string;
    businessId: string;
    day: string;
    hour: number;
    status: SlotStatus;
    clientName?: string;
    clientEmail?: string;
    service?: string;
    timestamp: number;
    isVIP?: boolean;
}

export interface Business {
    id: string;
    name: string;
    location: string;
    category: string;
    description: string;
    email: string;
    services: BusinessService[];
    isCustom?: boolean;
}

const STORAGE_KEY = 'reserva-pro-slots';
const BUSINESS_STORAGE_KEY = 'reserva-pro-businesses';

const INITIAL_SLOTS: BookingSlot[] = [];

export function useBookingStore() {
    const [slots, setSlots] = useState<BookingSlot[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    // Simplified hydration to prevent stuck loading screens
    useEffect(() => {
        setIsHydrated(true);
        if (typeof window === 'undefined') return;

        const load = () => {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    // Filter out any legacy data without businessId to prevent "ghost" bookings
                    const cleaned = parsed.filter((s: any) => s.businessId);
                    setSlots(cleaned.length > 0 ? cleaned : INITIAL_SLOTS);
                    if (cleaned.length === 0) {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SLOTS));
                    }
                } else {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SLOTS));
                    setSlots(INITIAL_SLOTS);
                }
            } catch (e) {
                console.error("Store error:", e);
                setSlots(INITIAL_SLOTS);
            }
        };

        load();

        // Listen for storage events (cross-tab sync)
        const storageHandler = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    setSlots(parsed);
                } catch (err) { }
            }
        };

        // Listen for custom events (same-tab sync)
        const customHandler = ((e: CustomEvent) => {
            if (e.detail?.key === STORAGE_KEY && e.detail?.value) {
                try {
                    setSlots(e.detail.value);
                } catch (err) { }
            }
        }) as EventListener;

        window.addEventListener('storage', storageHandler);
        window.addEventListener('localStorageUpdate', customHandler);

        return () => {
            window.removeEventListener('storage', storageHandler);
            window.removeEventListener('localStorageUpdate', customHandler);
        };
    }, []);

    const save = useCallback((newSlots: BookingSlot[]) => {
        setSlots(newSlots);
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newSlots));
                // Dispatch custom event for same-tab sync
                window.dispatchEvent(new CustomEvent('localStorageUpdate', {
                    detail: { key: STORAGE_KEY, value: newSlots }
                }));
            } catch (e) { }
        }
    }, []);

    const toggleBlock = useCallback((businessId: string, day: string, hour: number) => {
        setSlots(prev => {
            const next = [...prev];
            const idx = next.findIndex(s => s.businessId === businessId && s.day === day && s.hour === hour);
            if (idx >= 0) {
                next.splice(idx, 1);
            } else {
                next.push({
                    id: Math.random().toString(36).substring(2, 9),
                    businessId,
                    day,
                    hour,
                    status: "blocked",
                    timestamp: Date.now()
                });
            }
            // Guardamos asíncronamente para no bloquear el renderizado
            setTimeout(() => {
                if (typeof window !== 'undefined') {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                }
            }, 0);
            return next;
        });
    }, []);

    const getSlot = useCallback((businessId: string, day: string, hour: number) => {
        return slots.find(s => s.businessId === businessId && s.day === day && s.hour === hour);
    }, [slots]);

    const addBooking = useCallback((businessId: string, day: string, hour: number, clientName: string, service: string, clientEmail?: string, status: 'booked' | 'blocked' | 'pending' = 'booked') => {
        setSlots(prev => {
            const next = [...prev];
            // Remove existing slot at same time if any (overwrite)
            const idx = next.findIndex(s => s.businessId === businessId && s.day === day && s.hour === hour);
            if (idx >= 0) {
                next.splice(idx, 1);
            }

            next.push({
                id: `${businessId}-${day}-${hour}-${Date.now()}`,
                businessId,
                day,
                hour,
                status,
                clientName,
                clientEmail,
                service,
                timestamp: Date.now()
            });

            setTimeout(() => {
                if (typeof window !== 'undefined') {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                    // Dispatch custom event for same-tab sync
                    window.dispatchEvent(new CustomEvent('localStorageUpdate', {
                        detail: { key: STORAGE_KEY, value: next }
                    }));
                }
            }, 0);
            return next;
        });
    }, []);

    const toggleVIP = useCallback((clientEmail: string) => {
        setSlots(prev => {
            const next = prev.map(slot => {
                if (slot.clientEmail === clientEmail) {
                    return { ...slot, isVIP: !slot.isVIP };
                }
                return slot;
            });
            setTimeout(() => {
                if (typeof window !== 'undefined') {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                }
            }, 0);
            return next;
        });
    }, []);

    const removeClient = useCallback((clientEmail: string) => {
        setSlots(prev => {
            const next = prev.filter(slot => slot.clientEmail !== clientEmail);
            setTimeout(() => {
                if (typeof window !== 'undefined') {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                }
            }, 0);
            return next;
        });
    }, []);

    const resetStore = useCallback(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SLOTS));
            setSlots(INITIAL_SLOTS);
        }
    }, []);

    return {
        slots,
        isHydrated,
        addBooking,
        toggleBlock,
        getSlot,
        toggleVIP,
        removeClient,
        resetStore
    };
}

export function useBusinessStore() {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
        if (typeof window === 'undefined') return;

        const load = () => {
            try {
                const stored = localStorage.getItem(BUSINESS_STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setBusinesses(parsed);
                }
            } catch (e) {
                console.error("Business store error:", e);
            }
        };

        load();

        // Listen for storage events (cross-tab sync)
        const storageHandler = (e: StorageEvent) => {
            if (e.key === BUSINESS_STORAGE_KEY && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    setBusinesses(parsed);
                } catch (err) { }
            }
        };

        // Listen for custom events (same-tab sync)
        const customHandler = ((e: CustomEvent) => {
            if (e.detail?.key === BUSINESS_STORAGE_KEY && e.detail?.value) {
                try {
                    setBusinesses(e.detail.value);
                } catch (err) { }
            }
        }) as EventListener;

        window.addEventListener('storage', storageHandler);
        window.addEventListener('localStorageUpdate', customHandler);

        return () => {
            window.removeEventListener('storage', storageHandler);
            window.removeEventListener('localStorageUpdate', customHandler);
        };
    }, []);

    const addBusiness = useCallback((newBusiness: Omit<Business, 'id' | 'isCustom'>) => {
        // Check if email already exists
        const exists = businesses.some(b => b.email && b.email.toLowerCase() === newBusiness.email.toLowerCase());
        if (exists) {
            return { error: "This email is already associated with a sanctuary." };
        }

        const business: Business = {
            ...newBusiness,
            id: newBusiness.name.toLowerCase().replace(/\s+/g, '-'),
            isCustom: true
        };

        setBusinesses(prev => {
            const next = [...prev, business];
            if (typeof window !== 'undefined') {
                localStorage.setItem(BUSINESS_STORAGE_KEY, JSON.stringify(next));
                // Dispatch custom event for same-tab sync
                window.dispatchEvent(new CustomEvent('localStorageUpdate', {
                    detail: { key: BUSINESS_STORAGE_KEY, value: next }
                }));
            }
            return next;
        });

        return { id: business.id };
    }, [businesses]);

    const removeBusiness = useCallback((id: string) => {
        setBusinesses(prev => {
            const next = prev.filter(b => b.id !== id);
            if (typeof window !== 'undefined') {
                localStorage.setItem(BUSINESS_STORAGE_KEY, JSON.stringify(next));
                // Dispatch custom event for same-tab sync
                window.dispatchEvent(new CustomEvent('localStorageUpdate', {
                    detail: { key: BUSINESS_STORAGE_KEY, value: next }
                }));
            }
            return next;
        });
    }, []);

    const resetBusinesses = useCallback(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(BUSINESS_STORAGE_KEY, JSON.stringify([]));
            setBusinesses([]);
        }
    }, []);

    return {
        businesses,
        isHydrated,
        addBusiness,
        removeBusiness,
        resetBusinesses
    };
}
