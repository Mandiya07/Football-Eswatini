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
import { doc, runTransaction, getDoc } from 'firebase/firestore';
import { removeUndefinedProps, normalizeTeamName, calculateStandings, superNormalize } from '../../services/utils';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';
import InfoIcon from '../icons/InfoIcon';
import GlobeIcon from '../icons/GlobeIcon';
import TrophyIcon from '../icons/TrophyIcon';
import Logo from '../Logo';

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
    status: 'new' | 'in-hub' | 'update-available' | 'error';
    location?: 'fixtures' | 'results';
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
    const [isRapidApi, setIsRapidApi] = useState(false); 
    
    const [allPotentialTargets, setAllPotentialTargets] = useState<{ id: string, name: string, externalApiId?: string, isHybrid?: boolean }[]>([]);
    const [loadingTargets, setLoadingTargets] = useState(true);
    const [selectedTargetId, setSelectedTargetId] = useState<string>('');
    
    const [season, setSeason] = useState('');
    const [useProxy, setUseProxy] = useState(true);
    const [matchdayOverride, setMatchdayOverride] = useState('');

    // --- AUTOMATIC KEY DETECTION ---
    const systemKeys = useMemo(() => {
        const fdKey = process.env.FOOTBALL_DATA_API_KEY || FAILSAFE_KEYS.footballData;
        const afKey = process.env.API_FOOTBALL_KEY || FAILSAFE_KEYS.apiFootball;
        return { footballData: fdKey, apiFootball: afKey };
    }, []);

    const activeApiKey = useMemo(() => {
        if (apiProvider === 'football-data') return systemKeys.footballData;
        return systemKeys.apiFootball;
    }, [apiProvider, systemKeys]);

    useEffect(() => {
        const now = new Date();
        setSeason(now.getMonth() < 6 ? `${now.getFullYear() - 1}` : `${now.getFullYear()}`);
        loadTargets();
    }, []);

    const loadTargets = async () => {
        setLoadingTargets(true);
        try {
            const [compsData, hybridData] = await Promise.all([
                fetchAllCompetitions(),
                fetchHybridTournaments()
            ]);
            const comps = Object.entries(compsData).map(([id, comp]) => ({ id, name: comp.name, externalApiId: comp.externalApiId, isHybrid: false }));
            const hybrids = hybridData.map(h => ({ id: h.id, name: h.name, externalApiId: h.externalApiId, isHybrid: true }));
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

    const handleFetch = async () => {
        if (!selectedTargetId) return setError('Please select a destination hub.');
        
        setIsFetching(true);
        setError('');
        setReviewedFixtures([]);
        setSuccessMessage('');
        
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
            // CRITICAL: Fetch ABSOLUTE FRESH data from source to prevent stale comparison
            const hubRef = doc(db, target.isHybrid ? 'hybrid_tournaments' : 'competitions', selectedTargetId);
            const hubSnap = await getDoc(hubRef);
            
            if (!hubSnap.exists()) {
                throw new Error("Target Hub document does not exist in the database.");
            }

            const freshHubData = hubSnap.data() as Competition;
            let incomingFixtures: CompetitionFixture[] = [];
            const officialTeamNames = (freshHubData.teams || []).map(t => t.name);

            if (apiProvider === 'api-football') {
                incomingFixtures = await fetchApiFootball(target.externalApiId, activeApiKey, season, importType, useProxy, officialTeamNames, isRapidApi);
            } else {
                incomingFixtures = await fetchFootballDataOrg(target.externalApiId, activeApiKey, season, importType, useProxy, officialTeamNames);
            }

            if (incomingFixtures.length === 0) {
                setError(`API Connection successful, but no ${importType} were found for ID ${target.externalApiId} in season ${season}.`);
            } else {
                const reviewed = processAndReviewFixtures(incomingFixtures, freshHubData, target.isHybrid);
                setReviewedFixtures(reviewed);
                setSuccessMessage(`Synchronized ${reviewed.length} matches. Review the reconciliation queue below.`);
            }
        } catch (err: any) {
            let msg = err.message || 'Unknown network error';
            if (msg.includes('Failed to fetch')) {
                msg = "Network Error: Request blocked by CORS. Please enable 'High-Reliability Tunnel'.";
            }
            if (msg.includes('rateLimit') || msg.includes('Too many requests')) {
                msg = "API Limit Exceeded: You have hit the requests-per-minute limit for your subscription. Please wait a minute before trying again.";
            }
            setError(msg);
        } finally {
            setIsFetching(false);
        }
    };

    const processAndReviewFixtures = (incoming: CompetitionFixture[], hub: Competition, isHybrid: boolean): ReviewedFixture[] => {
        const officialTeamNames = (hub.teams || []).map(t => t.name);
        
        const fixturesArr = hub.fixtures || [];
        const resultsArr = hub.results || [];

        return incoming.map((fixture, idx) => {
            const normIncomingA = superNormalize(fixture.teamA);
            const normIncomingB = superNormalize(fixture.teamB);

            // Look in BOTH fixtures and results
            const inFixtures = fixturesArr.find(f => 
                superNormalize(f.teamA) === normIncomingA && 
                superNormalize(f.teamB) === normIncomingB && 
                f.fullDate === fixture.fullDate
            );

            const inResults = resultsArr.find(r => 
                superNormalize(r.teamA) === normIncomingA && 
                superNormalize(r.teamB) === normIncomingB && 
                r.fullDate === fixture.fullDate
            );

            let status: ReviewedFixture['status'] = 'new';
            let location: ReviewedFixture['location'] = undefined;

            // STRICTOR CHECK: Ensure scores are actually numbers, not null/undefined
            const incomingHasScore = typeof fixture.scoreA === 'number' && typeof fixture.scoreB === 'number';

            if (inResults) {
                location = 'results';
                const hubHasScore = typeof inResults.scoreA === 'number' && typeof inResults.scoreB === 'number';
                
                // If we are importing results, check if the score is actually there
                if (importType === 'results' && incomingHasScore && !hubHasScore) {
                    status = 'update-available';
                } else {
                    status = 'in-hub';
                }
            } else if (inFixtures) {
                location = 'fixtures';
                // If it's in fixtures but we have a score now, it's an update
                if (incomingHasScore) {
                    status = 'update-available';
                } else {
                    status = 'in-hub';
                }
            }

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
                location: location,
                selected: (status === 'new' || status === 'update-available'), 
                fixtureData: { 
                    ...fixture, 
                    teamA: normalizedA || fixture.teamA, 
                    teamB: normalizedB || fixture.teamB,
                    status: (fixture.status === 'finished' || incomingHasScore) ? 'finished' : 'scheduled'
                },
                error: !normalizedA ? `Hub mismatch: "${fixture.teamA}"` : !normalizedB ? `Hub mismatch: "${fixture.teamB}"` : undefined
            };
        });
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
                if (!snap.exists()) throw new Error("Document missing");
                
                const data = snap.data() as Competition;
                const newItems = selected.map(f => ({ 
                    ...f.fixtureData, 
                    matchday: matchdayOverride ? parseInt(matchdayOverride) : f.fixtureData.matchday 
                }));
                
                let fixtures = [...(data.fixtures || [])];
                let results = [...(data.results || [])];

                newItems.forEach(item => {
                    const normA = superNormalize(item.teamA);
                    const normB = superNormalize(item.teamB);

                    // Purge existing records of this specific match from both arrays to prevent duplicates
                    fixtures = fixtures.filter(f => !(superNormalize(f.teamA) === normA && superNormalize(f.teamB) === normB && f.fullDate === item.fullDate));
                    results = results.filter(r => !(superNormalize(r.teamA) === normA && superNormalize(r.teamB) === normB && r.fullDate === item.fullDate));

                    if (item.status === 'finished') {
                        results.push(item);
                    } else {
                        fixtures.push(item);
                    }
                });

                const updatedTeams = calculateStandings(data.teams || [], results, fixtures);
                transaction.update(docRef, removeUndefinedProps({ 
                    fixtures, 
                    results, 
                    teams: updatedTeams 
                }));
            });
            setSuccessMessage(`Successfully committed ${selected.length} matches to the ${target.name} Hub.`);
            setReviewedFixtures([]);
        } catch (err) { 
            setError("Cloud Synchronization Failed."); 
        } finally { 
            setIsSaving(false); 
        }
    };

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
                                <p className="text-blue-100 text-sm opacity-80">Reconcile Hub data with International Providers</p>
                            </div>
                        </div>
                    </div>

                    <CardContent className="p-8 space-y-10">
                        {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 animate-fade-in font-bold text-sm flex items-start gap-3"><AlertTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5"/> {error}</div>}
                        {successMessage && <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 animate-fade-in font-bold text-sm flex items-center gap-3"><CheckCircleIcon className="w-5 h-5"/> {successMessage}</div>}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <label className="block text-xs font-black uppercase text-gray-400 tracking-widest border-b pb-2">1. Provider Configuration</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button onClick={() => setApiProvider('football-data')} className={`p-5 rounded-2xl border-2 transition-all text-left relative overflow-hidden group ${apiProvider === 'football-data' ? 'border-primary bg-blue-50 shadow-xl' : 'border-gray-100 hover:bg-gray-50'}`}>
                                        <div className={`p-2 rounded-lg w-fit mb-3 shadow-md ${systemKeys.footballData ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}><GlobeIcon className="w-5 h-5"/></div>
                                        <p className="font-black text-sm uppercase text-gray-900 tracking-tight">Football-Data.org</p>
                                        <p className="text-[10px] text-gray-400 mt-1">{systemKeys.footballData ? 'Key Detected' : 'No Key'}</p>
                                    </button>
                                    <button onClick={() => setApiProvider('api-football')} className={`p-5 rounded-2xl border-2 transition-all text-left relative overflow-hidden group ${apiProvider === 'api-football' ? 'border-primary bg-blue-50 shadow-xl' : 'border-gray-100 hover:bg-gray-50'}`}>
                                        <div className={`p-2 rounded-lg w-fit mb-3 shadow-md ${systemKeys.apiFootball ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}><TrophyIcon className="w-5 h-5"/></div>
                                        <p className="font-black text-sm uppercase text-gray-900 tracking-tight">API-Football</p>
                                        <p className="text-[10px] text-gray-400 mt-1">{systemKeys.apiFootball ? 'Key Detected' : 'No Key'}</p>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <label className="block text-xs font-black uppercase text-gray-400 tracking-widest border-b pb-2">2. Deployment Settings</label>
                                <div className="space-y-4">
                                    <select value={selectedTargetId} onChange={e => setSelectedTargetId(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500">
                                        <option disabled value="">Select Destination...</option>
                                        {allPotentialTargets.map(t => <option key={t.id} value={t.id}>{t.name} {t.externalApiId ? `(ID: ${t.externalApiId})` : '(No Map)'}</option>)}
                                    </select>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Season</label><input value={season} onChange={e => setSeason(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-xl" placeholder="2024" /></div>
                                        <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Stream</label><select value={importType} onChange={e => setImportType(e.target.value as any)} className="block w-full px-3 py-2 border border-gray-300 rounded-xl"><option value="fixtures">Fixtures</option><option value="results">Results</option></select></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-10 border-t flex flex-col sm:flex-row items-center justify-between gap-6">
                             <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" checked={useProxy} onChange={e => setUseProxy(e.target.checked)} className="h-5 w-5 rounded text-primary focus:ring-primary border-gray-300" />
                                <span className="text-xs font-bold text-gray-500 group-hover:text-primary transition-all">High-Reliability Tunnel (CORS Fix)</span>
                            </label>
                            <Button onClick={handleFetch} disabled={isFetching} className="bg-primary text-white h-16 px-20 rounded-2xl shadow-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all w-full sm:w-auto flex items-center justify-center gap-4">
                                {isFetching ? <Spinner className="w-6 h-6 border-white border-2" /> : <><CloudDownloadIcon className="w-6 h-6 text-accent"/> Fetch Live Data</>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {reviewedFixtures.length > 0 && (
                    <div className="mt-12 space-y-8 animate-fade-in">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                            <div>
                                <h3 className="text-3xl font-black font-display text-slate-900 uppercase tracking-tighter">Reconciliation Queue</h3>
                                <p className="text-slate-500 mt-1">Found {reviewedFixtures.length} matches. Hub mismatches are underlined in red.</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <label className="text-[10px] font-black uppercase text-gray-400">Matchday # Override</label>
                                <input type="number" value={matchdayOverride} onChange={e => setMatchdayOverride(e.target.value)} className="w-20 p-2 border rounded-lg text-sm font-bold text-center bg-gray-50" placeholder="--" />
                            </div>
                        </div>

                        <div className="overflow-x-auto bg-white border border-slate-100 rounded-[2.5rem] shadow-xl">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-900 text-[10px] font-black uppercase tracking-[0.2em] text-white/50 border-b border-white/5">
                                    <tr>
                                        <th className="p-6 text-left">Status</th>
                                        <th className="p-6 w-12"><input type="checkbox" checked={reviewedFixtures.every(f => f.selected || f.status === 'in-hub')} onChange={e => setReviewedFixtures(prev => prev.map(f => ({ ...f, selected: e.target.checked && f.status !== 'error' && f.status !== 'in-hub' })))} className="h-4 w-4 rounded" /></th>
                                        <th className="p-6 text-left">Matchup</th>
                                        <th className="p-6 text-left">Date</th>
                                        <th className="p-6 text-center">Score</th>
                                        <th className="p-6 w-20 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {reviewedFixtures.map(f => (
                                        <tr key={f.id} className={`${!f.selected && f.status !== 'in-hub' ? 'opacity-40 grayscale' : f.status === 'in-hub' ? 'bg-slate-50 opacity-60' : 'hover:bg-blue-50/30'} transition-all`}>
                                            <td className="p-6">
                                                {f.status === 'new' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[9px] font-black uppercase">Missing Record</span>}
                                                {f.status === 'in-hub' && <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-[9px] font-black uppercase flex items-center gap-1"><CheckCircleIcon className="w-3 h-3"/> In Hub ({f.location})</span>}
                                                {f.status === 'update-available' && <span className="bg-blue-600 text-white px-2 py-1 rounded text-[9px] font-black uppercase animate-pulse">Sync Score</span>}
                                                {f.status === 'error' && <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-[9px] font-black uppercase">Hub Mismatch</span>}
                                            </td>
                                            <td className="p-6 text-center">
                                                <input type="checkbox" checked={f.selected} onChange={() => handleToggleSelection(f.id)} className="h-5 w-5 rounded border-gray-300 text-blue-600" disabled={f.status === 'error' || f.status === 'in-hub'} />
                                            </td>
                                            <td className="p-6">
                                                <div className="font-black text-slate-800 leading-tight">
                                                    <p className={f.fixtureData.teamA === f.title.split(' vs ')[0] ? 'text-red-600 underline decoration-2' : ''}>{f.fixtureData.teamA}</p>
                                                    <p className="text-[10px] text-slate-300 my-1 font-bold">vs</p>
                                                    <p className={f.fixtureData.teamB === f.title.split(' vs ')[1] ? 'text-red-600 underline decoration-2' : ''}>{f.fixtureData.teamB}</p>
                                                </div>
                                            </td>
                                            <td className="p-6 text-xs font-black text-slate-500">
                                                <p className="text-gray-900">{f.date}</p>
                                                <p className="opacity-50">{f.time}</p>
                                            </td>
                                            <td className="p-6 text-center">
                                                {(f.fixtureData.scoreA !== undefined) ? (
                                                    <div className="bg-slate-900 text-white px-3 py-1 rounded-lg font-black text-lg">{f.fixtureData.scoreA} : {f.fixtureData.scoreB}</div>
                                                ) : <span className="text-[10px] font-black text-slate-300 uppercase">Scheduled</span>}
                                            </td>
                                            <td className="p-6 text-center">
                                                <button onClick={() => setReviewedFixtures(prev => prev.filter(item => item.id !== f.id))} className="text-slate-300 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-8 opacity-5"><Logo className="w-80 h-auto" /></div>
                             <div className="relative z-10 text-center md:text-left">
                                <p className="text-accent font-black uppercase text-xs tracking-[0.4em] mb-2">Stage 3: Hub Integration</p>
                                <h4 className="text-white text-3xl font-black">{reviewedFixtures.filter(f => f.selected).length} Matches ready for Hub commit</h4>
                             </div>
                             <Button onClick={handleImportSelected} disabled={isSaving || reviewedFixtures.filter(f => f.selected).length === 0} className="relative z-10 bg-accent text-primary-dark h-16 px-16 rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all text-xs border-0">
                                {isSaving ? <Spinner className="w-6 h-6 border-primary-dark border-2"/> : <>Commit to Database <SaveIcon className="w-6 h-6 ml-3"/></>}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </div>
    );
};

export default ApiImportPage;
