
import React from 'react';
import { useDataCache } from '../contexts/DataCacheContext';
import AlertTriangleIcon from './icons/AlertTriangleIcon';
import DatabaseIcon from './icons/DatabaseIcon';

const DatabaseStatusBanner: React.FC = () => {
    const { error, loading, competitions } = useDataCache();
    
    const hasData = Object.keys(competitions).length > 0;
    
    // Only show if there's an error OR if it's connected but empty
    if (!error && !loading && hasData) return null;

    const isQuotaExceeded = error?.code === 'resource-exhausted' || error?.message?.toLowerCase().includes('quota');
    const isPermissionDenied = error?.code === 'permission-denied';
    const isUnavailable = error?.code === 'unavailable' || error?.message?.includes('client is offline');
    const isEmpty = !loading && !hasData && !error;

    return (
        <div className={`bg-amber-50 border-b border-amber-200 px-4 py-2 sticky top-0 z-[60] flex items-center justify-between animate-fade-in ${isEmpty ? 'bg-blue-50 border-blue-200' : ''}`}>
            <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${error ? 'bg-red-100 text-red-600' : isEmpty ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                    {error ? <AlertTriangleIcon className="w-4 h-4" /> : isEmpty ? <DatabaseIcon className="w-4 h-4" /> : <DatabaseIcon className="w-4 h-4" />}
                </div>
                <div className="flex flex-col">
                    <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${isEmpty ? 'text-blue-900' : 'text-amber-900'}`}>
                        Firestore Sync Status
                    </p>
                    <p className="text-xs font-bold text-gray-700">
                        {loading && !hasData ? (
                            "Connecting to Firebase..."
                        ) : isEmpty ? (
                            "Connected, but no hubs found. Use 'Sync Structural Metadata' in the Admin Panel to load data."
                        ) : isQuotaExceeded ? (
                            "Quota Exceeded. Data will pause until reset."
                        ) : isPermissionDenied ? (
                            "Access Denied. Check Security Rules."
                        ) : isUnavailable ? (
                            "Connection Error. Please check your system settings or internet."
                        ) : (
                            `System alert: ${error?.code || 'Unknown error'}`
                        )}
                    </p>
                </div>
            </div>
            
            {isQuotaExceeded && (
                <div className="hidden md:flex items-center gap-2">
                    <span className="text-[9px] font-black bg-white/50 px-2 py-1 rounded border border-amber-200 text-amber-800">QUOTA REACHED</span>
                </div>
            )}
            
            {isEmpty && (
                <a href="#/admin" className="text-[10px] font-black bg-blue-600 text-white px-3 py-1.5 rounded shadow-sm hover:bg-blue-700 transition-colors uppercase tracking-wider">
                    Go to Admin
                </a>
            )}
        </div>
    );
};

export default DatabaseStatusBanner;
