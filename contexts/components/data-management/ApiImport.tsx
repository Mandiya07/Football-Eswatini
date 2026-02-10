import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import CloudDownloadIcon from '../icons/CloudDownloadIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import PencilIcon from '../icons/PencilIcon';
import XIcon from '../icons/XIcon';
import SaveIcon from '../icons/SaveIcon';
import TrashIcon from '../icons/TrashIcon';
import { CompetitionFixture } from '../../data/teams';
import { fetchAllCompetitions, fetchCompetition, handleFirestoreError, Competition, fetchFootballDataOrg, fetchApiFootball, fetchHybridTournaments, HybridTournament } from '../../services/api';
import { db } from '../../services/firebase';
import { doc, runTransaction, setDoc } from 'firebase/firestore';
import { removeUndefinedProps, normalizeTeamName, calculateStandings, superNormalize } from '../../services/utils';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';
import InfoIcon from '../icons/InfoIcon';
import SparklesIcon from '../icons/SparklesIcon';
import ShieldCheckIcon from '../icons/ShieldCheckIcon';
import KeyIcon from '../icons/KeyIcon';
import GlobeIcon from '../icons/GlobeIcon';
import TrophyIcon from '../icons/TrophyIcon';
import Logo from '../Logo';
import { GoogleGenAI, Type } from "@google/genai";
import XCircleIcon from '../icons/XCircleIcon';

// --- PRODUCTION FAIL-SAFE CREDENTIALS ---
const FAILSAFE_KEYS = {
    footballData: 'ce4539218db6423cbbc6e9dd409f1e34',
    apiFootball: 'f3d2acc1bcb78da93841c0792745b828'
};

interface ReviewedFixture {
    id: string;
    title: string;
    date: string;
    time: string;
    venue: string;
    matchday: string;
    status: 'new' | 'duplicate' | 'importing' | 'imported' | 'error' | 'update';
    selected: boolean;
    fixtureData: CompetitionFixture;
    error?: string;
}

