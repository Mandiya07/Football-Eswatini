
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
import { fetchAllCompetitions, fetchCompetition, handleFirestoreError, Competition, Category, fetchCategories, fetchFootballDataOrg, fetchApiFootball } from '../../services/api';
import { db } from '../../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { removeUndefinedProps, normalizeTeamName, calculateStandings, superNormalize } from '../../services/utils';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';
import InfoIcon from '../icons/InfoIcon';
import GlobeIcon from '../icons/GlobeIcon';

// Fetched event from TheSportsDB
interface FetchedEventTSDB {
    idEvent: string;
    strEvent: string; // "Home vs Away"
    strHomeTeam: string;
    strAwayTeam: string;
    dateEvent: string; // YYYY-MM-DD
    strTime: string; // HH:MM:SS
    intHomeScore: string | null;
    intAwayScore: string | null;
    strVenue?: string;
    intRound?: string;
    strStatus?: string; // "Match Finished", "Not Started", "Time to be defined"
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
    const [apiProvider, setApiProvider] = useState<'football-data' | 'thesportsdb' | 'api-football'>('football-data');

    const [competitions, setCompetitions] = useState<{ id: string, name: string, externalApiId?: string }[]>([]);
    const [loadingComps, setLoadingComps] = useState(true);
    const [selectedCompId, setSelectedCompId] = useState<string>('');
    const [currentCompetition, setCurrentCompetition] = useState<Competition | null>(null);
    
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
            } catch (e) {
                console.error("Error parsing saved config", e);
            }
        } else {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth(); 
            const seasonStr = month < 6 ? `${year - 1}-${year}` : `${year}-${year + 1}`;
            setSeason(seasonStr);
        }
    }, []);

    useEffect(() => {
        const config = { apiKey, season, apiProvider, importType, useProxy, autoImport };
        localStorage.setItem('fe_api_import_config', JSON.stringify(config));
    }, [apiKey, season, apiProvider, importType, useProxy, autoImport]);

    useEffect(() => {
        const autoDetectSeason = async () => {
            if (apiProvider !== 'thesportsdb' || !selectedCompId || competitions.length === 0) return;
            
            const selectedComp = competitions.find(c => c.id === selectedCompId);
            if (!selectedComp?.externalApiId) return;

            const key = apiKey || '1'; 
            let url = `https://www.thesportsdb.com/api/v1/json/${key}/lookupleague.php?id=${selectedComp.externalApiId}`;
            if (useProxy) url = `https://corsproxy.io/?${encodeURIComponent(url)}`;

            try {
                const res = await fetch(url);
                const data = await res.json();
                if (data.leagues && data.leagues[0]?.strCurrentSeason) {
                    setSeason(prev => prev ? prev : data.leagues[0].strCurrentSeason);
                }
            } catch (e) {
                console.warn("Failed to lookup league season", e);
            }
        };
        
        autoDetectSeason();
    }, [selectedCompId, apiProvider, apiKey, useProxy, competitions]);

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
                
                const importableCompetitions = allComps.filter(comp => comp.externalApiId);
                setCompetitions(importableCompetitions);
                
                if (importableCompetitions.length > 0) {
                    setSelectedCompId(importableCompetitions[0].id);
                } else {
                    setSelectedCompId('');
                }
            } catch (err) {
                console.error("Failed to load competition data:", err);
                setError("Failed to load competition data.");
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

    const processAndReviewFixtures = (fixturesToProcess: CompetitionFixture[], source: string): ReviewedFixture[] => {
        if (!currentCompetition) {
            setError("Could not load current competition details for duplicate checking.");
            return [];
        }

        const existingMatches = [...(currentCompetition.fixtures || []), ...(currentCompetition.results || [])];
        const officialTeamNames = (currentCompetition.teams || []).map(t => t.name);

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
                const dbVenue = existingMatch.venue || '';
                const newVenue = fixture.venue || '';
                
                const timeImproved = (dbTime === '00:00' && newTime !== '00:00') || (dbTime.length < 5 && newTime.length >= 5);
                const venueImproved = (!dbVenue && !!newVenue);
                const statusUpdated = existingMatch.status !== 'finished' && fixture.status === 'finished';
                
                if (timeImproved || venueImproved || statusUpdated) {
                    isBetterData = true;
                    status = 'update';
                } else {
                    status = 'duplicate';
                }
            }

            let normalizedA: string | null = fixture.teamA;
            let normalizedB: string | null = fixture.teamB;

            if (officialTeamNames.length > 0) {
                normalizedA = normalizeTeamName(fixture.teamA, officialTeamNames);
                normalizedB = normalizeTeamName(fixture.teamB, officialTeamNames);
            }

            const isValidA = !!normalizedA;
            const isValidB = !!normalizedB;
            const hasError = !isValidA || !isValidB;
            
            let errorMsg = undefined;
            if (!isValidA && !isValidB) errorMsg = "Both team names invalid";
            else if (!isValidA) errorMsg = `Invalid Team: ${fixture.teamA}`;
            else if (!isValidB) errorMsg = `Invalid Team: ${fixture.teamB}`;

            if (hasError) {
                status = 'error';
            }

            return {
                id: String(fixture.id),
                title: `${fixture.teamA} vs ${fixture.teamB}`,
                date: fixture.fullDate!,
                time: fixture.time,
                venue: fixture.venue || 'N/A',
                matchday: String(fixture.matchday),
                status: status,
                selected: (!isDuplicate || isBetterData) && !hasError, 
                fixtureData: {
                    ...fixture,
                    teamA: normalizedA || fixture.teamA,
                    teamB: normalizedB || fixture.teamB
                },
                error: errorMsg
            };
        });

        if (source.includes("API") || source.includes("Fallback")) {
            setSuccessMessage(`Successfully fetched ${processedFixtures.length} ${importType} from ${source}.`);
        }
        
        return processedFixtures;
    };
    
    const fetchTheSportsDB = async (externalApiId: string) => {
        const key = apiKey || '1'; 
        let effectiveSeason = season.trim();
        if (!effectiveSeason) {
             const now = new Date();
             const year = now.getFullYear();
             effectiveSeason = now.getMonth() < 6 ? `${year - 1}-${year}` : `${year}-${year + 1}`;
             setSeason(effectiveSeason); 
        }

        let url = `https://www.thesportsdb.com/api/v1/json/${key}/eventsseason.php?id=${externalApiId}&s=${effectiveSeason}`;
        if (useProxy) url = `https://corsproxy.io/?${encodeURIComponent(url)}`;

        let fetchedEvents: FetchedEventTSDB[] = [];
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                fetchedEvents = data.events || [];
            }
        } catch (e) {
            console.warn("eventsseason.php failed", e);
        }

        if (fetchedEvents.length === 0 && effectiveSeason.includes('-')) {
            const singleYear = effectiveSeason.split('-')[0];
            let retryUrl = `https://www.thesportsdb.com/api/v1/json/${key}/eventsseason.php?id=${externalApiId}&s=${singleYear}`;
            if (useProxy) retryUrl = `https://corsproxy.io/?${encodeURIComponent(retryUrl)}`;
            try {
                const response = await fetch(retryUrl);
                if (response.ok) {
                    const data = await response.json();
                    fetchedEvents = data.events || [];
                }
            } catch (e) {}
        }

        if (fetchedEvents.length === 0) {
             const endpoint = importType === 'fixtures' ? 'eventsnextleague.php' : 'eventspastleague.php';
             let fallbackUrl = `https://www.thesportsdb.com/api/v1/json/${key}/${endpoint}?id=${externalApiId}`;
             if (useProxy) fallbackUrl = `https://corsproxy.io/?${encodeURIComponent(fallbackUrl)}`;
             try {
                const fbResponse = await fetch(fallbackUrl);
                if (fbResponse.ok) {
                    const fbData = await fbResponse.json();
                    if (fbData.events) {
                        fetchedEvents = fbData.events;
                    }
                }
             } catch (e) {}
        }

        if (fetchedEvents.length === 0) return [];

        const officialTeamNames = (currentCompetition?.teams || []).map(t => t.name);
        const fixturesToReview: CompetitionFixture[] = [];
        
        fetchedEvents.forEach(event => {
            const rawStatus = event.strStatus || '';
            const statusLower = rawStatus.toLowerCase();
            const isFinished = statusLower.includes('finished') || statusLower === 'ft' || statusLower === 'aet' || statusLower.includes('pen') || statusLower.includes('full time');
            
            let include = false;
            if (importType === 'fixtures') {
                if (!isFinished) include = true;
            } else {
                if (isFinished || statusLower.includes('abandoned')) include = true;
            }

            if (include) {
                const eventDate = new Date(event.dateEvent);
                const normalizedTeamA = officialTeamNames.length > 0 ? normalizeTeamName(event.strHomeTeam, officialTeamNames) : event.strHomeTeam;
                const normalizedTeamB = officialTeamNames.length > 0 ? normalizeTeamName(event.strAwayTeam, officialTeamNames) : event.strAwayTeam;
                const timeStr = event.strTime ? event.strTime.substring(0, 5) : '00:00';

                let derivedStatus: CompetitionFixture['status'] = 'scheduled';
                if (isFinished) derivedStatus = 'finished';
                else if (statusLower.includes('postponed') || statusLower.includes('ppd')) derivedStatus = 'postponed';
                else if (statusLower.includes('suspended')) derivedStatus = 'suspended';
                else if (statusLower.includes('abandoned')) derivedStatus = 'abandoned';
                else if (statusLower.includes('cancel')) derivedStatus = 'cancelled';
                
                if (importType === 'results' && derivedStatus === 'scheduled' && event.intHomeScore && event.intAwayScore) {
                    derivedStatus = 'finished';
                }

                fixturesToReview.push({
                    id: parseInt(event.idEvent, 10) || Date.now(),
                    teamA: normalizedTeamA || event.strHomeTeam,
                    teamB: normalizedTeamB || event.strAwayTeam,
                    fullDate: event.dateEvent,
                    date: eventDate.getDate().toString(),
                    day: eventDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
                    time: timeStr,
                    venue: event.strVenue || undefined,
                    matchday: event.intRound ? parseInt(event.intRound, 10) : undefined,
                    status: derivedStatus,
                    scoreA: event.intHomeScore !== null && event.intHomeScore !== "" ? parseInt(event.intHomeScore, 10) : undefined,
                    scoreB: event.intAwayScore !== null && event.intAwayScore !== "" ? parseInt(event.intAwayScore, 10) : undefined,
                });
            }
        });

        return fixturesToReview;
    }

    const saveFixtures = async (fixturesToSave: ReviewedFixture[]) => {
        setIsSaving(true);
        console.log(`[Import] Initiating save of ${fixturesToSave.length} items to ${selectedCompId}`);
        
        try {
            const docRef = doc(db, 'competitions', selectedCompId);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Competition not found");

                const competitionData = docSnap.data() as Competition;
                const newItems = fixturesToSave.map(f => f.fixtureData);

                let existingResults = competitionData.results || [];
                let existingFixtures = competitionData.fixtures || [];

                if (importType === 'results') {
                    newItems.forEach(newItem => {
                        const existingIndex = existingResults.findIndex(r => 
                            superNormalize(r.teamA) === superNormalize(newItem.teamA) && 
                            superNormalize(r.teamB) === superNormalize(newItem.teamB) && 
                            r.fullDate === newItem.fullDate
                        );

                        if (existingIndex !== -1) {
                            existingResults[existingIndex] = { 
                                ...existingResults[existingIndex], 
                                ...newItem, 
                                id: existingResults[existingIndex].id 
                            };
                        } else {
                            existingResults.push(newItem);
                        }
                        
                        existingFixtures = existingFixtures.filter(f => 
                            !(superNormalize(f.teamA) === superNormalize(newItem.teamA) && 
                              superNormalize(f.teamB) === superNormalize(newItem.teamB) && 
                              f.fullDate === newItem.fullDate)
                        );
                    });

                    const updatedTeams = calculateStandings(competitionData.teams || [], existingResults, existingFixtures);
                    
                    transaction.update(docRef, removeUndefinedProps({ 
                        fixtures: existingFixtures,
                        results: existingResults,
                        teams: updatedTeams
                    }));

                } else {
                    newItems.forEach(newItem => {
                        const existingIndex = existingFixtures.findIndex(f => 
                             superNormalize(f.teamA) === superNormalize(newItem.teamA) && 
                             superNormalize(f.teamB) === superNormalize(newItem.teamB) && 
                             f.fullDate === newItem.fullDate
                        );
                        
                        if (existingIndex !== -1) {
                             existingFixtures[existingIndex] = { 
                                 ...existingFixtures[existingIndex], 
                                 ...newItem,
                                 id: existingFixtures[existingIndex].id 
                             };
                        } else {
                             existingFixtures.push(newItem);
                        }
                    });

                    transaction.update(docRef, { fixtures: removeUndefinedProps(existingFixtures) });
                }
            });
            console.log("[Import] Transaction successful.");
            return true;
        } catch(err) {
            console.error("[Import] Transaction failed", err);
            handleFirestoreError(err, `import ${importType}`);
            setError('An error occurred during save. Check console for details.');
            return false;
        } finally {
            setIsSaving(false);
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
            const officialTeamNames = (currentCompetition?.teams || []).map(t => t.name);

            if (apiProvider === 'thesportsdb') {
                fixtures = await fetchTheSportsDB(externalApiId);
                sourceLabel = "TheSportsDB";
            } else if (apiProvider === 'api-football') {
                fixtures = await fetchApiFootball(
                    externalApiId,
                    apiKey,
                    season,
                    importType,
                    useProxy,
                    officialTeamNames
                );
                sourceLabel = "API-Football";
            } else {
                fixtures = await fetchFootballDataOrg(
                    externalApiId, 
                    apiKey, 
                    season, 
                    importType, 
                    useProxy, 
                    officialTeamNames
                );
                sourceLabel = "Football-Data.org";
            }

            if (fixtures.length === 0) {
                setError(`No ${importType} found. Checked season "${season}".`);
            } else {
                const processed = processAndReviewFixtures(fixtures, sourceLabel);
                setReviewedFixtures(processed);

                if (autoImport) {
                    const validItems = processed.filter(f => f.selected);
                    if (validItems.length > 0) {
                        setReviewedFixtures(prev => prev.map(f => f.selected ? { ...f, status: 'importing' } : f));
                        const success = await saveFixtures(validItems);
                        if (success) {
                            setSuccessMessage(`Auto-Import: Successfully processed ${validItems.length} items.`);
                            setReviewedFixtures(prev => prev.map(f => f.status === 'importing' ? { ...f, status: 'imported', selected: false } : f));
                        } else {
                            setReviewedFixtures(prev => prev.map(f => f.status === 'importing' ? { ...f, status: 'new' } : f));
                        }
                    }
                }
            }

        } catch (err) {
            setError(`Error: ${(err as Error).message}.`);
        } finally {
            setIsFetching(false);
        }
    };


    const handleToggleSelection = (id: string) => {
        setReviewedFixtures(prev => prev.map(f => f.id === id ? { ...f, selected: !f.selected } : f));
    };

    const handleRemoveFixture = (id: string) => {
        setReviewedFixtures(prev => prev.filter(f => f.id !== id));
    };

    const handleImportSelected = async () => {
        const fixturesToImport = reviewedFixtures.filter(f => f.selected && (f.status === 'new' || f.status === 'update' || f.status === 'error'));
        
        const invalidSelections = fixturesToImport.filter(f => f.status === 'error');
        if (invalidSelections.length > 0) {
            setError(`Cannot import: ${invalidSelections.length} selected items have invalid team names.`);
            return;
        }

        if (fixturesToImport.length === 0) {
            setError("No items selected for import.");
            return;
        }

        setReviewedFixtures(prev => prev.map(f => f.selected && f.status !== 'imported' && f.status !== 'duplicate' ? {...f, status: 'importing'} : f));
        
        const success = await saveFixtures(fixturesToImport);
        
        if (success) {
            setReviewedFixtures(prev => prev.map(f => f.status === 'importing' ? {...f, status: 'imported', selected: false} : f));
            setSuccessMessage(`Successfully imported ${fixturesToImport.length} ${importType}!`);
        } else {
            setReviewedFixtures(prev => prev.map(f => f.status === 'importing' ? {...f, status: 'new'} : f)); 
        }
    };

    const handleEditClick = (fixture: ReviewedFixture) => {
        setEditingId(fixture.id);
        setEditFormData({ ...fixture.fixtureData });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditFormData({});
    };

    const handleSaveEdit = () => {
        if (!editingId) return;

        setReviewedFixtures(prev => {
            const newFixtures = prev.map(f => {
                if (f.id === editingId) {
                    const updatedFixtureData = { ...f.fixtureData, ...editFormData };
                    const officialTeamNames = (currentCompetition?.teams || []).map(t => t.name);
                    
                    let normalizedA: string | null = updatedFixtureData.teamA;
                    let normalizedB: string | null = updatedFixtureData.teamB;

                    if (officialTeamNames.length > 0) {
                        normalizedA = normalizeTeamName(updatedFixtureData.teamA, officialTeamNames);
                        normalizedB = normalizeTeamName(updatedFixtureData.teamB, officialTeamNames);
                    }
                    
                    const isValidA = !!normalizedA;
                    const isValidB = !!normalizedB;
                    const hasError = !isValidA || !isValidB;
                    
                    let errorMsg = undefined;
                    if (!isValidA && !isValidB) errorMsg = "Both team names invalid";
                    else if (!isValidA) errorMsg = `Invalid Team: ${updatedFixtureData.teamA}`;
                    else if (!isValidB) errorMsg = `Invalid Team: ${updatedFixtureData.teamB}`;

                    return {
                        ...f,
                        fixtureData: {
                            ...updatedFixtureData,
                            teamA: normalizedA || updatedFixtureData.teamA,
                            teamB: normalizedB || updatedFixtureData.teamB
                        },
                        status: hasError ? 'error' : f.status, 
                        error: errorMsg,
                        selected: !hasError 
                    } as ReviewedFixture;
                }
                return f;
            });
            return newFixtures;
        });
        
        handleCancelEdit();
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleClearAll = () => {
        if(window.confirm("Clear all fetched items?")) {
            setReviewedFixtures([]);
            setSuccessMessage('');
            setError('');
        }
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <Card className="max-w-6xl mx-auto shadow-lg">
                    <CardContent className="p-8 space-y-6">
                        <div className="text-center">
                            <CloudDownloadIcon className="w-12 h-12 mx-auto text-purple-600 mb-2" />
                            <h1 className="text-3xl font-display font-bold">Live Import Studio</h1>
                            <p className="text-gray-600 max-w-3xl mx-auto mt-2">
                                Fetch live data from global providers. API-Football is recommended for South African leagues.
                            </p>
                        </div>

                        {isFallback && (
                            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 animate-fade-in">
                                <p className="font-bold flex items-center gap-2"><AlertTriangleIcon className="w-5 h-5"/>Live API Unreachable</p>
                                <p className="text-sm mt-1">Showing demonstration mock data.</p>
                            </div>
                        )}
                        
                        {successMessage && !error && !isFallback && <div className="p-3 bg-green-100 text-green-800 rounded-md flex items-center gap-2 animate-fade-in"><CheckCircleIcon className="w-5 h-5"/>{successMessage}</div>}
                        {error && !isFallback && <div className="p-3 bg-red-100 text-red-800 rounded-md animate-fade-in">{error}</div>}

                        <div className="space-y-6 pt-4 border-t">
                            <h2 className="text-xl font-bold font-display">Step 1: Configure Source</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                    <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><GlobeIcon className="w-4 h-4"/> API Provider</label>
                                    <div className="flex flex-col gap-2">
                                        <label className={`flex items-center gap-3 p-2 rounded-md cursor-pointer border transition-colors ${apiProvider === 'football-data' ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'hover:bg-gray-50 border-gray-200'}`}>
                                            <input type="radio" name="apiProvider" value="football-data" checked={apiProvider === 'football-data'} onChange={() => setApiProvider('football-data')} className="h-4 w-4 text-blue-600" />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-800">football-data.org</span>
                                                <span className="text-[10px] text-gray-500">Major European leagues.</span>
                                            </div>
                                        </label>
                                        <label className={`flex items-center gap-3 p-2 rounded-md cursor-pointer border transition-colors ${apiProvider === 'api-football' ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'hover:bg-gray-50 border-gray-200'}`}>
                                            <input type="radio" name="apiProvider" value="api-football" checked={apiProvider === 'api-football'} onChange={() => setApiProvider('api-football')} className="h-4 w-4 text-blue-600" />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-800">api-football.com</span>
                                                <span className="text-[10px] text-gray-500">Global Coverage (AFCON, PSL).</span>
                                            </div>
                                        </label>
                                        <label className={`flex items-center gap-3 p-2 rounded-md cursor-pointer border transition-colors ${apiProvider === 'thesportsdb' ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'hover:bg-gray-50 border-gray-200'}`}>
                                            <input type="radio" name="apiProvider" value="thesportsdb" checked={apiProvider === 'thesportsdb'} onChange={() => setApiProvider('thesportsdb')} className="h-4 w-4 text-blue-600" />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-800">thesportsdb.com</span>
                                                <span className="text-[10px] text-gray-500">Crowdsourced DB.</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                    <label className="block text-sm font-bold text-gray-700 mb-3">Import Data Type</label>
                                    <div className="flex gap-4 h-full items-start">
                                        <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md cursor-pointer border transition-colors h-full ${importType === 'fixtures' ? 'bg-purple-50 border-purple-300 text-purple-800 font-semibold' : 'hover:bg-gray-50 border-gray-200'}`}>
                                            <input type="radio" name="apiImportType" value="fixtures" checked={importType === 'fixtures'} onChange={() => setImportType('fixtures')} className="h-4 w-4 text-purple-600" />
                                            <span>Fixtures</span>
                                        </label>
                                        <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md cursor-pointer border transition-colors h-full ${importType === 'results' ? 'bg-purple-50 border-purple-300 text-purple-800 font-semibold' : 'hover:bg-gray-50 border-gray-200'}`}>
                                            <input type="radio" name="apiImportType" value="results" checked={importType === 'results'} onChange={() => setImportType('results')} className="h-4 w-4 text-purple-600" />
                                            <span>Results</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="api-key" className="block text-xs font-bold text-gray-700 uppercase mb-1">API Key</label>
                                        <input 
                                            id="api-key" 
                                            type="password" 
                                            value={apiKey} 
                                            onChange={e => setApiKey(e.target.value)} 
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="season" className="block text-xs font-bold text-gray-700 uppercase mb-1">Season / Year</label>
                                        <input 
                                            id="season" 
                                            type="text" 
                                            value={season} 
                                            onChange={e => setSeason(e.target.value)} 
                                            placeholder="e.g., 2025" 
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center mt-4 gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={useProxy} onChange={e => setUseProxy(e.target.checked)} className="h-4 w-4" />
                                        <span className="text-sm font-semibold text-gray-700">Use CORS Proxy</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={autoImport} onChange={e => setAutoImport(e.target.checked)} className="h-4 w-4" />
                                        <span className="text-sm font-bold text-green-700">Auto-Publish Valid Items</span>
                                    </label>
                                </div>
                            </div>

                            {loadingComps ? <Spinner /> : (
                                <div className="space-y-4">
                                    {competitions.length > 0 ? (
                                        <div className="flex flex-col md:flex-row gap-4 items-end pt-4 border-t border-gray-100">
                                            <div className="flex-grow w-full">
                                                <label htmlFor="league-select" className="block text-sm font-bold text-gray-700 mb-1">Destination League</label>
                                                <select id="league-select" value={selectedCompId} onChange={e => setSelectedCompId(e.target.value)} className={inputClass}>
                                                    {competitions.map(comp => (
                                                        <option key={comp.id} value={comp.id}>{comp.name} (ID: {comp.externalApiId})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="w-full md:w-32">
                                                <label htmlFor="matchday" className="block text-sm font-bold text-gray-700 mb-1">Matchday</label>
                                                <input type="number" id="matchday" value={matchday} onChange={e => setMatchday(e.target.value)} className={inputClass} placeholder="#" min="1" />
                                            </div>
                                            <Button onClick={handleFetch} disabled={isFetching || !selectedCompId} className="bg-purple-600 text-white w-full md:w-auto h-11 px-8 flex justify-center items-center">
                                                {isFetching ? <Spinner className="w-5 h-5 border-2"/> : `Fetch Data`}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-gray-100 text-gray-700 rounded-md text-sm">
                                            <p className="font-semibold flex items-center gap-2"><InfoIcon className="w-5 h-5"/>No Importable Leagues Found</p>
                                            <p className="mt-1">Add an External API ID to a league in Category Management to enable importing.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {reviewedFixtures.length > 0 && (
                            <div className="space-y-4 pt-4 border-t animate-fade-in">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold font-display">Step 2: Review & Import</h2>
                                    <Button onClick={handleClearAll} className="bg-red-100 text-red-600 hover:bg-red-200 text-xs px-3 py-1">Clear All</Button>
                                </div>
                                <div className="overflow-x-auto border rounded-lg">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100 text-left">
                                            <tr>
                                                <th className="p-2 w-12"></th>
                                                <th className="p-2">Match</th>
                                                <th className="p-2">Date</th>
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
                                                                        {currentCompetition?.teams && currentCompetition.teams.length > 0 ? (
                                                                            <select value={editFormData.teamA} onChange={handleEditChange} name="teamA" className="block w-full text-sm p-1 border-gray-300 rounded"><option value="" disabled>-- Select --</option>{(currentCompetition.teams).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}</select>
                                                                        ) : (
                                                                            <input value={editFormData.teamA} onChange={handleEditChange} name="teamA" className="block w-full text-sm p-1 border-gray-300 rounded" />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-xs font-bold text-gray-600">Away</label>
                                                                        {currentCompetition?.teams && currentCompetition.teams.length > 0 ? (
                                                                            <select value={editFormData.teamB} onChange={handleEditChange} name="teamB" className="block w-full text-sm p-1 border-gray-300 rounded"><option value="" disabled>-- Select --</option>{(currentCompetition.teams).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}</select>
                                                                        ) : (
                                                                            <input value={editFormData.teamB} onChange={handleEditChange} name="teamB" className="block w-full text-sm p-1 border-gray-300 rounded" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2 mt-2">
                                                                    <Button onClick={handleSaveEdit} className="bg-green-600 text-white text-xs h-8">Save</Button>
                                                                    <Button onClick={handleCancelEdit} className="bg-gray-300 text-gray-800 text-xs h-8">Cancel</Button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    <tr key={f.id} className={`${!f.selected ? 'bg-gray-50 text-gray-500' : 'bg-white'} ${f.status === 'error' ? 'bg-red-50' : ''}`}>
                                                        <td className="p-2 text-center"><input type="checkbox" checked={f.selected} onChange={() => handleToggleSelection(f.id)} className="h-4 w-4 rounded" disabled={f.status === 'imported'} /></td>
                                                        <td className="p-2 font-semibold">
                                                            {f.fixtureData.teamA} vs {f.fixtureData.teamB} 
                                                            {f.error && <span className="text-[10px] font-bold text-red-600 block mt-1 uppercase tracking-tight">Error: {f.error}</span>}
                                                        </td>
                                                        <td className="p-2">{f.date} @ {f.time}</td>
                                                        {importType === 'results' && <td className="p-2 font-bold">{f.fixtureData.scoreA ?? '-'} : {f.fixtureData.scoreB ?? '-'}</td>}
                                                        <td className="p-2">
                                                            {f.status === 'new' && <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">New</span>}
                                                            {f.status === 'update' && <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">Update</span>}
                                                            {f.status === 'duplicate' && <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Duplicate</span>}
                                                            {f.status === 'imported' && <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-200 text-gray-700">Imported</span>}
                                                            {f.status === 'importing' && <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">Saving...</span>}
                                                            {f.status === 'error' && <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">Invalid Teams</span>}
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            <div className="flex justify-center gap-1">
                                                                <Button onClick={() => handleEditClick(f)} disabled={f.status === 'imported'} className="bg-gray-100 hover:bg-blue-100 text-gray-600 h-8 w-8 p-0 flex items-center justify-center rounded"><PencilIcon className="w-4 h-4" /></Button>
                                                                <Button onClick={(e) => handleRemoveFixture(f.id)} className="bg-red-100 text-red-600 hover:bg-red-200 h-8 w-8 p-0 flex items-center justify-center rounded"><TrashIcon className="w-4 h-4" /></Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="text-right">
                                    <Button onClick={handleImportSelected} disabled={isSaving || reviewedFixtures.filter(f => f.selected).length === 0} className="bg-green-600 text-white h-10 px-6 flex justify-center items-center">{isSaving ? <Spinner className="w-5 h-5 border-2"/> : `Import Selected`}</Button>
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
