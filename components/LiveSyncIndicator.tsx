"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

export function LiveSyncIndicator() {
    const [isOnline, setIsOnline] = useState(true);
    const [lastSync, setLastSync] = useState<Date>(new Date());
    const [syncPulse, setSyncPulse] = useState(false);

    useEffect(() => {
        // Monitor online/offline status
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Listen for storage updates
        const handleStorageUpdate = () => {
            setLastSync(new Date());
            setSyncPulse(true);
            setTimeout(() => setSyncPulse(false), 1000);
        };

        window.addEventListener('storage', handleStorageUpdate);
        window.addEventListener('localStorageUpdate', handleStorageUpdate);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('storage', handleStorageUpdate);
            window.removeEventListener('localStorageUpdate', handleStorageUpdate);
        };
    }, []);

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <div className={`
                flex items-center gap-2 px-4 py-2 rounded-full shadow-lg
                transition-all duration-300
                ${isOnline ? 'bg-navy text-white' : 'bg-red-500 text-white'}
                ${syncPulse ? 'scale-110' : 'scale-100'}
            `}>
                {isOnline ? (
                    <>
                        <Wifi className={`h-4 w-4 ${syncPulse ? 'animate-pulse' : ''}`} />
                        <span className="text-xs font-medium">Live Sync</span>
                    </>
                ) : (
                    <>
                        <WifiOff className="h-4 w-4" />
                        <span className="text-xs font-medium">Offline</span>
                    </>
                )}
            </div>
            {syncPulse && (
                <div className="absolute inset-0 rounded-full bg-gold opacity-50 animate-ping" />
            )}
        </div>
    );
}
