
import React, { useEffect, useState } from 'react';
import Spinner from './ui/Spinner';
import ShieldIcon from './icons/ShieldIcon';

const RefreshPage: React.FC = () => {
    const [status, setStatus] = useState('Initiating emergency purge...');

    useEffect(() => {
        const performNuclearPurge = async () => {
            console.log("Emergency Purge Initiated...");
            
            try {
                // 1. Clear Storage
                setStatus('Clearing local session data...');
                localStorage.clear();
                sessionStorage.clear();
                
                // 2. Clear Caches
                setStatus('Invalidating old asset cache...');
                if ('caches' in window) {
                    const names = await caches.keys();
                    await Promise.all(names.map(name => caches.delete(name)));
                }
                
                // 3. Unregister SW
                setStatus('Unregistering service workers...');
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(registrations.map(reg => reg.unregister()));
                }

                setStatus('Synchronization complete. Reloading...');
                
                // 4. Force hard reload to home
                setTimeout(() => {
                    window.location.href = window.location.origin + window.location.pathname;
                }, 1000);
            } catch (e) {
                console.error("Purge failed", e);
                window.location.href = '/';
            }
        };

        performNuclearPurge();
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-primary-dark text-white p-6 text-center">
            <div className="relative mb-8">
                <Spinner className="h-24 w-24 border-white/20 border-t-accent" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldIcon className="w-8 h-8 text-white/40" />
                </div>
            </div>
            <h1 className="text-3xl font-display font-black mb-4 tracking-tighter uppercase">System Sync</h1>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl shadow-2xl">
                <p className="font-mono text-sm text-accent animate-pulse">{status}</p>
            </div>
            <p className="mt-8 text-white/60 text-sm max-w-xs leading-relaxed">
                We're forcing your browser to fetch the latest stadium data and news from our servers.
            </p>
        </div>
    );
};

export default RefreshPage;
