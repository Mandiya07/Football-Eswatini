import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import RefreshIcon from '../icons/RefreshIcon';
import TrashIcon from '../icons/TrashIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import { fetchAllCompetitions, handleFirestoreError, updateAppSettings, fetchAppSettings, resetAppLogo } from '../../services/api';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { calculateStandings, removeUndefinedProps } from '../../services/utils';
import Spinner from '../ui/Spinner';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';
import ImageUploader from '../ui/ImageUploader';
import ImageIcon from '../icons/ImageIcon';
import InfoIcon from '../icons/InfoIcon';

const MaintenanceTools: React.FC = () => {
    const [status, setStatus] = useState<string | null>(null);
    const [repairLoading, setRepairLoading] = useState(false);
    const [leagues, setLeagues] = useState<{id: string, name: string}[]>([]);
    const [logoSaving, setLogoSaving] = useState(false);
    const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
    const [isClearingLogo, setIsClearingLogo] = useState(false);

    useEffect(() => {
        const load = async () => {
            const [all, settings] = await Promise.all([
                fetchAllCompetitions(),
                fetchAppSettings()
            ]);
            const list = Object.entries(all).map(([id, c]) => ({ id, name: c.name }));
            setLeagues(list.sort((a,b) => a.name.localeCompare(b.name)));
            if (settings?.appLogoUrl) setCurrentLogoUrl(settings.appLogoUrl);
        };
        load();
    }, []);

    const handlePurgeCache = async () => {
        if (!window.confirm("This will clear all local browser data and reload. You will be logged out. Proceed?")) return;
        setStatus("Purging...");
        try {
            localStorage.clear();
            sessionStorage.clear();
            if ('caches' in window) {
                const names = await caches.keys();
                await Promise.all(names.map(name => caches.delete(name)));
            }
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(registrations.map(reg => reg.unregister()));
            }
            setStatus("Success!");
            setTimeout(() => window.location.reload(), 1000);
        } catch (e) {
            setStatus("Error.");
        }
    };

    const handleGhostMatchCleanup = async (leagueId: string) => {
        if (!window.confirm(`Scan and remove potential duplicate matches for ${leagueId}? This helps fix match count irregularities.`)) return;
        setRepairLoading(true);
        try {
            const docRef = doc(db, 'competitions', leagueId);
            await runTransaction(db, async (transaction) => {
                const snap = await transaction.get(docRef);
                if (!snap.exists()) return;
                const data = snap.data();
                
                const results = data.results || [];
                const fixtures = data.fixtures || [];
                
                const seen = new Set();
                const cleanResults = results.filter((m: any) => {
                    const key = `${m.teamA}-${m.teamB}-${m.fullDate}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });

                const cleanFixtures = fixtures.filter((m: any) => {
                    const key = `${m.teamA}-${m.teamB}-${m.fullDate}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });

                const updatedTeams = calculateStandings(data.teams || [], cleanResults, cleanFixtures);
                transaction.update(docRef, removeUndefinedProps({
                    results: cleanResults,
                    fixtures: cleanFixtures,
                    teams: updatedTeams
                }));
            });
            alert("League integrity check complete! Match counts recalculated.");
        } catch (err) {
            handleFirestoreError(err, 'ghost cleanup');
        } finally {
            setRepairLoading(false);
        }
    };

    const handleUpdateLogo = async (base64: string) => {
        setLogoSaving(true);
        try {
            await updateAppSettings({ appLogoUrl: base64 });
            setCurrentLogoUrl(base64);
            alert("Main app logo updated successfully! Application will now hard reload to apply changes.");
            window.location.reload();
        } catch (err: any) {
            console.error(err);
            alert(`Logo upload failed: ${err.message || 'Unknown error'}`);
        } finally {
            setLogoSaving(false);
        }
    };

    const handleResetLogo = async () => {
        if (!window.confirm("Remove custom logo and revert to the default Football Eswatini SVG?")) return;
        setIsClearingLogo(true);
        try {
            await resetAppLogo();
            setCurrentLogoUrl(null);
            alert("Logo reset successfully. Page will reload.");
            window.location.reload();
        } catch (err: any) {
            alert(`Reset failed: ${err.message}`);
        } finally {
            setIsClearingLogo(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <Card className="shadow-lg border-0 bg-white">
                <CardContent className="p-6">
                    <h3 className="text-2xl font-bold font-display mb-2">System Maintenance</h3>
                    <p className="text-sm text-gray-600 mb-8">Tools to fix client-side synchronization and database integrity issues.</p>

                    <div className="space-y-8">
                        {/* GLOBAL SETTINGS SECTION */}
                        <div className="p-6 border border-purple-100 bg-purple-50 rounded-2xl">
                            <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" /> Global Branding: App Logo
                            </h4>
                            <p className="text-xs text-purple-800 mb-6 leading-relaxed">
                                Upload a new logo to replace the default SVG across the navigation bar, footer, and admin portals.
                            </p>
                            
                            <div className="mb-6 p-4 bg-white/60 rounded-xl border border-purple-100 flex items-start gap-3">
                                <InfoIcon className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-purple-700 space-y-1">
                                    <p className="font-bold">Recommended Format:</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li>Use a <strong>PNG with a transparent background</strong> for best results on dark headers.</li>
                                        <li>Landscape orientation works best (e.g., 400x100px).</li>
                                        <li>High-contrast white or light-colored logos are better for our dark theme.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-8 items-start mb-6">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Active Logo Preview</p>
                                    <div className="w-48 h-24 bg-[#001E5A] rounded-xl border border-purple-200 flex items-center justify-center p-4 shadow-inner relative group">
                                        {currentLogoUrl ? (
                                            <img src={currentLogoUrl} className="max-h-full max-w-full object-contain" alt="Current App Logo" />
                                        ) : (
                                            <div className="text-center text-white/40">
                                                <p className="text-[10px] font-bold uppercase tracking-widest">Default Theme</p>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[9px] text-center text-gray-400 uppercase font-black">Preview on Dark Header</p>
                                </div>
                                <div className="space-y-4 flex-grow">
                                    <div>
                                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Update Asset</p>
                                        <ImageUploader 
                                            onUpload={handleUpdateLogo} 
                                            status={logoSaving ? 'saving' : undefined}
                                        />
                                    </div>
                                    {currentLogoUrl && (
                                        <button 
                                            onClick={handleResetLogo}
                                            disabled={isClearingLogo}
                                            className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors disabled:opacity-50"
                                        >
                                            {isClearingLogo ? <Spinner className="w-3 h-3" /> : <TrashIcon className="w-3 h-3" />}
                                            Revert to default SVG
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border border-blue-100 bg-blue-50 rounded-2xl">
                            <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                <RefreshIcon className="w-4 h-4" /> Sync Fixer: Purge Client Cache
                            </h4>
                            <p className="text-xs text-blue-800 mb-6 leading-relaxed">
                                Use this if updates made in the admin panel are not reflecting on other devices. Forces the browser to discard cached scripts and data.
                            </p>
                            <Button 
                                onClick={handlePurgeCache} 
                                className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 h-10"
                            >
                                {status === "Purging..." ? <Spinner className="w-4 h-4 border-white" /> : <TrashIcon className="w-4 h-4" />}
                                {status || 'Purge Cache & Hard Reload'}
                            </Button>
                        </div>

                        <div className="p-5 border border-orange-100 bg-orange-50 rounded-2xl">
                            <h4 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                                <AlertTriangleIcon className="w-4 h-4" /> Integrity Tool: Ghost Match Cleanup
                            </h4>
                            <p className="text-xs text-orange-800 mb-6 leading-relaxed">
                                Scans for duplicate match records (same teams on same date) and removes extras. This fixes issues where some teams have more "played" matches than others.
                            </p>
                            
                            <div className="flex flex-wrap gap-2">
                                {repairLoading ? <Spinner /> : leagues.map(l => (
                                    <button 
                                        key={l.id} 
                                        onClick={() => handleGhostMatchCleanup(l.id)}
                                        className="bg-white border border-orange-200 text-orange-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                                    >
                                        Repair {l.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default MaintenanceTools;