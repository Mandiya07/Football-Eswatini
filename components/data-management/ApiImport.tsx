
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import CloudDownloadIcon from '../icons/CloudDownloadIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
// FIX: Changed imports to correct sources for Category, fetchCategories and Competition to resolve type errors.
import { CompetitionFixture } from '../../data/teams';
import { fetchAllCompetitions, fetchCompetition, handleFirestoreError, Competition, Category, fetchCategories } from '../../services/api';
import { db } from '../../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { removeUndefinedProps, normalizeTeamName, calculateStandings } from '../../services/utils';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';
import InfoIcon from '../icons/InfoIcon';

// Fetched fixture from football-data.org
interface FetchedFixture {
    id: number;
    utcDate: string;
    status: string;
    homeTeam: { name: string; };
    awayTeam: { name: string; };
    score?: {
        fullTime: {
            home: number | null;
            away: number | null;
        }
    };
    venue?: string;
    matchday: number;
}

interface ReviewedFixture {
    id: string;
    title: string;
    date: string;
    time: string;
    venue: string;
    matchday: string;
    status: 'new' | 'duplicate' | 'importing' | 'imported';
    selected: boolean;
    fixtureData: CompetitionFixture;
}

const getMockUpcomingFixtures = (type: 'fixtures' | 'results'): CompetitionFixture[] => {
    // Returns a static list of mock fixtures to be used as a fallback.
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
        {
            id: 9003,
            ...formatDate(createDate(4)),
            time: '15:00',
            teamA: 'Royal Leopards FC',
            teamB: 'Young Buffaloes FC',
            status: 'scheduled',
            venue: 'Mavuso Sports Centre',
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

    const [competitions, setCompetitions] = useState<{ id: string, name: string, externalApiId?: string }[]>([]);
    const [loadingComps, setLoadingComps] = useState(true);
    const [selectedCompId, setSelectedCompId] = useState<string>('');
    const [currentCompetition, setCurrentCompetition] = useState<Competition | null>(null);
    
    // API Configuration State
    const [apiKey, setApiKey] = useState('');
    const [useProxy, setUseProxy] = useState(true);

    useEffect(() => {
        const loadAppCompetitions = async () => {
            setLoadingComps(true);
            setError('');
            
            try {
                const [allCompsData, allCategories] = await Promise.all([
                    fetchAllCompetitions(),
                    fetchCategories()
                ]);
    
                const allComps = Object.entries(allCompsData)
                    .map(([id, comp]) => ({ 
                        id, 
                        name: comp.name, 
                        externalApiId: comp.externalApiId,
                        categoryId: comp.categoryId
                    }));
                
                const internationalCategory = allCategories.find(cat => 
                    cat.name.toLowerCase().includes('international')
                );
    
                if (!internationalCategory) {
                    setCompetitions([]);
                    setSelectedCompId('');
                    setLoadingComps(false);
                    return;
                }
    
                const internationalCompetitions = allComps.filter(comp => 
                    comp.categoryId === internationalCategory.id && comp.externalApiId
                );
    
                setCompetitions(internationalCompetitions);
                
                if (internationalCompetitions.length > 0) {
                    setSelectedCompId(internationalCompetitions[0].id);
                } else {
                    setSelectedCompId('');
                }
            } catch (err) {
                console.error("Failed to load competition data:", err);
                setError("Failed to load competition data. Please try again later.");
            } finally {
                setLoadingComps(false);
            }
        };
        loadAppCompetitions();
    }, []);

    useEffect(() => {
        const loadCompetitionDetails = async () => {
            if (!selectedCompId) {
                setCurrentCompetition(null);
                return;
            };
            const data = await fetchCompetition(selectedCompId);
            setCurrentCompetition(data);
        };
        loadCompetitionDetails();
    }, [selectedCompId]);

    const processAndReviewFixtures = (fixturesToProcess: CompetitionFixture[], source: string) => {
        if (!currentCompetition) {
            setError("Could not load current competition details for duplicate checking.");
            return;
        }

        const existingMatches = [...(currentCompetition.fixtures || []), ...(currentCompetition.results || [])];

        const processedFixtures: ReviewedFixture[] = fixturesToProcess.map((fixture) => {
            const isDuplicate = existingMatches.some(f => 
                f.teamA === fixture.teamA &&
                f.teamB === fixture.teamB &&
                f.fullDate === fixture.fullDate
            );

            return {
                id: String(fixture.id),
                title: `${fixture.teamA} vs ${fixture.teamB}`,
                date: fixture.fullDate!,
                time: fixture.time,
                venue: fixture.venue || 'N/A',
                matchday: String(fixture.matchday),
                status: isDuplicate ? 'duplicate' : 'new',
                selected: !isDuplicate,
                fixtureData: fixture
            };
        });

        setReviewedFixtures(processedFixtures);
        if (source === "Live API") {
            setSuccessMessage(`Successfully processed ${processedFixtures.length} ${importType} from ${source}.`);
        }
    };
    
    const handleFetch = async () => {
        const selectedCompetition = competitions.find(c => c.id === selectedCompId);
        const externalApiId = selectedCompetition?.externalApiId;

        setIsFetching(true);
        setError('');
        setReviewedFixtures([]);
        setSuccessMessage('');
        setIsFallback(false);
        
        if (!externalApiId) {
            console.warn(`No external API ID for ${selectedCompetition?.name}. Activating fallback mode.`);
            setIsFallback(true);
            processAndReviewFixtures(getMockUpcomingFixtures(importType), "Fallback Data");
            setIsFetching(false);
            return;
        }

        try {
            const statusQuery = importType === 'fixtures' ? 'SCHEDULED' : 'FINISHED';
            let url = `https://api.football-data.org/v4/competitions/${externalApiId}/matches?status=${statusQuery}`;
            
            // If using a proxy (essential for frontend-only requests to avoid CORS)
            if (useProxy) {
                url = `https://corsproxy.io/?${encodeURIComponent(url)}`;
            }

            const headers: HeadersInit = {};
            if (apiKey) {
                headers['X-Auth-Token'] = apiKey;
            }

            const response = await fetch(url, { headers });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API Error (${response.status}): ${errorData.message || 'Failed to fetch data. Check your API Key or Proxy settings.'}`);
            }

            const data = await response.json();
            const fetchedEvents: FetchedFixture[] = data.matches;

            if (fetchedEvents.length === 0) {
                setSuccessMessage(`No ${importType} found from the live API.`);
                setIsFetching(false);
                return;
            }
            
            const officialTeamNames = (currentCompetition?.teams || []).map(t => t.name);

            const fixturesToReview: CompetitionFixture[] = fetchedEvents.map(event => {
                const eventDate = new Date(event.utcDate);

                const normalizedTeamA = normalizeTeamName(event.homeTeam.name, officialTeamNames);
                const normalizedTeamB = normalizeTeamName(event.awayTeam.name, officialTeamNames);

                if (!normalizedTeamA || !normalizedTeamB) {
                    console.warn(`Could not reliably match team names for fixture: "${event.homeTeam.name}" vs "${event.awayTeam.name}". Skipping import.`);
                    return null;
                }
                
                const fixture: CompetitionFixture = {
                    id: event.id,
                    teamA: normalizedTeamA,
                    teamB: normalizedTeamB,
                    fullDate: eventDate.toISOString().split('T')[0],
                    date: eventDate.getDate().toString(),
                    day: eventDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
                    time: eventDate.toTimeString().substring(0, 5),
                    venue: event.venue || undefined,
                    matchday: event.matchday,
                    status: importType === 'results' ? 'finished' : 'scheduled',
                    scoreA: importType === 'results' ? (event.score?.fullTime.home ?? undefined) : undefined,
                    scoreB: importType === 'results' ? (event.score?.fullTime.away ?? undefined) : undefined,
                };
                return fixture;
            }).filter((f): f is CompetitionFixture => f !== null);

            processAndReviewFixtures(fixturesToReview, "Live API");

        } catch (err) {
            console.warn("Live API fetch failed. Activating fallback mode.", err);
            setError(`Error: ${(err as Error).message}. Switching to mock data.`);
            setIsFallback(true);
            const mockData = getMockUpcomingFixtures(importType);
            processAndReviewFixtures(mockData, "Fallback Data");
        } finally {
            setIsFetching(false);
        }
    };


     const handleToggleSelection = (id: string) => {
        setReviewedFixtures(prev => prev.map(f => f.id === id ? { ...f, selected: !f.selected } : f));
    };

    const handleImportSelected = async () => {
        const fixturesToImport = reviewedFixtures.filter(f => f.selected && f.status === 'new');
        if (fixturesToImport.length === 0) {
            setError("No new items selected for import.");
            return;
        }

        setIsSaving(true);
        setError('');

        setReviewedFixtures(prev => prev.map(f => f.selected && f.status === 'new' ? {...f, status: 'importing'} : f));
        
        try {
            const docRef = doc(db, 'competitions', selectedCompId);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Competition not found");

                const competitionData = docSnap.data() as Competition;
                const newItems = fixturesToImport.map(f => f.fixtureData);

                if (importType === 'results') {
                    const existingResults = competitionData.results || [];
                    const finalResults = [...existingResults, ...newItems];
                    const updatedTeams = calculateStandings(competitionData.teams || [], finalResults, competitionData.fixtures || []);
                    
                    transaction.update(docRef, removeUndefinedProps({ 
                        results: finalResults,
                        teams: updatedTeams
                    }));
                } else {
                    const existingFixtures = competitionData.fixtures || [];
                    const finalFixtures = [...existingFixtures, ...newItems];
                    transaction.update(docRef, { fixtures: removeUndefinedProps(finalFixtures) });
                }
            });

            setReviewedFixtures(prev => prev.map(f => f.status === 'importing' ? {...f, status: 'imported', selected: false} : f));
            setSuccessMessage(`Successfully imported ${fixturesToImport.length} ${importType}!`);
        } catch(err) {
            handleFirestoreError(err, `import ${importType}`);
            setError('An error occurred during import. See alert for details.');
            setReviewedFixtures(prev => prev.map(f => f.status === 'importing' ? {...f, status: 'new'} : f));
        } finally {
            setIsSaving(false);
        }
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <Card className="max-w-6xl mx-auto shadow-lg">
                    <CardContent className="p-8 space-y-6">
                        <div className="text-center">
                            <CloudDownloadIcon className="w-12 h-12 mx-auto text-purple-600 mb-2" />
                            <h1 className="text-3xl font-display font-bold">Live Fixture & Result Import</h1>
                            <p className="text-gray-600 max-w-3xl mx-auto mt-2">
                                Fetch upcoming fixtures or recent results directly from <strong>football-data.org</strong>. 
                            </p>
                        </div>

                        {isFallback && (
                            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 animate-fade-in">
                                <p className="font-bold flex items-center gap-2"><AlertTriangleIcon className="w-5 h-5"/>Live API Unreachable</p>
                                <p className="text-sm mt-1">
                                    {error || "The request to the live API was blocked or failed. This is likely a CORS policy issue or an invalid API ID. As a demonstration, the application has loaded mock data instead."}
                                </p>
                            </div>
                        )}
                        
                        {successMessage && !error && !isFallback && <div className="p-3 bg-green-100 text-green-800 rounded-md animate-fade-in">{successMessage}</div>}
                        {error && !isFallback && <div className="p-3 bg-red-100 text-red-800 rounded-md animate-fade-in">{error}</div>}

                        <div className="space-y-4 pt-4 border-t">
                            <h2 className="text-xl font-bold font-display">Step 1: Configure & Fetch</h2>
                            
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <label className="block text-sm font-bold text-blue-800 mb-2">Import Type</label>
                                <div className="flex gap-2 p-1 bg-white rounded-lg w-fit border border-blue-100">
                                    <label className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${importType === 'fixtures' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-50'}`}>
                                        <input type="radio" name="apiImportType" value="fixtures" checked={importType === 'fixtures'} onChange={() => setImportType('fixtures')} className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-semibold">Fixtures</span>
                                    </label>
                                    <label className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${importType === 'results' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-50'}`}>
                                        <input type="radio" name="apiImportType" value="results" checked={importType === 'results'} onChange={() => setImportType('results')} className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-semibold">Results</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="api-key" className="block text-xs font-bold text-gray-700 uppercase mb-1">API Key (football-data.org)</label>
                                    <input 
                                        id="api-key" 
                                        type="password" 
                                        value={apiKey} 
                                        onChange={e => setApiKey(e.target.value)} 
                                        placeholder="Enter your API Key" 
                                        className={inputClass}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Optional for some free tiers, but recommended.</p>
                                </div>
                                <div className="flex items-center">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={useProxy} 
                                            onChange={e => setUseProxy(e.target.checked)} 
                                            className="h-4 w-4 text-blue-600 rounded"
                                        />
                                        <span className="text-sm font-semibold text-gray-700">Use CORS Proxy</span>
                                    </label>
                                    <p className="text-xs text-gray-500 ml-2">(Required for browser-based requests)</p>
                                </div>
                            </div>

                            {loadingComps ? <Spinner /> : (
                                <div className="space-y-4">
                                    {competitions.length > 0 ? (
                                        <div className="flex flex-col md:flex-row gap-4 items-end">
                                            <div className="flex-grow">
                                                <label htmlFor="league-select" className="block text-sm font-medium text-gray-700 mb-1">Destination League</label>
                                                <select id="league-select" value={selectedCompId} onChange={e => setSelectedCompId(e.target.value)} className={inputClass}>
                                                    {competitions.map(comp => (
                                                        <option key={comp.id} value={comp.id}>
                                                            {comp.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <Button onClick={handleFetch} disabled={isFetching || !selectedCompId} title={!selectedCompId ? "Please select a destination league" : `Fetch ${importType}`} className="bg-purple-600 text-white w-full md:w-auto h-11 px-8 flex justify-center items-center">
                                                {isFetching ? <Spinner className="w-5 h-5 border-2"/> : `Fetch ${importType.charAt(0).toUpperCase() + importType.slice(1)}`}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-gray-100 text-gray-700 rounded-md text-sm">
                                            <p className="font-semibold flex items-center gap-2"><InfoIcon className="w-5 h-5"/>No Importable International Leagues Found</p>
                                            <p className="mt-1">To use this feature, ensure competitions are assigned to an 'International' category and have an 'External API ID' set in the Admin Panel.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {reviewedFixtures.length > 0 && (
                            <div className="space-y-4 pt-4 border-t animate-fade-in">
                                <h2 className="text-xl font-bold font-display">Step 2: Review & Import</h2>
                                <div className="overflow-x-auto border rounded-lg">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100 text-left">
                                            <tr>
                                                <th className="p-2 w-12"></th>
                                                <th className="p-2">Match</th>
                                                <th className="p-2">Date</th>
                                                <th className="p-2">Matchday</th>
                                                {importType === 'results' && <th className="p-2">Score</th>}
                                                <th className="p-2">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {reviewedFixtures.map(f => (
                                                <tr key={f.id} className={`${!f.selected ? 'bg-gray-50 text-gray-500' : 'bg-white'}`}>
                                                    <td className="p-2 text-center"><input type="checkbox" checked={f.selected} onChange={() => handleToggleSelection(f.id)} className="h-4 w-4 rounded" disabled={f.status === 'imported'} /></td>
                                                    <td className="p-2 font-semibold">{f.fixtureData.teamA} vs {f.fixtureData.teamB}</td>
                                                    <td className="p-2">{f.date} @ {f.time}</td>
                                                    <td className="p-2 text-center">{f.matchday}</td>
                                                    {importType === 'results' && (
                                                        <td className="p-2 font-bold">
                                                            {f.fixtureData.scoreA !== undefined ? f.fixtureData.scoreA : '-'} : {f.fixtureData.scoreB !== undefined ? f.fixtureData.scoreB : '-'}
                                                        </td>
                                                    )}
                                                    <td className="p-2">
                                                        {f.status === 'new' && <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">New</span>}
                                                        {f.status === 'duplicate' && <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 inline-flex items-center gap-1"><AlertTriangleIcon className="w-3 h-3"/>Duplicate</span>}
                                                        {f.status === 'importing' && <Spinner className="w-4 h-4 border-2"/>}
                                                        {f.status === 'imported' && <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700 inline-flex items-center gap-1"><CheckCircleIcon className="w-3 h-3"/>Imported</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="text-right">
                                    <Button onClick={handleImportSelected} disabled={isSaving || reviewedFixtures.filter(f => f.selected && f.status === 'new').length === 0} className="bg-green-600 text-white h-10 px-6 flex justify-center items-center">
                                        {isSaving ? <Spinner className="w-5 h-5 border-2"/> : `Import Selected (${reviewedFixtures.filter(f => f.selected && f.status === 'new').length})`}
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

export default ApiImportPage;
