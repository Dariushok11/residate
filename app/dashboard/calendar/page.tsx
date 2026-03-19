import { BusinessCalendar } from "@/components/dashboard/BusinessCalendar";

export default function CalendarPage() {
    return (
        <div className="max-w-[1400px] mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-serif text-[var(--text-primary)]">Libro de Disponibilidad</h1>
                <p className="text-[var(--text-secondary)]">Gestiona tus citas y bloquea tiempo personal.</p>
            </div>

            <BusinessCalendar />
        </div>
    );
}
