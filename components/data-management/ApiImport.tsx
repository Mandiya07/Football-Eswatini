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
import { fetchAllCompetitions, fetchCompetition, handleFirestoreError, Competition, Category, fetchCategories, fetchFootballDataOrg, fetchApiFootball, fetchHybridTournaments, HybridTournament } from '../../services/api';
import { db } from '../../services/firebase';
import { doc, runTransaction, setDoc } from 'firebase/firestore';
import { removeUndefinedProps, normalizeTeamName, calculateStandings, superNormalize } from '../../services/utils';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';
import InfoIcon from '../icons/InfoIcon';
import GlobeIcon from '../icons/GlobeIcon';
import PlusCircleIcon from '../icons/PlusCircleIcon';

interface FetchedEventTSDB {
    idEvent: string;
    strEvent: string;
    strHomeTeam: string;
    strAwayTeam: string;
    dateEvent: string;
    strTime: string;
    intHomeScore: string | null;
    intAwayScore: string | null;
    strVenue?: string;
    intRound?: string;
    strStatus?: string;
}

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

const getMockUpcomingFixtures = (type: 'fixtures' | 'results'): CompetitionFixture[] => {
    const today = new Date();
    const createDate = (daysOffset: number) => {
        const date = new Date(today);
        date.setDate(date.getDate() + daysOffset);
        return date;
    };

    const formatDate = (date: Date) => ({
        fullDate: date.toISOString().split('T')[0],
        date: date.getDate().toString(),
        day: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    });

    if (type === 'results') {
        return [
            {
                id: 8001,
                ...formatDate(createDate(-2)),
                time: '15:00',
                teamA: 'Mbabane Highlanders FC',
                teamB: 'Manzini Wanderers FC',
                status: 'finished',
                scoreA: 2,
                scoreB: 1,
                venue: 'Somhlolo National Stadium',
                matchday: 4,
            },
            {
                id: 8002,
                ...formatDate(createDate(-3)),
                time: '13:00',
                teamA: 'Mbabane Swallows FC',
                teamB: 'Green Mamba FC',
                status: 'finished',
                scoreA: 0,
                scoreB: 0,
                venue: 'King Sobhuza II Stadium',
                matchday: 4,
            },
        ];
    }

    return [
        {
            id: 9001,
            ...formatDate(createDate(2)),
            time: '15:00',
            teamA: 'Mbabane Highlanders FC',
            teamB: 'Manzini Wanderers FC',
            status: 'scheduled',
            venue: 'Somhlolo National Stadium',
            matchday: 5,
        },
        {
            id: 9002,
            ...formatDate(createDate(3)),
            time: '13:00',
            teamA: 'Mbabane Swallows FC',
            teamB: 'Green Mamba FC',
            status: 'scheduled',
            venue: 'King Sobhuza II Stadium',
            matchday: 5,
        },
    ];
};

