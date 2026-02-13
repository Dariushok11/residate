import { BusinessCalendar } from "@/components/dashboard/BusinessCalendar";

export default function CalendarPage() {
    return (
        <div className="max-w-[1400px] mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-serif text-[var(--text-primary)]">Availability Ledger</h1>
                <p className="text-[var(--text-secondary)]">Manage your appointments and block out personal time.</p>
            </div>

            <BusinessCalendar />
        </div>
    );
}
