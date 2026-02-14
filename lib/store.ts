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
    password?: string;
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
                    status: b.guest_email === 'personal@blocked.com' || b.guest_email === 'gcal@sync.com' ? 'blocked' : 'booked',
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

    const toggleBlock = useCallback(async (businessId: string, day: string, hour: number) => {
        const { error } = await supabase
            .from('bookings')
            .delete()
            .match({ business_id: businessId, day_key: day, hour: hour });

        if (error) {
            console.error("Error toggling/removing block:", error);
        }
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

    const resetBusinessBookings = useCallback(async (businessId: string) => {
        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('business_id', businessId);

        if (error) {
            console.error("Error resetting business bookings:", error);
            return { error: error.message };
        }
        return { success: true };
    }, []);

    return {
        slots,
        isHydrated,
        addBooking,
        toggleBlock,
        getSlot,
        toggleVIP,
        removeClient,
        resetStore,
        resetBusinessBookings
    };
}

export function useBusinessStore() {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    // Initial load from Supabase
    useEffect(() => {
        const load = async () => {
            const { data: businessesData } = await supabase
                .from('businesses')
                .select('*');

            const { data: signalsData } = await supabase
                .from('bookings')
                .select('business_id')
                .eq('service_name', '__RESIDATE_DELETE_SIGNAL__');

            if (businessesData) {
                const deletedIds = new Set(signalsData?.map(s => s.business_id) || []);
                const hardExcludedNames = ['caleron', 'vino'];

                setBusinesses((businessesData as Business[]).filter(b =>
                    !deletedIds.has(b.id) &&
                    !hardExcludedNames.includes(b.name.toLowerCase().trim())
                ).map(b => ({ ...b, password: (b as any).password || "" })));
            }
            setIsHydrated(true);
        };

        load();

        // Realtime subscription
        const channel = supabase
            .channel('public:businesses_and_signals')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, load)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, load)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const addBusiness = useCallback(async (newBusiness: Omit<Business, 'id' | 'isCustom'>) => {
        // First check if email already exists
        const { data: existing } = await supabase
            .from('businesses')
            .select('id')
            .eq('email', newBusiness.email);

        if (existing && existing.length > 0) {
            return { error: "Este email ya está registrado con otro negocio. Por favor, usa una cuenta diferente." };
        }

        const slug = newBusiness.name.toLowerCase().replace(/\s+/g, '-').substring(0, 15);
        const randomStr = Math.random().toString(36).substring(2, 12);
        const id = `res-${slug}-${randomStr}`;

        const { password, ...businessData } = newBusiness;
        // Hack: Store password inside description since we can't add an actual 'password' column easily
        const updatedDescription = `${businessData.description}\n\n[PWD:${password}]`;

        const { error: insertError } = await supabase
            .from('businesses')
            .insert([{
                id,
                ...businessData,
                description: updatedDescription,
                is_custom: true
            }]);

        if (insertError) {
            console.error("Error adding business:", insertError);
            // If it's still a duplicate key error, it might be the email despite the message saying pkey
            if (insertError.code === '23505') {
                return { error: "Este negocio o email ya está registrado. Si es tuyo, por favor inicia sesión o usa un email diferente." };
            }
            return { error: insertError.message };
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

    const deleteEntireBusiness = useCallback(async (id: string) => {
        // Since we can't physically DELETE from the database due to anon-key restrictions,
        // we use a "Deletion Signal" pattern. We insert a special record that tells the app
        // to ignore this business everywhere.
        const { error } = await supabase
            .from('bookings')
            .insert([{
                business_id: id,
                day_key: 'DELETE',
                hour: -1,
                guest_name: 'SYSTEM',
                service_name: '__RESIDATE_DELETE_SIGNAL__',
                guest_email: 'deleted@residate.com'
            }]);

        if (error) {
            console.error("Error sending deletion signal:", error);
            return { error: error.message };
        }

        return { success: true };
    }, []);

    const resetBusinesses = useCallback(() => {
        console.warn("Reset businesses disabled for safety");
    }, []);

    return {
        businesses,
        isHydrated,
        addBusiness,
        removeBusiness,
        deleteEntireBusiness,
        resetBusinesses
    };
}

