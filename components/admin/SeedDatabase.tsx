
import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import DatabaseIcon from '../icons/DatabaseIcon';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';

import { db } from '../../services/firebase';
import { doc, writeBatch } from "firebase/firestore";
import { sponsors } from '../../data/sponsors';
import { refereeData } from '../../data/referees';
import { internationalData, youthHybridData } from '../../data/international';

const initialAds = {
    'homepage-banner': { imageUrl: 'https://via.placeholder.com/1200x150/002B7F/FFFFFF?text=Eswatini+Mobile+-+Official+Partner', link: '#', altText: 'Ad' },
    'fixtures-banner': { imageUrl: 'https://via.placeholder.com/800x100/000000/FFFFFF?text=UMBRO+-+Official+Kit+Supplier', link: '#', altText: 'Ad' },
    'news-listing-top-banner': { imageUrl: 'https://via.placeholder.com/1200x120/D22730/FFFFFF?text=MTN+-+Proud+Sponsors', link: '#', altText: 'Ad' },
    'news-article-top-banner': { imageUrl: 'https://via.placeholder.com/800x100/FDB913/002B7F?text=Join+our+Newsletter', link: '#', altText: 'Ad' },
    'live-scoreboard-banner': { imageUrl: 'https://via.placeholder.com/1200x120/228B22/FFFFFF?text=Powered+by+Instacash', link: '#', altText: 'Ad' },
    'community-hub-banner': { imageUrl: 'https://via.placeholder.com/1200x120/FF4500/FFFFFF?text=Hub+Hardware', link: '#', altText: 'Ad' },
    'directory-banner': { imageUrl: 'https://via.placeholder.com/1200x120/00008B/FFFFFF?text=Standard+Bank', link: '#', altText: 'Ad' },
    'interactive-zone-banner': { imageUrl: 'https://via.placeholder.com/1200x120/4B0082/FFFFFF?text=Predict+and+Win', link: '#', altText: 'Ad' }
};

const initialCategories = [
    { id: 'national-teams', name: 'National Teams', order: 5 },
    { id: 'premier-leagues', name: 'Premier Leagues', order: 10 },
    { id: 'international-leagues', name: 'International Leagues', order: 15 },
    { id: 'national-divisions', name: 'National Divisions', order: 20 },
    { id: 'regional-leagues', name: 'Regional Leagues', order: 30 },
    { id: 'development', name: 'Development', order: 40 },
];

const SeedDatabase: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const handleSync = async () => {
        if (!window.confirm("This will sync structural metadata (Hybrid Tournaments, Ad placements, Sponsors, and Categories). Your match results and fixtures will NOT be touched. Proceed?")) return;
        setLoading(true);
        setStatus(null);

        try {
            const batch = writeBatch(db);
            const m = { merge: true };

            // 1. Singleton Configs
            batch.set(doc(db, 'sponsors', 'main'), sponsors, m);
            batch.set(doc(db, 'ads', 'main'), initialAds, m);
            batch.set(doc(db, 'referees', 'main'), refereeData, m);

            // 2. Categories
            initialCategories.forEach(cat => {
                batch.set(doc(db, 'categories', cat.id), cat, m);
            });

            // 3. Hybrid Tournaments (International + Youth)
            // This collection only stores tournament definitions (pots, stages, bracket links).
            // It does NOT store the fixtures of your Super Leagues.
            const allHybrids = [...internationalData, ...youthHybridData];
            allHybrids.forEach(tourn => {
                const tournRef = doc(db, 'hybrid_tournaments', tourn.id);
                const { id, ...data } = tourn;
                batch.set(tournRef, data, m);
            });

            // CRITICAL FIX: Removed the loop that generated 'competitions' collection data.
            // Your Lubombo and Manzini Super League data is now safe from this function.

            await batch.commit();
            setStatus({ type: 'success', msg: 'System structures synced! Youth pages and International Hub are now active.' });
        } catch (error: any) {
            console.error("Sync error:", error);
            setStatus({ type: 'error', msg: 'Failed: ' + (error.message || 'Check browser console.') });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="shadow-lg border-2 border-blue-100">
            <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <DatabaseIcon className="w-6 h-6 text-blue-600" />
                    <h3 className="text-2xl font-bold font-display text-gray-800">Sync System Structures</h3>
                </div>
                <p className="text-sm text-gray-600 mb-6 italic">
                    Safely update the application's framework. This syncs tournament stage definitions (like Instacash or UCL), categories, and ad placements. 
                    <span className="text-green-700 font-bold ml-1">Note: This will NOT overwrite your league results or fixtures.</span>
                </p>
                
                <div className="flex flex-col gap-4">
                    <Button 
                        onClick={handleSync} 
                        disabled={loading} 
                        className="bg-blue-600 text-white hover:bg-blue-700 h-11 px-8 shadow-lg w-full sm:w-fit"
                    >
                        {loading ? <Spinner className="w-5 h-5 border-2"/> : 'Sync App Structures'}
                    </Button>
                    
                    {status && (
                        <div className={`p-4 rounded-lg text-sm font-bold flex items-center gap-2 ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {status.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <AlertTriangleIcon className="w-5 h-5" />}
                            <div>
                                <p>{status.msg}</p>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default SeedDatabase;
