import BookingClient from "./BookingClient";
import type { Metadata, ResolvingMetadata } from 'next';
import { supabase } from "@/lib/supabase";

type Props = {
    searchParams: { id?: string | string[] };
};

// Generación de metadatos SEO dinámicos para Google basados en el ID del negocio
export async function generateMetadata(
    { searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const id = typeof searchParams.id === 'string'
        ? searchParams.id
        : Array.isArray(searchParams.id) ? searchParams.id[0] : null;

    if (!id) {
        return {
            title: "Reservar Experiencia | ResiDate",
            description: "Elige tu servicio o destino y reserva al instante en ResiDate, la plataforma de citas más exclusiva e inteligente.",
        };
    }

    try {
        const { data, error } = await supabase
            .from('businesses')
            .select('name, category, location, description')
            .eq('id', id)
            .single();

        if (data) {
            return {
                title: `Reservar cita en ${data.name} | ResiDate`,
                description: data.description && data.description.length > 10
                    ? data.description.substring(0, 150) + '...'
                    : `Asegura al instante tu reserva en ${data.name}, un centro premium de ${data.category} en ${data.location}. Usa el sistema Smart Reserve™ de ResiDate.`,
                openGraph: {
                    title: `Cita en ${data.name} | ResiDate`,
                    description: `Agenda tu cita exclusiva de ${data.category} en ${data.location}.`,
                    type: "website",
                    siteName: "ResiDate",
                },
                keywords: [data.name, data.category, data.location, "reservar cita", "reservas online", "ResiDate"],
            };
        }
    } catch (err) {
        console.error("SEO Metadata Error:", err);
    }

    return {
        title: "Reservar Destino | ResiDate",
        description: "Encuentra tu centro ideal y asegura tu fecha.",
    };
}

// Embalamos el componente interactivo (Client Component) dentro de este contenedor SSR
export default function BookPageWrapper() {
    return <BookingClient />;
}
