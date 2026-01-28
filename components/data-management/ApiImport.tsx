
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
import SparklesIcon from '../icons/SparklesIcon';
import ShieldCheckIcon from '../icons/ShieldCheckIcon';
import LockIcon from '../icons/LockIcon';
import KeyIcon from '../icons/KeyIcon';

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
    const [apiProvider, setApiProvider] = useState<'football-data' | 'api-football'>('football-data');
    const [apiKey, setApiKey] = useState('');
    const [isRapidApi, setIsRapidApi] = useState(false); 

    const [allPotentialTargets, setAllPotentialTargets] = useState<{ id: string, name: string, externalApiId?: string, isHybrid?: boolean }[]>([]);
    const [loadingTargets, setLoadingTargets] = useState(true);
    const [selectedTargetId, setSelectedTargetId] = useState<string>('');
    const [currentTargetData, setCurrentTargetData] = useState<Competition | HybridTournament | null>(null);
    
    const [showConnectForm, setShowConnectForm] = useState(false);
    const [newConnectForm, setNewConnectForm] = useState({ targetId: '', apiId: '', isHybrid: false });
    const [isConnecting, setIsConnecting] = useState(false);

    const [season, setSeason] = useState('');
    const [useProxy, setUseProxy] = useState(true);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<CompetitionFixture>>({});

    const [matchday, setMatchday] = useState('');

    useEffect(() => {
        const savedConfig = localStorage.getItem('fe_api_import_config');
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                if (config.season) setSeason(config.season);
                if (config.apiProvider) setApiProvider(config.apiProvider);
                if (config.apiKey) setApiKey(config.apiKey);
                if (config.importType) setImportType(config.importType);
                if (config.useProxy !== undefined) setUseProxy(config.useProxy);
                if (config.isRapidApi !== undefined) setIsRapidApi(config.isRapidApi);
            } catch (e) { console.error(e); }
        } else {
            const now = new Date();
            const seasonStr = now.getMonth() < 6 ? `${now.getFullYear() - 1}` : `${now.getFullYear()}`;
            setSeason(seasonStr);
        }
    }, []);

    useEffect(() => {
        const config = { season, apiProvider, apiKey, importType, useProxy, isRapidApi };
        localStorage.setItem('fe_api_import_config', JSON.stringify(config));
    }, [season, apiProvider, apiKey, importType, useProxy, isRapidApi]);

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
        if (!apiKey) {
            setError(`Please enter your API Key for ${apiProvider}.`);
            return;
        }

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
                fixtures = await fetchApiFootball(externalApiId, apiKey, season, importType, useProxy, officialTeamNames, isRapidApi);
                sourceLabel = isRapidApi ? "API-Football (RapidAPI)" : "API-Football (Native)";
            } else {
                fixtures = await fetchFootballDataOrg(externalApiId, apiKey, season, importType, useProxy, officialTeamNames);
                sourceLabel = "Football-Data.org";
            }

            if (fixtures.length === 0) {
                setError(`No ${importType} found. Ensure API ID ${externalApiId} and Season ${season} are correct for this provider.`);
            } else {
                const processed = processAndReviewFixtures(fixtures, sourceLabel);
                setReviewedFixtures(processed);
            }
        } catch (err: any) {
            let userMsg = `Fetch Error: ${err.message}`;
            if (err.message.includes('403')) {
                userMsg = "Access Forbidden (403). Mismatch between Key and Account Type (Native vs RapidAPI).";
            } else if (err.message.includes('429')) {
                userMsg = "Rate Limit Exceeded (429). Too many requests. Please wait.";
            } else if (err.message.includes('Network Error')) {
                userMsg = "Network Connection Error. Try toggling the 'High-Reliability Proxy' setting.";
            }
            setError(userMsg);
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
        } as any : f));
        setEditingId(null);
    };

    const inputClass = "block w-full px-3 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition-all";

    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <Card className="max-w-6xl mx-auto shadow-lg">
                    <CardContent className="p-8 space-y-6">
                        <div className="text-center">
                            <CloudDownloadIcon className="w-12 h-12 mx-auto text-purple-600 mb-2" />
                            <h1 className="text-3xl font-display font-bold">Live Import Studio</h1>
                            <p className="text-gray-600 max-w-3xl mx-auto mt-2">
                                Connect to global sports databases to automatically populate local league fixtures and results.
                            </p>
                        </div>

                        {successMessage && <div className="p-3 bg-green-100 text-green-800 rounded-md flex items-center gap-2 animate-fade-in"><CheckCircleIcon className="w-5 h-5"/>{successMessage}</div>}
                        
                        {error && (
                            <div className="p-4 bg-red-100 text-red-800 rounded-xl animate-fade-in flex flex-col gap-2">
                                <div className="flex items-start gap-2">
                                    <AlertTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <span className="font-bold">{error}</span>
                                </div>
                            </div>
                        )}

                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-4">
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest">1. Provider Integration</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => setApiProvider('football-data')}
                                            className={`p-3 rounded-xl border-2 transition-all text-sm font-bold text-left ${apiProvider === 'football-data' ? 'border-primary bg-white shadow-md text-primary' : 'border-gray-200 text-gray-500'}`}
                                        >
                                            Football-Data.org
                                        </button>
                                        <button 
                                            onClick={() => setApiProvider('api-football')}
                                            className={`p-3 rounded-xl border-2 transition-all text-sm font-bold text-left ${apiProvider === 'api-football' ? 'border-primary bg-white shadow-md text-primary' : 'border-gray-200 text-gray-500'}`}
                                        >
                                            API-Football
                                        </button>
                                    </div>
                                    
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                            <KeyIcon className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <input 
                                            type="password" 
                                            value={apiKey} 
                                            onChange={e => setApiKey(e.target.value)} 
                                            className={`${inputClass} pl-11`} 
                                            placeholder="Enter API Key / Token" 
                                        />
                                    </div>

                                    {apiProvider === 'api-football' && (
                                        <div className="bg-white p-4 rounded-xl border border-gray-100 animate-fade-in">
                                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">API Account Type</label>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => setIsRapidApi(false)}
                                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isRapidApi ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500'}`}
                                                >
                                                    Native (api-sports.io)
                                                </button>
                                                <button 
                                                    onClick={() => setIsRapidApi(true)}
                                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isRapidApi ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500'}`}
                                                >
                                                    RapidAPI (rapidapi.com)
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 space-y-4">
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest">2. Target Destination</label>
                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            <select 
                                                value={selectedTargetId} 
                                                onChange={e => setSelectedTargetId(e.target.value)} 
                                                className={inputClass}
                                            >
                                                <option disabled value="">-- Choose Target League --</option>
                                                {allPotentialTargets.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name} {t.externalApiId ? `(API: ${t.externalApiId})` : '(No API Link)'}</option>
                                                ))}
                                            </select>
                                            <button onClick={() => setShowConnectForm(!showConnectForm)} className="bg-white border p-2.5 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-primary transition-colors h-[42px]" title="Link or Update API ID">
                                                <SparklesIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Season</label>
                                                <input value={season} onChange={e => setSeason(e.target.value)} className={inputClass} placeholder="2024" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Data Mode</label>
                                                <select value={importType} onChange={e => setImportType(e.target.value as any)} className={inputClass}>
                                                    <option value="fixtures">Upcoming Fixtures</option>
                                                    <option value="results">Recent Results</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {showConnectForm && (
                                <div className="p-5 bg-blue-900 text-white rounded-2xl animate-fade-in shadow-2xl">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="font-bold">Link League to Global Provider</h4>
                                        <button onClick={() => setShowConnectForm(false)} className="text-white/40 hover:text-white"><XIcon className="w-5 h-5"/></button>
                                    </div>
                                    <form onSubmit={handleConnectLeague} className="flex flex-col sm:flex-row gap-3 items-end">
                                        <div className="flex-grow space-y-2">
                                            <label className="text-[10px] font-black uppercase opacity-60">1. Select Destination</label>
                                            <select 
                                                value={newConnectForm.targetId} 
                                                onChange={e => {
                                                    const target = allPotentialTargets.find(t => t.id === e.target.value);
                                                    setNewConnectForm({...newConnectForm, targetId: e.target.value, isHybrid: !!target?.isHybrid});
                                                }}
                                                className="w-full bg-white/10 border border-white/20 rounded-xl p-2.5 text-sm"
                                                required
                                            >
                                                <option value="" className="text-gray-900">-- Choose Local Hub --</option>
                                                {allPotentialTargets.map(t => <option key={t.id} value={t.id} className="text-gray-900">{t.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex-grow space-y-2">
                                            <label className="text-[10px] font-black uppercase opacity-60">2. Provider ID</label>
                                            <input 
                                                value={newConnectForm.apiId} 
                                                onChange={e => setNewConnectForm({...newConnectForm, apiId: e.target.value})}
                                                className="w-full bg-white/10 border border-white/20 rounded-xl p-2.5 text-sm" 
                                                placeholder="e.g. 2021"
                                                required 
                                            />
                                        </div>
                                        <Button type="submit" disabled={isConnecting} className="bg-accent text-primary-dark font-black h-10 px-6">
                                            {isConnecting ? <Spinner className="w-4 h-4 border-primary-dark" /> : 'Link API'}
                                        </Button>
                                    </form>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={useProxy} onChange={e => setUseProxy(e.target.checked)} className="h-5 w-5 rounded text-primary focus:ring-primary" />
                                        <span className="text-xs font-bold text-gray-500 group-hover:text-primary transition-colors">High-Reliability Proxy</span>
                                    </label>
                                </div>
                                <Button onClick={handleFetch} disabled={isFetching} className="bg-primary text-white h-12 px-12 rounded-xl shadow-xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all w-full sm:w-auto flex items-center justify-center gap-2">
                                    {isFetching ? <Spinner className="w-5 h-5 border-white border-2" /> : <><CloudDownloadIcon className="w-5 h-5"/> Fetch Remote Feed</>}
                                </Button>
                            </div>
                        </div>

                        {reviewedFixtures.length > 0 && (
                            <div className="space-y-6 pt-10 border-t animate-fade-in">
                                <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
                                    <div>
                                        <h3 className="text-2xl font-bold font-display text-gray-900">3. Review and Reconcile</h3>
                                        <p className="text-sm text-gray-500">Syncing to <span className="font-bold">{allPotentialTargets.find(t => t.id === selectedTargetId)?.name}</span>. Verify names and details before final import.</p>
                                    </div>
                                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                                        <label className="text-[10px] font-black uppercase text-gray-400">Matchday Overwrite (Optional)</label>
                                        <input type="number" value={matchday} onChange={e => setMatchday(e.target.value)} className="p-2 border rounded-lg text-sm w-full" placeholder="Set global matchday #" />
                                    </div>
                                </div>

                                <div className="overflow-x-auto border border-gray-100 rounded-3xl bg-white shadow-inner">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b">
                                            <tr>
                                                <th className="p-4 w-12 text-center">Status</th>
                                                <th className="p-4 w-12"><input type="checkbox" checked={reviewedFixtures.every(f => f.selected)} onChange={e => setReviewedFixtures(prev => prev.map(f => ({ ...f, selected: e.target.checked && f.status !== 'error' })))} className="h-4 w-4" /></th>
                                                <th className="p-4 text-left">Matchup</th>
                                                <th className="p-4 text-left">Date / Time</th>
                                                <th className="p-4 text-left">Venue</th>
                                                <th className="p-4 text-center">Score / Type</th>
                                                <th className="p-4 w-20 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {reviewedFixtures.map(f => (
                                                <tr key={f.id} className={`${!f.selected ? 'bg-gray-50/50 grayscale-[0.5] opacity-60' : 'hover:bg-blue-50/30 transition-colors'} ${f.status === 'error' ? 'bg-red-50/50' : ''}`}>
                                                    <td className="p-4 text-center">
                                                        <div className="flex justify-center">
                                                            {f.status === 'new' && <div className="w-2 h-2 rounded-full bg-green-500" title="New Entry"></div>}
                                                            {f.status === 'duplicate' && <div className="w-2 h-2 rounded-full bg-gray-300" title="Exact Duplicate"></div>}
                                                            {f.status === 'update' && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="Updated Data Available"></div>}
                                                            {f.status === 'error' && <div className="w-2 h-2 rounded-full bg-red-600" title={f.error || 'Team Name Mismatch'}></div>}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={f.selected} 
                                                            onChange={() => setReviewedFixtures(prev => prev.map(item => item.id === f.id ? { ...item, selected: !item.selected } : item))} 
                                                            className="h-4 w-4"
                                                            disabled={f.status === 'error'}
                                                        />
                                                    </td>
                                                    <td className="p-4">
                                                        {editingId === f.id ? (
                                                            <div className="space-y-2">
                                                                <input name="teamA" value={editFormData.teamA} onChange={handleEditChange} className="w-full text-xs p-1.5 border rounded" />
                                                                <input name="teamB" value={editFormData.teamB} onChange={handleEditChange} className="w-full text-xs p-1.5 border rounded" />
                                                            </div>
                                                        ) : (
                                                            <div className="font-bold text-gray-800 leading-tight">
                                                                <p className={!currentTargetData?.teams?.find(t => t.name === f.fixtureData.teamA) ? 'text-red-600 underline decoration-dotted' : ''}>{f.fixtureData.teamA}</p>
                                                                <p className="text-[10px] text-gray-400 font-medium py-0.5">vs</p>
                                                                <p className={!currentTargetData?.teams?.find(t => t.name === f.fixtureData.teamB) ? 'text-red-600 underline decoration-dotted' : ''}>{f.fixtureData.teamB}</p>
                                                            </div>
                                                        )}
                                                        {f.error && <p className="text-[9px] text-red-500 font-bold mt-1 uppercase">Error: {f.error}</p>}
                                                    </td>
                                                    <td className="p-4">
                                                        {editingId === f.id ? (
                                                            <div className="space-y-2">
                                                                <input type="date" name="fullDate" value={editFormData.fullDate} onChange={handleEditChange} className="w-full text-xs p-1 border rounded" />
                                                                <input type="time" name="time" value={editFormData.time} onChange={handleEditChange} className="w-full text-xs p-1 border rounded" />
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs font-semibold text-gray-600">
                                                                <p>{f.date}</p>
                                                                <p className="opacity-50">{f.time}</p>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="text-xs text-gray-500 line-clamp-1">{f.venue}</p>
                                                    </td>
                                                    <td className="p-4 text-center font-black">
                                                        {f.fixtureData.status === 'finished' ? (
                                                            <span className="text-green-600">{f.fixtureData.scoreA} - {f.fixtureData.scoreB}</span>
                                                        ) : (
                                                            <span className="text-gray-300 uppercase text-[10px]">Upcoming</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex justify-center gap-2">
                                                            {editingId === f.id ? (
                                                                <button onClick={handleSaveEdit} className="p-1.5 bg-green-600 text-white rounded-lg shadow-md"><SaveIcon className="w-4 h-4"/></button>
                                                            ) : (
                                                                <button onClick={() => { setEditingId(f.id); setEditFormData({ ...f.fixtureData }); }} className="p-1.5 bg-gray-100 text-gray-500 hover:bg-blue-600 hover:text-white rounded-lg transition-all"><PencilIcon className="w-4 h-4"/></button>
                                                            )}
                                                            <button onClick={() => setReviewedFixtures(prev => prev.filter(item => item.id !== f.id))} className="p-1.5 bg-gray-100 text-gray-500 hover:bg-red-600 hover:text-white rounded-lg transition-all"><TrashIcon className="w-4 h-4"/></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between items-center bg-indigo-900 text-white p-6 rounded-3xl shadow-2xl gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white/20 p-3 rounded-2xl"><CheckCircleIcon className="w-8 h-8 text-white"/></div>
                                        <div>
                                            <p className="text-xl font-bold">{reviewedFixtures.filter(f => f.selected).length} Matches Ready</p>
                                            <p className="text-indigo-200 text-xs">These will be merged into the current league database.</p>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={handleImportSelected} 
                                        disabled={isSaving || reviewedFixtures.filter(f => f.selected).length === 0} 
                                        className="bg-accent text-primary-dark h-14 px-12 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all w-full sm:w-auto flex items-center justify-center gap-3"
                                    >
                                        {isSaving ? <Spinner className="w-5 h-5 border-primary-dark border-2"/> : <>Commit to Database <SaveIcon className="w-5 h-5"/></>}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                <div className="mt-12 p-8 bg-white rounded-[2rem] shadow-sm border border-gray-100 max-w-4xl mx-auto">
                    <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <InfoIcon className="w-5 h-5 text-blue-600" /> API Integration Guide
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <h5 className="font-black text-[10px] uppercase text-gray-400 tracking-widest">Setup Steps</h5>
                            <ol className="text-sm text-gray-600 space-y-4">
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">1</span>
                                    <p>Login to <strong>{apiProvider === 'api-football' ? 'api-sports.io' : 'football-data.org'}</strong> and retrieve your token.</p>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">2</span>
                                    <p>Find the <strong>League ID</strong> from the provider's documentation.</p>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">3</span>
                                    <p>Use the "Link" button (sparkle icon) to map the provider ID to your local competition hub.</p>
                                </li>
                            </ol>
                        </div>
                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                             <h5 className="font-black text-[10px] uppercase text-gray-400 tracking-widest mb-4">Troubleshooting</h5>
                             <div className="space-y-3">
                                <div className="text-xs text-gray-700">
                                    <p className="font-bold text-red-600 mb-1">Mismatch Error (4xSe)?</p>
                                    <p>This happens on API-Football if you use a RapidAPI key without selecting the "RapidAPI" toggle in Provider Settings.</p>
                                </div>
                                <div className="text-xs text-gray-700">
                                    <p className="font-bold text-orange-600 mb-1">CORS / Timeouts?</p>
                                    <p>Ensure "High-Reliability Proxy" is enabled. Browsers block direct requests to most sports APIs for security.</p>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiImportPage;
