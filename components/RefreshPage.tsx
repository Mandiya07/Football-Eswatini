
import React, { useEffect } from 'react';
import Spinner from './ui/Spinner';

const RefreshPage: React.FC = () => {
    useEffect(() => {
        const performNuclearPurge = async () => {
            console.log("Emergency Purge Initiated...");
            
            // 1. Clear Storage
            localStorage.clear();
            sessionStorage.clear();
            
            // 2. Clear Caches
            if ('caches' in window) {
                const names = await caches.keys();
                await Promise.all(names.map(name => caches.delete(name)));
            }
            
            // 3. Unregister SW
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(registrations.map(reg => reg.unregister()));
            }

            console.log("Purge finished. Redirecting to home...");
            
            // 4. Force hard reload to home
            window.location.href = window.location.origin + window.location.pathname;
        };

        performNuclearPurge();
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-primary text-white p-6 text-center">
            <Spinner className="mb-6 border-white border-t-accent" />
            <h1 className="text-3xl font-bold font-display mb-2">Refreshing System Cache</h1>
            <p className="opacity-70">Please wait while we force your browser to fetch the latest updates from GitHub...</p>
        </div>
    );
};

export default RefreshPage;