const ApiImportPage: React.FC = () => {
    const [reviewedFixtures, setReviewedFixtures] = useState<ReviewedFixture[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isFallback, setIsFallback] = useState(false);
    const [importType, setImportType] = useState<'fixtures' | 'results'>('fixtures');
    const [apiProvider, setApiProvider] = useState<'football-data' | 'thesportsdb' | 'api-football'>('football-data');

    const [allPotentialTargets, setAllPotentialTargets] = useState<{ id: string, name: string, externalApiId?: string, isHybrid?: boolean }[]>([]);
    const [loadingTargets, setLoadingTargets] = useState(true);
    const [selectedTargetId, setSelectedTargetId] = useState<string>('');
    const [currentTargetData, setCurrentTargetData] = useState<Competition | HybridTournament | null>(null);
    
    const [showConnectForm, setShowConnectForm] = useState(false);
    const [newConnectForm, setNewConnectForm] = useState({ targetId: '', apiId: '', isHybrid: false });
    const [isConnecting, setIsConnecting] = useState(false);

    const [apiKey, setApiKey] = useState(process.env.FOOTBALL_DATA_API_KEY || '');
    const [season, setSeason] = useState('');
    const [useProxy, setUseProxy] = useState(true);
    const [autoImport, setAutoImport] = useState(false); 

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<CompetitionFixture>>({});

    const [matchday, setMatchday] = useState('');

    useEffect(() => {
        const savedConfig = localStorage.getItem('fe_api_import_config');
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                if (config.apiKey) setApiKey(config.apiKey);
                if (config.season) setSeason(config.season);
                if (config.apiProvider) setApiProvider(config.apiProvider);
                if (config.importType) setImportType(config.importType);
                if (config.useProxy !== undefined) setUseProxy(config.useProxy);
                if (config.autoImport !== undefined) setAutoImport(config.autoImport);
            } catch (e) { console.error(e); }
        } else {
            const now = new Date();
            const seasonStr = now.getMonth() < 6 ? `${now.getFullYear() - 1}-${now.getFullYear()}` : `${now.getFullYear()}-${now.getFullYear() + 1}`;
            setSeason(seasonStr);
        }
    }, []);

    useEffect(() => {
        const config = { apiKey, season, apiProvider, importType, useProxy, autoImport };
        localStorage.setItem('fe_api_import_config', JSON.stringify(config));
    }, [apiKey, season, apiProvider, importType, useProxy, autoImport]);

    const loadTargets = async () => {
        setLoadingTargets(true);
        setError('');
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

            // Default selection to first one with an API ID
            const firstImportable = merged.find(t => t.externalApiId);
            if (firstImportable) setSelectedTargetId(firstImportable.id);
            else if (merged.length > 0) setSelectedTargetId(merged[0].id);

        } catch (err) {
            console.error(err);
            setError("Failed to load target leagues.");
        } finally {
            setLoadingTargets(false);
        }
    };

    useEffect(() => {
        loadTargets();
    }, []);

    useEffect(() => {
        const loadSelectedData = async () => {
            if (!selectedTargetId) return;
            const target = allPotentialTargets.find(t => t.id === selectedTargetId);
            if (!target) return;

            if (target.isHybrid) {
                const hybrids = await fetchHybridTournaments();
                const found = hybrids.find(h => h.id === selectedTargetId);
                setCurrentTargetData(found || null);
            } else {
                const found = await fetchCompetition(selectedTargetId);
                setCurrentTargetData(found || null);
            }
        };
        loadSelectedData();
    }, [selectedTargetId, allPotentialTargets]);

    const handleConnectLeague = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newConnectForm.targetId || !newConnectForm.apiId) return;
        setIsConnecting(true);
        try {
            const target = allPotentialTargets.find(t => t.id === newConnectForm.targetId);
            const collectionName = target?.isHybrid ? 'hybrid_tournaments' : 'competitions';
            
            await setDoc(doc(db, collectionName, newConnectForm.targetId), {
                externalApiId: newConnectForm.apiId
            }, { merge: true });

            setSuccessMessage(`Successfully linked ${target?.name} to API ID: ${newConnectForm.apiId}`);
            setShowConnectForm(false);
            setNewConnectForm({ targetId: '', apiId: '', isHybrid: false });
            await loadTargets();
        } catch (err) {
            handleFirestoreError(err, 'connect league');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleFetch = async () => {
        const target = allPotentialTargets.find(t => t.id === selectedTargetId);
        const externalApiId = target?.externalApiId;

        setIsFetching(true);
        setError('');
        setReviewedFixtures([]);
        setSuccessMessage('');
        setIsFallback(false);
        
        if (!externalApiId) {
            setIsFallback(true);
            const mock = getMockUpcomingFixtures(importType);
            const processedMock = processAndReviewFixtures(mock, "Mock Data");
            setReviewedFixtures(processedMock);
            setIsFetching(false);
            return;
        }

        try {
            let fixtures: CompetitionFixture[] = [];
            let sourceLabel = "Live API";
            const officialTeamNames = (currentTargetData?.teams || []).map(t => t.name);

            if (apiProvider === 'api-football') {
                fixtures = await fetchApiFootball(externalApiId, apiKey, season, importType, useProxy, officialTeamNames);
                sourceLabel = "API-Football";
            } else if (apiProvider === 'thesportsdb') {
                // Implementation of TSDB fetch would go here if needed
                sourceLabel = "TheSportsDB";
            } else {
                fixtures = await fetchFootballDataOrg(externalApiId, apiKey, season, importType, useProxy, officialTeamNames);
                sourceLabel = "Football-Data.org";
            }

            if (fixtures.length === 0) {
                setError(`No ${importType} found for season "${season}".`);
            } else {
                const processed = processAndReviewFixtures(fixtures, sourceLabel);
                setReviewedFixtures(processed);
            }
        } catch (err) {
            setError(`Error: ${(err as Error).message}.`);
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

        const processedFixtures: ReviewedFixture[] = fixturesToProcess.map((fixture) => {
            const existingMatch = existingMatches.find(f => 
                superNormalize(f.teamA) === superNormalize(fixture.teamA) &&
                superNormalize(f.teamB) === superNormalize(fixture.teamB) &&
                f.fullDate === fixture.fullDate
            );

            const isDuplicate = !!existingMatch;
            let status: ReviewedFixture['status'] = 'new';
            let isBetterData = false;

            if (isDuplicate && existingMatch) {
                const dbTime = existingMatch.time || '00:00';
                const newTime = fixture.time || '00:00';
                const statusUpdated = existingMatch.status !== 'finished' && fixture.status === 'finished';
                
                if ((dbTime === '00:00' && newTime !== '00:00') || statusUpdated) {
                    isBetterData = true;
                    status = 'update';
                } else {
                    status = 'duplicate';
                }
            }

            let normalizedA = officialTeamNames.length > 0 ? normalizeTeamName(fixture.teamA, officialTeamNames) : fixture.teamA;
            let normalizedB = officialTeamNames.length > 0 ? normalizeTeamName(fixture.teamB, officialTeamNames) : fixture.teamB;

            const hasError = !normalizedA || !normalizedB;
            if (hasError) status = 'error';

            return {
                id: String(fixture.id),
                title: `${fixture.teamA} vs ${fixture.teamB}`,
                date: fixture.fullDate!,
                time: fixture.time,
                venue: fixture.venue || 'N/A',
                matchday: String(fixture.matchday || ''),
                status: status,
                selected: (!isDuplicate || isBetterData) && !hasError, 
                fixtureData: {
                    ...fixture,
                    teamA: normalizedA || fixture.teamA,
                    teamB: normalizedB || fixture.teamB
                },
                error: !normalizedA ? `Invalid Home: ${fixture.teamA}` : !normalizedB ? `Invalid Away: ${fixture.teamB}` : undefined
            };
        });

        if (source !== "Mock Data") setSuccessMessage(`Fetched ${processedFixtures.length} items from ${source}.`);
        return processedFixtures;
    };

    const handleImportSelected = async () => {
        const target = allPotentialTargets.find(t => t.id === selectedTargetId);
        if (!target || !currentTargetData) return;

        const fixturesToImport = reviewedFixtures.filter(f => f.selected);
        if (fixturesToImport.length === 0) return setError("No items selected.");

        setIsSaving(true);
        try {
            const collectionName = target.isHybrid ? 'hybrid_tournaments' : 'competitions';
            const docRef = doc(db, collectionName, selectedTargetId);

            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Target not found");

                const newItems = fixturesToImport.map(f => ({
                    ...f.fixtureData,
                    matchday: matchday ? parseInt(matchday, 10) : f.fixtureData.matchday
                }));

                if (target.isHybrid) {
                    const data = docSnap.data() as HybridTournament;
                    let existingMatches = [...(data.matches || [])];
                    
                    newItems.forEach(newItem => {
                        const idx = existingMatches.findIndex(m => m.teamA === newItem.teamA && m.teamB === newItem.teamB && m.fullDate === newItem.fullDate);
                        if (idx !== -1) existingMatches[idx] = { ...existingMatches[idx], ...newItem };
                        else existingMatches.push(newItem);
                    });

                    transaction.update(docRef, removeUndefinedProps({ matches: existingMatches }));
                } else {
                    const data = docSnap.data() as Competition;
                    let fixtures = [...(data.fixtures || [])];
                    let results = [...(data.results || [])];

                    newItems.forEach(newItem => {
                        if (importType === 'results') {
                            const idx = results.findIndex(r => r.teamA === newItem.teamA && r.teamB === newItem.teamB && r.fullDate === newItem.fullDate);
                            if (idx !== -1) results[idx] = { ...results[idx], ...newItem };
                            else results.push(newItem);
                            // Remove from fixtures
                            fixtures = fixtures.filter(f => !(f.teamA === newItem.teamA && f.teamB === newItem.teamB && f.fullDate === newItem.fullDate));
                        } else {
                            const idx = fixtures.findIndex(f => f.teamA === newItem.teamA && f.teamB === newItem.teamB && f.fullDate === newItem.fullDate);
                            if (idx !== -1) fixtures[idx] = { ...fixtures[idx], ...newItem };
                            else fixtures.push(newItem);
                        }
                    });

                    const updatedTeams = calculateStandings(data.teams || [], results, fixtures);
                    transaction.update(docRef, removeUndefinedProps({ fixtures, results, teams: updatedTeams }));
                }
            });

            setSuccessMessage(`Successfully imported ${fixturesToImport.length} items to ${target.name}!`);
            setReviewedFixtures([]);
        } catch (err) {
            console.error(err);
            setError("Failed to save data.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveEdit = () => {
        if (!editingId) return;
        setReviewedFixtures(prev => prev.map(f => f.id === editingId ? { 
            ...f, 
            fixtureData: { ...f.fixtureData, ...editFormData },
            date: editFormData.fullDate || f.date,
            time: editFormData.time || f.time,
            selected: true,
            status: 'update'
        } : f));
        setEditingId(null);
    };

    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <Card className="max-w-6xl mx-auto shadow-lg">
                    <CardContent className="p-8 space-y-6">
                        <div className="text-center">
                            <CloudDownloadIcon className="w-12 h-12 mx-auto text-purple-600 mb-2" />
                            <h1 className="text-3xl font-display font-bold">Live Import Studio</h1>
                            <p className="text-gray-600 max-w-3xl mx-auto mt-2">
                                Connect standard leagues or International Hub tournaments to global sports data providers.
                            </p>
                        </div>

                        {successMessage && <div className="p-3 bg-green-100 text-green-800 rounded-md flex items-center gap-2 animate-fade-in"><CheckCircleIcon className="w-5 h-5"/>{successMessage}</div>}
                        {error && <div className="p-3 bg-red-100 text-red-800 rounded-md animate-fade-in">{error}</div>}

                        <div className="space-y-6 pt-4 border-t">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold font-display">Step 1: Configure Source</h2>
                                <Button onClick={() => setShowConnectForm(!showConnectForm)} className="bg-blue-600 text-white text-xs flex items-center gap-2">
                                    <PlusCircleIcon className="w-4 h-4" /> Connect/Link League ID
                                </Button>
                            </div>

                            {showConnectForm && (
                                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 animate-fade-in">
                                    <h3 className="font-bold text-blue-900 mb-4">Link App League to External API</h3>
                                    <form onSubmit={handleConnectLeague} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">Target League (Includes Intl Hub)</label>
                                            <select value={newConnectForm.targetId} onChange={e => setNewConnectForm({...newConnectForm, targetId: e.target.value})} className={inputClass} required>
                                                <option value="">-- Select League --</option>
                                                {allPotentialTargets.map(c => <option key={c.id} value={c.id}>{c.name} {c.isHybrid ? '(Intl)' : ''}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">External API ID (e.g. 2001)</label>
                                            <input value={newConnectForm.apiId} onChange={e => setNewConnectForm({...newConnectForm, apiId: e.target.value})} className={inputClass} placeholder="ID from provider" required />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="submit" disabled={isConnecting} className="bg-blue-600 text-white h-10 px-6">
                                                {isConnecting ? <Spinner className="w-4 h-4" /> : 'Connect'}
                                            </Button>
                                            <Button type="button" onClick={() => setShowConnectForm(false)} className="bg-gray-200 text-gray-700 h-10 px-6">Cancel</Button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                    <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><GlobeIcon className="w-4 h-4"/> API Provider</label>
                                    <div className="flex flex-col gap-2">
                                        <label className={`flex items-center gap-3 p-2 rounded-md cursor-pointer border transition-colors ${apiProvider === 'football-data' ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'hover:bg-gray-50 border-gray-200'}`}>
                                            <input type="radio" name="apiProvider" value="football-data" checked={apiProvider === 'football-data'} onChange={() => setApiProvider('football-data')} className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm font-bold">football-data.org (European/Major)</span>
                                        </label>
                                        <label className={`flex items-center gap-3 p-2 rounded-md cursor-pointer border transition-colors ${apiProvider === 'api-football' ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'hover:bg-gray-50 border-gray-200'}`}>
                                            <input type="radio" name="apiProvider" value="api-football" checked={apiProvider === 'api-football'} onChange={() => setApiProvider('api-football')} className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm font-bold">api-football.com (Global/AFCON/PSL)</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                    <label className="block text-sm font-bold text-gray-700 mb-3">Import Data Type</label>
                                    <div className="flex gap-4 h-full items-start">
                                        <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md cursor-pointer border transition-colors h-full ${importType === 'fixtures' ? 'bg-purple-50 border-purple-300 text-purple-800 font-semibold' : 'hover:bg-gray-50 border-gray-200'}`}>
                                            <input type="radio" name="apiImportType" value="fixtures" checked={importType === 'fixtures'} onChange={() => setImportType('fixtures')} className="h-4 w-4 text-purple-600" />
                                            <span>Upcoming Fixtures</span>
                                        </label>
                                        <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md cursor-pointer border transition-colors h-full ${importType === 'results' ? 'bg-purple-50 border-purple-300 text-purple-800 font-semibold' : 'hover:bg-gray-50 border-gray-200'}`}>
                                            <input type="radio" name="apiImportType" value="results" checked={importType === 'results'} onChange={() => setImportType('results')} className="h-4 w-4 text-purple-600" />
                                            <span>Past Results</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">API Key</label>
                                        <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Season / Year</label>
                                        <input type="text" value={season} onChange={e => setSeason(e.target.value)} placeholder="e.g., 2025" className={inputClass} />
                                    </div>
                                </div>
                            </div>

                            {loadingTargets ? <Spinner /> : (
                                <div className="flex flex-col md:flex-row gap-4 items-end pt-4 border-t border-gray-100">
                                    <div className="flex-grow w-full">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Destination Hub/League</label>
                                        <select value={selectedTargetId} onChange={e => setSelectedTargetId(e.target.value)} className={inputClass}>
                                            {allPotentialTargets.map(t => (
                                                <option key={t.id} value={t.id}>{t.name} {t.externalApiId ? `(Linked: ${t.externalApiId})` : '(No ID Linked)'}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-full md:w-32">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Matchday #</label>
                                        <input type="number" value={matchday} onChange={e => setMatchday(e.target.value)} className={inputClass} placeholder="Optional" />
                                    </div>
                                    <Button onClick={handleFetch} disabled={isFetching || !selectedTargetId} className="bg-purple-600 text-white w-full md:w-auto h-11 px-8 flex justify-center items-center">
                                        {isFetching ? <Spinner className="w-5 h-5 border-2"/> : `Fetch Data`}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {reviewedFixtures.length > 0 && (
                            <div className="space-y-4 pt-4 border-t animate-fade-in">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold font-display">Step 2: Review & Import</h2>
                                    <Button onClick={() => setReviewedFixtures([])} className="bg-red-100 text-red-600 hover:bg-red-200 text-xs px-3 py-1">Clear List</Button>
                                </div>
                                <div className="overflow-x-auto border rounded-lg">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100 text-left">
                                            <tr>
                                                <th className="p-2 w-12"></th>
                                                <th className="p-2">Match</th>
                                                <th className="p-2">Date / Time</th>
                                                {importType === 'results' && <th className="p-2">Score</th>}
                                                <th className="p-2">Status</th>
                                                <th className="p-2 w-24 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {reviewedFixtures.map(f => (
                                                editingId === f.id ? (
                                                    <tr key={f.id} className="bg-blue-50">
                                                        <td colSpan={6} className="p-3">
                                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                                                <div className="col-span-2 grid grid-cols-2 gap-2">
                                                                    <div>
                                                                        <label className="text-xs font-bold text-gray-600">Home</label>
                                                                        <input value={editFormData.teamA} onChange={handleEditChange} name="teamA" className="block w-full text-sm p-1 border border-gray-300 rounded" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-xs font-bold text-gray-600">Away</label>
                                                                        <input value={editFormData.teamB} onChange={handleEditChange} name="teamB" className="block w-full text-sm p-1 border border-gray-300 rounded" />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs font-bold text-gray-600">Date</label>
                                                                    <input type="date" value={editFormData.fullDate} onChange={handleEditChange} name="fullDate" className="block w-full text-sm p-1 border border-gray-300 rounded" />
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Button onClick={handleSaveEdit} className="bg-green-600 text-white text-xs h-8">Apply</Button>
                                                                    <Button onClick={() => setEditingId(null)} className="bg-gray-300 text-gray-800 text-xs h-8">Cancel</Button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    <tr key={f.id} className={`${!f.selected ? 'bg-gray-50 text-gray-500' : 'bg-white'} ${f.status === 'error' ? 'bg-red-50' : ''}`}>
                                                        <td className="p-2 text-center"><input type="checkbox" checked={f.selected} onChange={() => setReviewedFixtures(prev => prev.map(item => item.id === f.id ? {...item, selected: !item.selected} : item))} className="h-4 w-4 rounded" /></td>
                                                        <td className="p-2 font-semibold">
                                                            {f.fixtureData.teamA} vs {f.fixtureData.teamB} 
                                                            {f.error && <span className="text-[10px] font-bold text-red-600 block">{f.error}</span>}
                                                        </td>
                                                        <td className="p-2 text-xs">{f.date} @ {f.time}</td>
                                                        {importType === 'results' && <td className="p-2 font-bold">{f.fixtureData.scoreA ?? '-'} : {f.fixtureData.scoreB ?? '-'}</td>}
                                                        <td className="p-2">
                                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${f.status === 'new' ? 'bg-green-100 text-green-700' : f.status === 'update' ? 'bg-blue-100 text-blue-700' : f.status === 'duplicate' ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-700'}`}>
                                                                {f.status.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            <div className="flex justify-center gap-1">
                                                                <button onClick={() => { setEditingId(f.id); setEditFormData({ ...f.fixtureData }); }} className="p-1.5 bg-blue-50 text-blue-600 rounded"><PencilIcon className="w-4 h-4" /></button>
                                                                <button onClick={() => setReviewedFixtures(prev => prev.filter(item => item.id !== f.id))} className="p-1.5 bg-red-50 text-red-600 rounded"><TrashIcon className="w-4 h-4" /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="text-right">
                                    <Button onClick={handleImportSelected} disabled={isSaving || reviewedFixtures.filter(f => f.selected).length === 0} className="bg-green-600 text-white h-10 px-6 flex justify-center items-center">
                                        {isSaving ? <Spinner className="w-5 h-5 border-2"/> : `Save Selected (${reviewedFixtures.filter(f => f.selected).length})`}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

export default ApiImportPage;