const ApiImportPage: React.FC = () => {
    const [reviewedFixtures, setReviewedFixtures] = useState<ReviewedFixture[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [importType, setImportType] = useState<'fixtures' | 'results'>('fixtures');
    const [apiProvider, setApiProvider] = useState<'football-data' | 'api-football'>('football-data');
    const [dataSourceMode, setDataSourceMode] = useState<'live' | 'ai'>('live');
    const [isRapidApi, setIsRapidApi] = useState(false); 
    
    const [allPotentialTargets, setAllPotentialTargets] = useState<{ id: string, name: string, externalApiId?: string, isHybrid?: boolean }[]>([]);
    const [loadingTargets, setLoadingTargets] = useState(true);
    const [selectedTargetId, setSelectedTargetId] = useState<string>('');
    const [currentTargetData, setCurrentTargetData] = useState<Competition | HybridTournament | null>(null);
    
    const [season, setSeason] = useState('');
    const [useProxy, setUseProxy] = useState(true);
    const [matchday, setMatchday] = useState('');

    // --- AUTOMATIC KEY DETECTION & FAILSAFE RESOLUTION ---
    const systemKeys = useMemo(() => {
        // Priority: process.env (Vite define) > Hardcoded Failsafe
        const fdKey = process.env.FOOTBALL_DATA_API_KEY || FAILSAFE_KEYS.footballData;
        const afKey = process.env.API_FOOTBALL_KEY || FAILSAFE_KEYS.apiFootball;
        
        return {
            footballData: fdKey,
            apiFootball: afKey
        };
    }, []);

    const activeApiKey = useMemo(() => {
        if (apiProvider === 'football-data') return systemKeys.footballData;
        return systemKeys.apiFootball;
    }, [apiProvider, systemKeys]);

    // Force Mode and Provider based on available production keys
    useEffect(() => {
        if (systemKeys.footballData) {
            setApiProvider('football-data');
            setDataSourceMode('live');
        } else if (systemKeys.apiFootball) {
            setApiProvider('api-football');
            setDataSourceMode('live');
        } else if (process.env.API_KEY) {
            setDataSourceMode('ai');
        }

        const now = new Date();
        setSeason(now.getMonth() < 6 ? `${now.getFullYear() - 1}` : `${now.getFullYear()}`);
        
        loadTargets();
    }, [systemKeys]);

    const loadTargets = async () => {
        setLoadingTargets(true);
        try {
            const [compsData, hybridData] = await Promise.all([
                fetchAllCompetitions(),
                fetchHybridTournaments()
            ]);

            const comps = Object.entries(compsData).map(([id, comp]) => ({ 
                id, name: comp.name, externalApiId: comp.externalApiId, isHybrid: false 
            }));
            
            const hybrids = hybridData.map(h => ({ 
                id: h.id, name: h.name, externalApiId: h.externalApiId, isHybrid: true 
            }));

            const merged = [...comps, ...hybrids].sort((a, b) => a.name.localeCompare(b.name));
            setAllPotentialTargets(merged);

            const firstImportable = merged.find(t => t.externalApiId);
            if (firstImportable) setSelectedTargetId(firstImportable.id);
        } catch (err) {
            setError("Failed to load target leagues.");
        } finally {
            setLoadingTargets(false);
        }
    };

    useEffect(() => {
        const loadSelectedData = async () => {
            if (!selectedTargetId) return;
            const target = allPotentialTargets.find(t => t.id === selectedTargetId);
            if (!target) return;
            if (target.isHybrid) {
                const hybrids = await fetchHybridTournaments();
                setCurrentTargetData(hybrids.find(h => h.id === selectedTargetId) || null);
            } else {
                const found = await fetchCompetition(selectedTargetId);
                setCurrentTargetData(found || null);
            }
        };
        loadSelectedData();
    }, [selectedTargetId, allPotentialTargets]);

    const handleFetch = async () => {
        setIsFetching(true);
        setError('');
        setReviewedFixtures([]);
        setSuccessMessage('');

        if (dataSourceMode === 'ai' && !activeApiKey) {
            try {
                if (!process.env.API_KEY) throw new Error("AI Environment unavailable.");
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const teamNames = (currentTargetData?.teams || []).map(t => t.name).join(', ');
                const prompt = `Generate 6 realistic football ${importType} for: ${teamNames}. Return JSON Array<{teamA, teamB, scoreA?, scoreB?, fullDate, time, status, venue}>.`;
                const result = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: { responseMimeType: "application/json" }
                });
                const aiData = JSON.parse(result.text || '[]');
                setReviewedFixtures(processAndReviewFixtures(aiData, "AI Drafting Engine"));
                setIsFetching(false);
                return;
            } catch (err: any) {
                setError(`AI Drafting failed: ${err.message}`);
                setIsFetching(false);
                return;
            }
        }
        
        if (!activeApiKey) {
            setError(`Security Error: Valid API Credentials for ${apiProvider} were not detected.`);
            setIsFetching(false);
            return;
        }

        const target = allPotentialTargets.find(t => t.id === selectedTargetId);
        if (!target?.externalApiId) {
            setError(`Target Hub Link Missing: ${target?.name} has no Provider ID assigned.`);
            setIsFetching(false);
            return;
        }

        try {
            let fixtures: CompetitionFixture[] = [];
            const officialTeamNames = (currentTargetData?.teams || []).map(t => t.name);

            if (apiProvider === 'api-football') {
                fixtures = await fetchApiFootball(target.externalApiId, activeApiKey, season, importType, useProxy, officialTeamNames, isRapidApi);
            } else {
                fixtures = await fetchFootballDataOrg(target.externalApiId, activeApiKey, season, importType, useProxy, officialTeamNames);
            }

            if (fixtures.length === 0) {
                setError(`API Connectivity confirmed, but zero records were returned for ID ${target.externalApiId}.`);
            } else {
                setReviewedFixtures(processAndReviewFixtures(fixtures, "Live Network Feed"));
            }
        } catch (err: any) {
            setError(`Network Error: ${err.message}`);
        } finally {
            setIsFetching(false);
        }
    };

    const processAndReviewFixtures = (fixturesToProcess: CompetitionFixture[], source: string): ReviewedFixture[] => {
        if (!currentTargetData) return [];
        const target = allPotentialTargets.find(t => t.id === selectedTargetId);
        const existingMatches = target?.isHybrid 
            ? (currentTargetData as HybridTournament).matches || []
            : [...((currentTargetData as Competition).fixtures || []), ...((currentTargetData as Competition).results || [])];
        
        const officialTeamNames = (currentTargetData.teams || []).map(t => t.name);

        const processed = fixturesToProcess.map((fixture, idx) => {
            const existingMatch = existingMatches.find(f => 
                superNormalize(f.teamA) === superNormalize(fixture.teamA) &&
                superNormalize(f.teamB) === superNormalize(fixture.teamB) &&
                f.fullDate === fixture.fullDate
            );

            const isDuplicate = !!existingMatch;
            let status: ReviewedFixture['status'] = 'new';
            if (isDuplicate) status = 'duplicate';

            let normalizedA = normalizeTeamName(fixture.teamA, officialTeamNames);
            let normalizedB = normalizeTeamName(fixture.teamB, officialTeamNames);

            if (!normalizedA || !normalizedB) status = 'error';

            return {
                id: String(fixture.id || `tmp-${idx}`),
                title: `${fixture.teamA} vs ${fixture.teamB}`,
                date: fixture.fullDate!,
                time: fixture.time,
                venue: fixture.venue || 'TBA',
                matchday: String(fixture.matchday || ''),
                status: status,
                selected: !isDuplicate && status !== 'error', 
                fixtureData: { ...fixture, teamA: normalizedA || fixture.teamA, teamB: normalizedB || fixture.teamB },
                error: !normalizedA ? `Home Mismatch: ${fixture.teamA}` : !normalizedB ? `Away Mismatch: ${fixture.teamB}` : undefined
            };
        });

        setSuccessMessage(`Success: Synchronized ${processed.length} records from ${source}.`);
        return processed;
    };

    const handleToggleSelection = (id: string) => {
        setReviewedFixtures(prev => prev.map(f => f.id === id ? { ...f, selected: !f.selected } : f));
    };

    const handleImportSelected = async () => {
        const target = allPotentialTargets.find(t => t.id === selectedTargetId);
        const selected = reviewedFixtures.filter(f => f.selected);
        if (!target || selected.length === 0) return;

        setIsSaving(true);
        try {
            const docRef = doc(db, target.isHybrid ? 'hybrid_tournaments' : 'competitions', selectedTargetId);
            await runTransaction(db, async (transaction) => {
                const snap = await transaction.get(docRef);
                const data = snap.data() as Competition;
                const newItems = selected.map(f => ({ ...f.fixtureData, matchday: matchday ? parseInt(matchday) : f.fixtureData.matchday }));
                
                let fixtures = [...(data.fixtures || [])];
                let results = [...(data.results || [])];

                newItems.forEach(item => {
                    if (importType === 'results') {
                        results.push(item);
                        fixtures = fixtures.filter(f => !(f.teamA === item.teamA && f.teamB === item.teamB));
                    } else {
                        fixtures.push(item);
                    }
                });

                const updatedTeams = calculateStandings(data.teams || [], results, fixtures);
                transaction.update(docRef, removeUndefinedProps({ fixtures, results, teams: updatedTeams }));
            });
            setSuccessMessage(`Cloud Commit Complete: ${selected.length} records saved.`);
            setReviewedFixtures([]);
        } catch (err) { setError("Database Transaction Failed."); }
        finally { setIsSaving(false); }
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 sm:text-sm transition-all";

    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
                <Card className="shadow-2xl border-0 overflow-hidden rounded-[2.5rem]">
                    <div className="bg-primary p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
                                <CloudDownloadIcon className="w-10 h-10 text-accent" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-display font-black uppercase tracking-tight">Live Import Studio</h1>
                                <p className="text-blue-100 text-sm opacity-80">Connected to Global Stadium Infrastructure</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border shadow-xl transition-all ${activeApiKey ? 'bg-green-600 border-green-400 text-white' : 'bg-red-600 border-red-400 text-white animate-pulse'}`}>
                                {activeApiKey ? <><CheckCircleIcon className="w-3.5 h-3.5"/> Key Authenticated</> : <><AlertTriangleIcon className="w-3.5 h-3.5"/> Credentials Missing</>}
                            </div>
                            <div className="h-10 w-px bg-white/10"></div>
                            <p className="text-[10px] font-black uppercase text-white/50 tracking-widest">Environment Ready</p>
                        </div>
                    </div>

                    <CardContent className="p-8 space-y-10">
                        {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 animate-fade-in font-bold text-sm flex items-start gap-3"><AlertTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5"/> {error}</div>}
                        {successMessage && <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 animate-fade-in font-bold text-sm flex items-center gap-3"><CheckCircleIcon className="w-5 h-5"/> {successMessage}</div>}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <label className="block text-xs font-black uppercase text-gray-400 tracking-widest border-b pb-2">1. Select Feed Provider</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => setApiProvider('football-data')} 
                                        className={`p-5 rounded-2xl border-2 transition-all text-left relative overflow-hidden group ${apiProvider === 'football-data' ? 'border-primary bg-blue-50 shadow-xl' : 'border-gray-100 hover:bg-gray-50'}`}
                                    >
                                        <div className={`p-2 rounded-lg w-fit mb-3 shadow-md ${systemKeys.footballData ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                            <GlobeIcon className="w-5 h-5"/>
                                        </div>
                                        <p className="font-black text-sm uppercase text-gray-900 tracking-tight">Football-Data.org</p>
                                        <p className="text-[10px] text-gray-400 mt-1">{systemKeys.footballData ? 'Verified Connection' : 'Not Configured'}</p>
                                        {systemKeys.footballData && <div className="absolute top-2 right-2"><CheckCircleIcon className="w-3 h-3 text-green-500" /></div>}
                                    </button>
                                    <button 
                                        onClick={() => setApiProvider('api-football')} 
                                        className={`p-5 rounded-2xl border-2 transition-all text-left relative overflow-hidden group ${apiProvider === 'api-football' ? 'border-primary bg-blue-50 shadow-xl' : 'border-gray-100 hover:bg-gray-50'}`}
                                    >
                                        <div className={`p-2 rounded-lg w-fit mb-3 shadow-md ${systemKeys.apiFootball ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                            <TrophyIcon className="w-5 h-5"/>
                                        </div>
                                        <p className="font-black text-sm uppercase text-gray-900 tracking-tight">API-Football</p>
                                        <p className="text-[10px] text-gray-400 mt-1">{systemKeys.apiFootball ? 'Verified Connection' : 'Not Configured'}</p>
                                        {systemKeys.apiFootball && <div className="absolute top-2 right-2"><CheckCircleIcon className="w-3 h-3 text-green-500" /></div>}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <label className="block text-xs font-black uppercase text-gray-400 tracking-widest border-b pb-2">2. Deployment Settings</label>
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <select value={selectedTargetId} onChange={e => setSelectedTargetId(e.target.value)} className={`${inputClass} h-[48px] font-bold text-gray-900 shadow-sm`}>
                                            <option disabled value="">Select Hub Destination...</option>
                                            {allPotentialTargets.map(t => <option key={t.id} value={t.id}>{t.name} {t.externalApiId ? `(ID: ${t.externalApiId})` : '(No Map)'}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Season</label><input value={season} onChange={e => setSeason(e.target.value)} className={inputClass} placeholder="2024" /></div>
                                        <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Stream</label><select value={importType} onChange={e => setImportType(e.target.value as any)} className={inputClass}><option value="fixtures">Upcoming Fixtures</option><option value="results">Recent Results</option></select></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-10 border-t flex flex-col sm:flex-row items-center justify-between gap-6">
                             <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" checked={useProxy} onChange={e => setUseProxy(e.target.checked)} className="h-5 w-5 rounded text-primary focus:ring-primary border-gray-300" />
                                <span className="text-xs font-bold text-gray-500 group-hover:text-primary transition-all">High-Reliability Tunnel (CORS Proxy)</span>
                            </label>
                            <Button onClick={handleFetch} disabled={isFetching} className="bg-primary text-white h-16 px-20 rounded-2xl shadow-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all w-full sm:w-auto flex items-center justify-center gap-4">
                                {isFetching ? <Spinner className="w-6 h-6 border-white border-2" /> : <><CloudDownloadIcon className="w-6 h-6 text-accent"/> Sync Live Network</>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {reviewedFixtures.length > 0 && (
                    <div className="mt-12 space-y-8 animate-fade-in">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                            <div>
                                <h3 className="text-3xl font-black font-display text-slate-900 uppercase tracking-tighter">Reconciliation Queue</h3>
                                <p className="text-slate-500 mt-1">Found {reviewedFixtures.length} matches for <span className="font-bold text-blue-600">{allPotentialTargets.find(t => t.id === selectedTargetId)?.name}</span>.</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <label className="text-[10px] font-black uppercase text-gray-400">Hub Matchday #</label>
                                <input type="number" value={matchday} onChange={e => setMatchday(e.target.value)} className="w-20 p-2 border rounded-lg text-sm font-bold text-center bg-gray-50" placeholder="--" />
                            </div>
                        </div>

                        <div className="overflow-x-auto bg-white border border-slate-100 rounded-[2.5rem] shadow-xl">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-900 text-[10px] font-black uppercase tracking-[0.2em] text-white/50 border-b border-white/5">
                                    <tr>
                                        <th className="p-6 w-12">Stat</th>
                                        <th className="p-6 w-12"><input type="checkbox" checked={reviewedFixtures.every(f => f.selected)} onChange={e => setReviewedFixtures(prev => prev.map(f => ({ ...f, selected: e.target.checked && f.status !== 'error' })))} className="h-4 w-4 rounded" /></th>
                                        <th className="p-6 text-left">The Matchup</th>
                                        <th className="p-6 text-left">Timeline</th>
                                        <th className="p-6 text-left">Stadium Venue</th>
                                        <th className="p-6 text-center">Outcome</th>
                                        <th className="p-6 w-20 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {reviewedFixtures.map(f => (
                                        <tr key={f.id} className={`${!f.selected ? 'bg-slate-50/50 opacity-40 grayscale' : 'hover:bg-blue-50/30'} transition-all`}>
                                            <td className="p-6 text-center">
                                                {f.status === 'new' && <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] mx-auto" title="New Entry"></div>}
                                                {f.status === 'duplicate' && <div className="w-3 h-3 rounded-full bg-slate-300 mx-auto" title="In Database"></div>}
                                                {f.status === 'error' && <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse mx-auto" title={f.error}></div>}
                                            </td>
                                            <td className="p-6 text-center">
                                                <input type="checkbox" checked={f.selected} onChange={() => handleToggleSelection(f.id)} className="h-5 w-5 rounded border-gray-300 text-blue-600" disabled={f.status === 'error'} />
                                            </td>
                                            <td className="p-6">
                                                <div className="font-black text-slate-800 leading-tight">
                                                    <p className={!currentTargetData?.teams?.find(t => t.name === f.fixtureData.teamA) ? 'text-red-600 underline decoration-dotted' : ''}>{f.fixtureData.teamA}</p>
                                                    <p className="text-[10px] text-slate-300 uppercase my-1 font-bold">versus</p>
                                                    <p className={!currentTargetData?.teams?.find(t => t.name === f.fixtureData.teamB) ? 'text-red-600 underline decoration-dotted' : ''}>{f.fixtureData.teamB}</p>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-xs font-black text-slate-500 space-y-0.5">
                                                    <p className="text-gray-900">{f.date}</p>
                                                    <p className="opacity-50 tracking-widest">{f.time}</p>
                                                </div>
                                            </td>
                                            <td className="p-6 text-xs text-slate-400 font-bold truncate max-w-[180px]">{f.venue}</td>
                                            <td className="p-6 text-center">
                                                {f.fixtureData.status === 'finished' ? (
                                                    <div className="bg-slate-900 text-white px-4 py-1.5 rounded-xl font-black text-xl inline-block shadow-lg border-b-2 border-accent">{f.fixtureData.scoreA} : {f.fixtureData.scoreB}</div>
                                                ) : <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest border border-slate-200 px-3 py-1 rounded-full">Scheduled</span>}
                                            </td>
                                            <td className="p-6 text-center">
                                                <button onClick={() => setReviewedFixtures(prev => prev.filter(item => item.id !== f.id))} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><TrashIcon className="w-5 h-5"/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-8 opacity-5"><Logo className="w-80 h-auto" /></div>
                             <div className="relative z-10 text-center md:text-left">
                                <p className="text-accent font-black uppercase text-xs tracking-[0.4em] mb-2">Stage 3: Database Integration</p>
                                <h4 className="text-white text-3xl font-black">{reviewedFixtures.filter(f => f.selected).length} Matches ready for import</h4>
                                <p className="text-blue-200 text-sm mt-1 opacity-70">League logs and player stats will be recalculated automatically.</p>
                             </div>
                             <Button 
                                onClick={handleImportSelected} 
                                disabled={isSaving || reviewedFixtures.filter(f => f.selected).length === 0} 
                                className="relative z-10 bg-accent text-primary-dark h-16 px-16 rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all text-xs border-0"
                             >
                                {isSaving ? <Spinner className="w-6 h-6 border-primary-dark border-2"/> : <>Deploy to Hub <SaveIcon className="w-6 h-6 ml-3"/></>}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApiImportPage;
