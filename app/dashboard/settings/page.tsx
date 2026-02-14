"use client";

import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Bell, Shield, Palette, Globe, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore, useBusinessStore } from "@/lib/store";

const SETTINGS_STORAGE_KEY = 'residate-settings';

interface UserSettings {
    fullName: string;
    email: string;
    darkMode: boolean;
    highContrast: boolean;
    notifications: boolean;
    emailNotifications: boolean;
    twoFactorEnabled: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
    fullName: "Elena Rodriguez",
    email: "elena.r@luxury.com",
    darkMode: true,
    highContrast: false,
    notifications: true,
    emailNotifications: true,
    twoFactorEnabled: false
};

export default function SettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(0);
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [hasChanges, setHasChanges] = useState(false);
    const [apiKey, setApiKey] = useState<string>("");
    const { slots } = useBookingStore();
    const { businesses, deleteEntireBusiness } = useBusinessStore();

    useEffect(() => {
        const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (stored) {
            try {
                setSettings(JSON.parse(stored));
            } catch (e) {
                console.error("Error loading settings:", e);
            }
        }

        // Load API key
        const storedApiKey = localStorage.getItem('residate-api-key');
        if (storedApiKey) {
            setApiKey(storedApiKey);
        }

        // Listen for storage events (cross-tab sync)
        const storageHandler = (e: StorageEvent) => {
            if (e.key === SETTINGS_STORAGE_KEY && e.newValue) {
                try {
                    setSettings(JSON.parse(e.newValue));
                    setHasChanges(false);
                } catch (err) { }
            }
            if (e.key === 'residate-api-key' && e.newValue) {
                setApiKey(e.newValue);
            }
        };

        // Listen for custom events (same-tab sync)
        const customHandler = ((e: CustomEvent) => {
            if (e.detail?.key === SETTINGS_STORAGE_KEY && e.detail?.value) {
                try {
                    setSettings(e.detail.value);
                    setHasChanges(false);
                } catch (err) { }
            }
            if (e.detail?.key === 'residate-api-key' && e.detail?.value) {
                setApiKey(e.detail.value);
            }
        }) as EventListener;

        window.addEventListener('storage', storageHandler);
        window.addEventListener('localStorageUpdate', customHandler);

        return () => {
            window.removeEventListener('storage', storageHandler);
            window.removeEventListener('localStorageUpdate', customHandler);
        };
    }, []);

    const handleSave = () => {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        // Dispatch custom event for same-tab sync
        window.dispatchEvent(new CustomEvent('localStorageUpdate', {
            detail: { key: SETTINGS_STORAGE_KEY, value: settings }
        }));
        setHasChanges(false);
        alert("✨ Settings saved successfully!");
    };

    const handleDeactivate = () => {
        if (confirm("⚠️ Are you sure you want to deactivate your registry? This action cannot be undone and will permanently erase all your data.")) {
            if (confirm("🔴 Final confirmation: This will delete all bookings, clients, and settings. Continue?")) {
                localStorage.clear();
                alert("Your registry has been deactivated. Redirecting to home...");
                router.push("/");
            }
        }
    };

    const handleDeletePermanently = async () => {
        const bId = localStorage.getItem('registered_business_id');
        if (!bId) return;

        const business = businesses.find(b => b.id === bId);
        if (!business) return;

        const confirmText = `eliminar ${business.name.toLowerCase()}`;
        const userInput = prompt(`⚠️ ATENCIÓN: Esta acción eliminará el negocio "${business.name}" y TODAS sus reservas para siempre.\n\nNadie podrá volver a verlo y los datos no se podrán recuperar.\n\nPara confirmar, escribe exactamente: ${confirmText}`);

        if (userInput === confirmText) {
            const result = await deleteEntireBusiness(bId);
            if ('success' in result) {
                localStorage.clear();
                alert("🚀 El negocio y todos sus datos han sido eliminados permanentemente.");
                router.push("/");
            } else {
                alert("Error al eliminar: " + result.error);
            }
        } else if (userInput !== null) {
            alert("❌ Confirmación incorrecta. El negocio no ha sido eliminado.");
        }
    };

    const { resetBusinessBookings } = useBookingStore();

    const handleResetLedger = async () => {
        const bId = localStorage.getItem('registered_business_id');
        if (!bId) return;
        const business = businesses.find(b => b.id === bId);

        if (!business) {
            alert("No se ha encontrado el negocio en el registro.");
            return;
        }

        const emailPrompter = prompt("⚠️ Esta acción borrará TODAS las reservas de tu negocio.\n\nPara confirmar que eres el creador, por favor introduce el email del negocio:");

        if (emailPrompter === business.email) {
            if (confirm("¿Estás 100% seguro? Esta acción es irreversible.")) {
                const result = await resetBusinessBookings(bId);
                if ('success' in result) {
                    alert("✨ El 'Ledger' ha sido reiniciado con éxito. Todas las reservas han sido eliminadas.");
                } else {
                    alert("Error al reiniciar: " + result.error);
                }
            }
        } else if (emailPrompter !== null) {
            alert("❌ Email incorrecto. Solo el creador del negocio puede reiniciar el Ledger.");
        }
    };

    const updateSetting = (key: keyof UserSettings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const generateApiKey = () => {
        const key = 'rp_' + Array.from({ length: 32 }, () =>
            Math.random().toString(36).charAt(2)
        ).join('');
        setApiKey(key);
        localStorage.setItem('residate-api-key', key);
        // Dispatch custom event for same-tab sync
        window.dispatchEvent(new CustomEvent('localStorageUpdate', {
            detail: { key: 'residate-api-key', value: key }
        }));
        alert('🔑 API Key generated successfully!');
    };

    const handleCalendarExport = () => {
        const bookings = slots.filter(s => s.status === 'booked');
        if (bookings.length === 0) {
            alert('No bookings to export!');
            return;
        }

        // Create .ics file content
        let icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//ResiDate//Booking Calendar//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:ResiDate Bookings',
            'X-WR-TIMEZONE:UTC',
        ];

        bookings.forEach((booking, index) => {
            const business = businesses.find(b => b.id === booking.businessId);
            const date = new Date();
            date.setHours(booking.hour, 0, 0, 0);

            const dtstart = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            const dtend = new Date(date.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

            icsContent.push(
                'BEGIN:VEVENT',
                `UID:${booking.id}@reservapro.com`,
                `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
                `DTSTART:${dtstart}`,
                `DTEND:${dtend}`,
                `SUMMARY:${booking.service || 'Booking'} - ${business?.name || 'Business'}`,
                `DESCRIPTION:Client: ${booking.clientName || 'Guest'}\\nEmail: ${booking.clientEmail || 'N/A'}`,
                `LOCATION:${business?.location || 'TBD'}`,
                'STATUS:CONFIRMED',
                'END:VEVENT'
            );
        });

        icsContent.push('END:VCALENDAR');

        // Download the file
        const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `residate-bookings-${new Date().toISOString().split('T')[0]}.ics`;
        link.click();

        alert(`✅ Exported ${bookings.length} booking(s) to calendar file!`);
    };

    const handleDataExport = () => {
        const exportData = {
            settings,
            bookings: slots,
            businesses,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `residate-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        alert('✅ Data exported successfully!');
    };

    const handleEnable2FA = () => {
        if (settings.twoFactorEnabled) {
            if (confirm("Are you sure you want to disable Two-Factor Authentication?")) {
                updateSetting('twoFactorEnabled', false);
                alert("🔓 2FA has been disabled.");
            }
        } else {
            alert("🔐 Configuring Two-Factor Authentication...");
            const code = prompt("Please enter the 6-digit verification code sent to your email to confirm:");
            if (code && code.length === 6) {
                updateSetting('twoFactorEnabled', true);
                alert("✅ Two-Factor Authentication enabled successfully!");
            } else if (code) {
                alert("❌ Invalid code. Please try again.");
            } else {
                // User cancelled or entered empty
            }
        }
    };

    const handleUpdatePassword = () => {
        const current = prompt("Enter your current password:");
        if (!current) return;

        const newPass = prompt("Enter your new password:");
        if (!newPass) return;

        if (newPass.length < 8) {
            alert("❌ Password must be at least 8 characters long.");
            return;
        }

        const confirmPass = prompt("Confirm your new password:");
        if (newPass !== confirmPass) {
            alert("❌ Passwords do not match.");
            return;
        }

        alert("✅ Password updated successfully! Next time you login, use your new credentials.");
    };

    const tabs = [
        { icon: SettingsIcon, label: "Profile" },
        { icon: Bell, label: "Notifications" },
        { icon: Shield, label: "Security" },
        { icon: Palette, label: "Aesthetics" },
        { icon: Globe, label: "Connectivity" },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md-flex-row md-items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-navy">Registry Settings</h1>
                    <p className="text-slate italic">Calibrate your personal sanctuary experience.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={handleDeletePermanently}
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50 hover:text-red-600 border border-red-200"
                    >
                        Delete Business
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges}
                        className={`flex items-center gap-2 ${!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Save className="h-4 w-4" />
                        {hasChanges ? 'Save Changes' : 'No Changes'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg-grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <aside className="lg-col-span-1 space-y-1">
                    {tabs.map((item, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveTab(i)}
                            className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${activeTab === i
                                ? "bg-navy text-white"
                                : "text-slate hover:bg-white hover:text-navy"
                                }`}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </button>
                    ))}
                </aside>

                {/* Main Settings Form */}
                <div className="lg-col-span-3 space-y-8">
                    <div className="bg-white p-8 shadow-2xl border border-navy/5 space-y-10">

                        {/* Profile Tab */}
                        {activeTab === 0 && (
                            <section className="space-y-6 animate-in fade-in">
                                <h3 className="text-lg font-serif text-navy border-b border-navy/5 pb-4">Personal Sanctuary</h3>
                                <div className="grid grid-cols-1 md-grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-slate opacity-60">Full Name</label>
                                        <input
                                            type="text"
                                            value={settings.fullName}
                                            onChange={(e) => updateSetting('fullName', e.target.value)}
                                            className="w-full bg-cream border-none p-4 text-sm focus:ring-1 focus:ring-gold outline-none transition-all font-serif"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-slate opacity-60">Email Address</label>
                                        <input
                                            type="email"
                                            value={settings.email}
                                            onChange={(e) => updateSetting('email', e.target.value)}
                                            className="w-full bg-cream border-none p-4 text-sm focus:ring-1 focus:ring-gold outline-none transition-all font-serif"
                                        />
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 1 && (
                            <section className="space-y-6 animate-in fade-in">
                                <h3 className="text-lg font-serif text-navy border-b border-navy/5 pb-4">Notification Preferences</h3>
                                <div className="space-y-4">
                                    <label
                                        onClick={() => updateSetting('notifications', !settings.notifications)}
                                        className="flex items-center justify-between p-4 bg-cream cursor-pointer group hover:bg-navy/5 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`h-4 w-4 rounded-full border-2 border-gold flex items-center justify-center p-0.5 ${!settings.notifications && 'opacity-20'}`}>
                                                {settings.notifications && <div className="h-full w-full bg-gold rounded-full"></div>}
                                            </div>
                                            <span className="text-sm font-serif text-navy">Push Notifications</span>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${settings.notifications ? 'text-gold' : 'text-slate opacity-40'}`}>
                                            {settings.notifications ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </label>
                                    <label
                                        onClick={() => updateSetting('emailNotifications', !settings.emailNotifications)}
                                        className="flex items-center justify-between p-4 bg-cream cursor-pointer group hover:bg-navy/5 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`h-4 w-4 rounded-full border-2 border-gold flex items-center justify-center p-0.5 ${!settings.emailNotifications && 'opacity-20'}`}>
                                                {settings.emailNotifications && <div className="h-full w-full bg-gold rounded-full"></div>}
                                            </div>
                                            <span className="text-sm font-serif text-navy">Email Notifications</span>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${settings.emailNotifications ? 'text-gold' : 'text-slate opacity-40'}`}>
                                            {settings.emailNotifications ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </label>
                                </div>
                            </section>
                        )}

                        {/* Security Tab */}
                        {activeTab === 2 && (
                            <section className="space-y-6 animate-in fade-in">
                                <h3 className="text-lg font-serif text-navy border-b border-navy/5 pb-4">Security & Privacy</h3>
                                <div className="space-y-4">
                                    <div className={`p-6 bg-cream border-l-4 ${settings.twoFactorEnabled ? 'border-green-500' : 'border-gold'}`}>
                                        <h4 className="font-serif text-navy mb-2">Two-Factor Authentication</h4>
                                        <p className="text-sm text-slate mb-4">
                                            {settings.twoFactorEnabled
                                                ? "Your account is secured with 2FA."
                                                : "Add an extra layer of security to your account."}
                                        </p>
                                        <Button
                                            onClick={handleEnable2FA}
                                            variant={settings.twoFactorEnabled ? "ghost" : "outline"}
                                            size="sm"
                                            className={settings.twoFactorEnabled ? "text-green-600 hover:text-green-700 hover:bg-green-50" : ""}
                                        >
                                            {settings.twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
                                        </Button>
                                    </div>
                                    <div className="p-6 bg-cream">
                                        <h4 className="font-serif text-navy mb-2">Change Password</h4>
                                        <p className="text-sm text-slate mb-4">Update your password regularly for better security.</p>
                                        <Button onClick={handleUpdatePassword} variant="outline" size="sm">Update Password</Button>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Aesthetics Tab */}
                        {activeTab === 3 && (
                            <section className="space-y-6 animate-in fade-in">
                                <h3 className="text-lg font-serif text-navy border-b border-navy/5 pb-4">Aesthetic Preferences</h3>
                                <div className="space-y-4">
                                    <label
                                        onClick={() => updateSetting('darkMode', !settings.darkMode)}
                                        className="flex items-center justify-between p-4 bg-cream cursor-pointer group hover:bg-navy/5 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`h-4 w-4 rounded-full border-2 border-gold flex items-center justify-center p-0.5 ${!settings.darkMode && 'opacity-20'}`}>
                                                {settings.darkMode && <div className="h-full w-full bg-gold rounded-full"></div>}
                                            </div>
                                            <span className="text-sm font-serif text-navy">Dark Mode Portfolio</span>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${settings.darkMode ? 'text-gold' : 'text-slate opacity-40'}`}>
                                            {settings.darkMode ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </label>
                                    <label
                                        onClick={() => updateSetting('highContrast', !settings.highContrast)}
                                        className="flex items-center justify-between p-4 bg-cream cursor-pointer group hover:bg-navy/5 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`h-4 w-4 rounded-full border-2 border-gold flex items-center justify-center p-0.5 ${!settings.highContrast && 'opacity-20'}`}>
                                                {settings.highContrast && <div className="h-full w-full bg-gold rounded-full"></div>}
                                            </div>
                                            <span className="text-sm font-serif text-navy">High Contrast Graphics</span>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${settings.highContrast ? 'text-gold' : 'text-slate opacity-40'}`}>
                                            {settings.highContrast ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </label>
                                </div>
                            </section>
                        )}

                        {/* Connectivity Tab */}
                        {activeTab === 4 && (
                            <section className="space-y-6 animate-in fade-in">
                                <h3 className="text-lg font-serif text-navy border-b border-navy/5 pb-4">Connectivity & Integrations</h3>
                                <div className="space-y-4">
                                    <div className="p-6 bg-cream">
                                        <h4 className="font-serif text-navy mb-2">Calendar Sync</h4>
                                        <p className="text-sm text-slate mb-4">Export your bookings to .ics format for Google Calendar, Outlook, or iCal.</p>
                                        <Button
                                            onClick={handleCalendarExport}
                                            variant="outline"
                                            size="sm"
                                        >
                                            Export to Calendar (.ics)
                                        </Button>
                                    </div>
                                    <div className="p-6 bg-cream">
                                        <h4 className="font-serif text-navy mb-2">API Access</h4>
                                        <p className="text-sm text-slate mb-4">Generate API keys for third-party integrations.</p>
                                        {apiKey ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 p-3 bg-white border border-navy/10 font-mono text-xs">
                                                    <span className="flex-1 truncate">{apiKey}</span>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(apiKey);
                                                            alert("✅ API Key copied to clipboard!");
                                                        }}
                                                        className="text-gold hover:text-navy transition-colors"
                                                    >
                                                        Copy
                                                    </button>
                                                </div>
                                                <Button
                                                    onClick={generateApiKey}
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Regenerate Key
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                onClick={generateApiKey}
                                                variant="outline"
                                                size="sm"
                                            >
                                                Generate API Key
                                            </Button>
                                        )}
                                    </div>
                                    <div className="p-6 bg-cream">
                                        <h4 className="font-serif text-navy mb-2">Data Export</h4>
                                        <p className="text-sm text-slate mb-4">Download all your bookings and client data as JSON.</p>
                                        <Button
                                            onClick={handleDataExport}
                                            variant="outline"
                                            size="sm"
                                        >
                                            Export Data (JSON)
                                        </Button>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Dangerous Zone - Always visible */}
                        <section className="pt-8 border-t border-navy/5 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-serif text-amber-600">Reset Ledger</h4>
                                    <p className="text-xs text-slate mt-1">Borra todas las reservas y el historial de este negocio. (Solo para creadores)</p>
                                </div>
                                <Button
                                    onClick={handleResetLedger}
                                    variant="ghost"
                                    className="text-amber-600 hover:bg-amber-50 border border-amber-600/20"
                                >
                                    Reset Ledger
                                </Button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-serif text-red-500">Deactivate Registry</h4>
                                    <p className="text-xs text-slate mt-1">This will permanently erase your access and data history.</p>
                                </div>
                                <Button
                                    onClick={handleDeactivate}
                                    variant="ghost"
                                    className="text-red-500 hover:bg-red-500/10 border border-red-500/20"
                                >
                                    Deactivate
                                </Button>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
