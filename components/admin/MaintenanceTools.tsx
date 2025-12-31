
import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import RefreshIcon from '../icons/RefreshIcon';
import TrashIcon from '../icons/TrashIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';

const MaintenanceTools: React.FC = () => {
    const [status, setStatus] = useState<string | null>(null);

    const handlePurgeCache = async () => {
        if (!window.confirm("This will clear all local browser data for this site (Cache, LocalStorage, etc.) and perform a hard reload. You will be logged out. Proceed?")) return;
        
        setStatus("Purging...");
        
        try {
            // 1. Clear Local Storage
            localStorage.clear();
            sessionStorage.clear();
            
            // 2. Clear Caches API
            if ('caches' in window) {
                const names = await caches.keys();
                await Promise.all(names.map(name => caches.delete(name)));
            }
            
            // 3. Unregister Service Workers
            if ('serviceWorker' in navigator) {
                try {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(registrations.map(reg => reg.unregister()));
                } catch (swError) {
                    console.warn("SW unregistration failed during maintenance", swError);
                }
            }

            setStatus("Success! Reloading...");
            
            // 4. Force Reload
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (e) {
            console.error(e);
            setStatus("Error purging cache.");
        }
    };

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <h3 className="text-2xl font-bold font-display mb-2">System Maintenance</h3>
                <p className="text-sm text-gray-600 mb-6">Tools to fix client-side synchronization and caching issues.</p>

                <div className="space-y-6">
                    <div className="p-4 border border-blue-100 bg-blue-50 rounded-lg">
                        <h4 className="font-bold text-blue-900 mb-2">Sync Fixer: Purge Client Cache</h4>
                        <p className="text-sm text-blue-800 mb-4">
                            If you have pushed new code to GitHub but it's not showing up on your live phone or computer, your browser is likely serving a cached version. This button forces a clean wipe of the local environment.
                        </p>
                        <Button 
                            onClick={handlePurgeCache} 
                            className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                        >
                            {status ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <TrashIcon className="w-4 h-4" />}
                            {status || 'Purge Cache & Hard Reload'}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default MaintenanceTools;
