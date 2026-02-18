
import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import DatabaseIcon from '../icons/DatabaseIcon';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';

import { db } from '../../services/firebase';
import { doc, writeBatch, collection } from "firebase/firestore";
import { sponsors } from '../../data/sponsors';
import { refereeData } from '../../data/referees';
import { internationalData, youthHybridData } from '../../data/international';
import { youthData } from '../../data/youth';
import { cupData } from '../../data/cups';

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
    { id: 'national-divisions', name: 'National Divisions', order: 20 },
    { id: 'international-leagues', name: 'International Leagues', order: 25 },
    { id: 'regional-leagues', name: 'Super League', order: 30 },
    { id: 'promotion-league', name: 'Promotion', order: 32 },
    { id: 'b-division', name: 'B Division', order: 34 },
    { id: 'schools', name: 'Schools Football', order: 40 },
    { id: 'development', name: 'Youth and Development', order: 50 },
    { id: 'u20-elite-league', name: 'U-20 Elite League', order: 90 },
    { id: 'hub-hardware-u17-competition', name: 'Hub Hardware U-17 Tournament', order: 100 },
    { id: 'build-it-u13-national', name: 'Build It U-13 National', order: 110 },
];

const SeedDatabase: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const handleSync = async () => {
        if (!window.confirm("SYNC STRUCTURAL METADATA: This will update system categories and global configs. It will NOT overwrite your tournament bracket results. Proceed?")) return;
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

            // 3. Youth Data
            youthData.forEach(league => {
                const ref = doc(db, 'youth', league.id);
                batch.set(ref, league, m);
            });

            // 4. Hybrid Tournaments
            const allHybrids = [...internationalData, ...youthHybridData];
            allHybrids.forEach(tourn => {
                const tournRef = doc(db, 'hybrid_tournaments', tourn.id);
                const { id, ...data } = tourn;
                batch.set(tournRef, data, m); 
            });

            // 5. BRACKET TEMPLATES - ONLY MERGE NAMES AND LOGOS
            cupData.forEach(cup => {
                const cupRef = doc(db, 'cups', cup.id);
                batch.set(cupRef, { name: cup.name, logoUrl: cup.logoUrl }, m);
            });

            await batch.commit();
            setStatus({ type: 'success', msg: 'Structural metadata synchronized with cloud.' });
        } catch (error: any) {
            console.error("Sync error:", error);
            setStatus({ type: 'error', msg: 'Sync Failed: ' + (error.message || 'Check connection.') });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="shadow-lg border-2 border-blue-100">
            <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <DatabaseIcon className="w-6 h-6 text-blue-600" />
                    <h3 className="text-2xl font-bold font-display text-gray-800">System Structural Sync</h3>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                    Use this tool to synchronize system categories and global application configurations without wiping your custom tournament data.
                </p>
                
                <div className="flex flex-col gap-4">
                    <Button 
                        onClick={handleSync} 
                        disabled={loading} 
                        className="bg-primary text-white hover:bg-primary-dark h-11 px-8 shadow-lg w-full sm:w-fit font-black uppercase tracking-widest text-xs"
                    >
                        {loading ? <Spinner className="w-5 h-5 border-2"/> : 'Sync Structural Metadata'}
                    </Button>
                    
                    {status && (
                        <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 animate-fade-in ${status.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
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
