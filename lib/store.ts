import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

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

    // Load from Supabase
    useEffect(() => {
        const load = async () => {
            const { data, error } = await supabase
                .from('bookings')
                .select('*');

            if (data) {
                const mapped: BookingSlot[] = data.map(b => ({
                    id: b.id,
                    businessId: b.business_id,
                    day: b.day_key,
                    hour: b.hour,
                    status: 'booked', // Simplified for prototype
                    clientName: b.guest_name,
                    clientEmail: b.guest_email,
                    service: b.service_name,
                    timestamp: new Date(b.created_at).getTime()
                }));
                setSlots(mapped);
            }
            setIsHydrated(true);
        };

        load();

        // Realtime subscription
        const channel = supabase
            .channel('public:bookings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, load)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const getSlot = useCallback((businessId: string, day: string, hour: number) => {
        return slots.find(s => s.businessId === businessId && s.day === day && s.hour === hour);
    }, [slots]);

    const addBooking = useCallback(async (businessId: string, day: string, hour: number, clientName: string, service: string, clientEmail?: string) => {
        const { error } = await supabase
            .from('bookings')
            .insert([{
                business_id: businessId,
                day_key: day,
                hour: hour,
                guest_name: clientName,
                service_name: service,
                guest_email: clientEmail
            }]);

        if (error) console.error("Error adding booking:", error);
    }, []);

    const toggleBlock = useCallback((businessId: string, day: string, hour: number) => {
        // Blocks are not yet fully implemented in Supabase for the prototype
        console.warn("Toggle block not yet synced with cloud");
    }, []);

    const toggleVIP = useCallback((clientEmail: string) => {
        // VIP status not yet fully implemented in Supabase
    }, []);

    const removeClient = useCallback(async (clientEmail: string) => {
        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('guest_email', clientEmail);
        if (error) console.error("Error removing client:", error);
    }, []);

    const resetStore = useCallback(async () => {
        // Resetting the whole database is protected
        console.warn("Reset store disabled for safety");
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

    // Initial load from Supabase
    useEffect(() => {
        const load = async () => {
            const { data, error } = await supabase
                .from('businesses')
                .select('*');

            if (data) {
                setBusinesses(data as Business[]);
            }
            setIsHydrated(true);
        };

        load();

        // Realtime subscription
        const channel = supabase
            .channel('public:businesses')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, load)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const addBusiness = useCallback(async (newBusiness: Omit<Business, 'id' | 'isCustom'>) => {
        const id = newBusiness.name.toLowerCase().replace(/\s+/g, '-');

        const { error } = await supabase
            .from('businesses')
            .insert([{
                id,
                ...newBusiness,
                is_custom: true
            }]);

        if (error) {
            console.error("Error adding business:", error);
            return { error: error.message };
        }

        return { id };
    }, []);

    const removeBusiness = useCallback(async (id: string) => {
        const { error } = await supabase
            .from('businesses')
            .delete()
            .eq('id', id);

        if (error) console.error("Error removing business:", error);
    }, []);

    const resetBusinesses = useCallback(() => {
        console.warn("Reset businesses disabled for safety");
    }, []);

    return {
        businesses,
        isHydrated,
        addBusiness,
        removeBusiness,
        resetBusinesses
    };
}

