
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import { CompetitionFixture, Team, Competition } from '../data/teams';
import { DirectoryEntity } from '../data/directory';
import ChevronDownIcon from './icons/ChevronDownIcon';
import FixtureDetail from './FixtureDetail';
import ShareIcon from './icons/ShareIcon';
import AdBanner from './AdBanner';
// FIX: Import 'fetchCategories' and 'fetchDirectoryEntries' which are now correctly exported from the API service.
import { fetchAllCompetitions, listenToCompetition, fetchCategories, fetchDirectoryEntries, handleFirestoreError, Category } from '../services/api';
import Spinner from './ui/Spinner';
import { useAuth } from '../contexts/AuthContext';
import TrashIcon from './icons/TrashIcon';
import { db } from '../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { calculateStandings, removeUndefinedProps, findInMap } from '../services/utils';

interface FixturesProps {
    showSelector?: boolean;
    defaultCompetition?: string;
}

interface FixtureItemProps {
    fixture: CompetitionFixture;
    isExpanded: boolean;
    onToggleDetails: () => void;
    teams: Team[];
    onDeleteFixture: (id: number) => void;
    isDeleting: boolean;
    directoryMap: Map<string, DirectoryEntity>;
    competitionId: string;
}

export const FixtureItem: React.FC<FixtureItemProps> = React.memo(({ fixture, isExpanded, onToggleDetails, teams, onDeleteFixture, isDeleting, directoryMap, competitionId }) => {
    const [copied, setCopied] = useState(false);
    const { user } = useAuth();
    
    const teamA = useMemo(() => teams.find(t => t.name.trim() === (fixture.teamA || '').trim()), [teams, fixture.teamA]);
    const teamB = useMemo(() => teams.find(t => t.name.trim() === (fixture.teamB || '').trim()), [teams, fixture.teamB]);
    
    const teamADirectory = findInMap(fixture.teamA || '', directoryMap);
    const teamBDirectory = findInMap(fixture.teamB || '', directoryMap);

    const crestA = teamADirectory?.crestUrl || teamA?.crestUrl;
    const crestB = teamBDirectory?.crestUrl || teamB?.crestUrl;

    const getLinkProps = (teamObj: Team | undefined, teamName: string) => {
        // 1. Prioritize direct ID from competition data (restores old functionality)
        if (teamObj?.id) {
            return { isLinkable: true, competitionId, teamId: teamObj.id };
        }
        // 2. Fallback to directory for inconsistent data (fixes MTN Premier League)
        const entity = findInMap(teamName || '', directoryMap);
        if (entity?.teamId && entity.competitionId) {
            return { isLinkable: true, competitionId: entity.competitionId, teamId: entity.teamId };
        }
        return { isLinkable: false, competitionId: null, teamId: null };
    };

    const teamALink = getLinkProps(teamA, fixture.teamA);
    const teamBLink = getLinkProps(teamB, fixture.teamB);

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Stop the click from bubbling up to the main button

        let title = `⚽ Match: ${fixture.teamA} vs ${fixture.teamB}`;
        let text = `Check out this Football Eswatini match!\n\n${fixture.teamA} vs ${fixture.teamB}`;

        if (fixture.status === 'live' || fixture.status === 'finished') {
            text += `\nScore: ${fixture.scoreA} - ${fixture.scoreB}`;
            if (fixture.status === 'live' && fixture.liveMinute) {
                text += ` (Live at ${fixture.liveMinute}')`;
            } else if (fixture.status === 'finished') {
                text += ' (Full Time)';
            }
        } else {
            text += `\n📅 On ${fixture.day}, ${fixture.date} at ${fixture.time}`;
        }
        
        if (fixture.venue) {
            text += `\n🏟️ At ${fixture.venue}`;
        }

        const shareData = {
          title: title,
          text: text,
          url: window.location.href, // Direct link to the current page
        };
    
        if (navigator.share) {
          try {
            // The url property is automatically appended by many apps, so text can be cleaner
            await navigator.share(shareData);
          } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                 console.error('Error sharing:', err);
            }
          }
        } else {
          try {
            // For clipboard, we explicitly add the URL
            await navigator.clipboard.writeText(`${text}\n\nView here: ${window.location.href}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            alert('Could not copy link to clipboard.');
          }
        }
    };
    
    return (
        <div className="flex items-center hover:bg-gray-50/50 transition-colors duration-200">
            <button
                onClick={onToggleDetails}
                className="flex-grow w-full text-left"
                aria-expanded={isExpanded}
                aria-controls={`fixture-details-${fixture.id}`}
            >
                <div className="relative flex items-center space-x-4 p-4 min-h-[100px]">
                    {fixture.status === 'live' &&
                        <div className="absolute top-2 right-2 flex items-center space-x-1.5 text-secondary font-bold text-xs animate-pulse">
                            <span className="w-2 h-2 bg-secondary rounded-full"></span>
                            <span>LIVE</span>
                        </div>
                    }
                     {fixture.status === 'finished' &&
                        <div className="absolute top-2 right-2 text-gray-500 font-bold text-xs">
                            <span>FT</span>
                        </div>
                    }
                    <div className={`flex flex-col items-center justify-center ${fixture.status === 'live' ? 'bg-secondary' : 'bg-primary'} text-white w-16 h-16 rounded-full flex-shrink-0 transition-colors duration-300`}>
                        <span className="font-bold text-2xl">{fixture.date}</span>
                        <span className="text-xs uppercase">{fixture.day}</span>
                    </div>
                    <div className="flex-grow grid grid-cols-3 items-center text-center">
                        <div className="flex justify-end items-center gap-3 pr-2">
                            {teamALink.isLinkable ? (
                                <Link to={`/competitions/${teamALink.competitionId}/teams/${teamALink.teamId}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-gray-800 text-right truncate hover:underline">{fixture.teamA}</Link>
                            ) : (
                                <p className="font-semibold text-gray-800 text-right truncate">{fixture.teamA}</p>
                            )}
                            {crestA && <img src={crestA} alt={`${fixture.teamA} crest`} loading="lazy" className="w-6 h-6 object-contain flex-shrink-0 bg-white p-0.5 rounded-md shadow-sm" />}
                        </div>
                        {fixture.status === 'live' || fixture.status === 'finished' ?
                            <div className="text-center">
                                <p 
                                    key={`score-${fixture.id}-${fixture.scoreA}-${fixture.scoreB}`}
                                    className={`font-bold text-2xl ${fixture.status === 'live' ? 'text-secondary animate-score-update' : 'text-gray-900'} tracking-wider`}
                                >
                                    {fixture.scoreA} - {fixture.scoreB}
                                </p>
                                {fixture.status === 'live' && <p className="text-xs font-bold text-secondary mt-0.5">{fixture.liveMinute}'</p>}
                            </div>
                            :
                            <p className="text-sm text-gray-500 font-bold">vs</p>
                        }
                        <div className="flex justify-start items-center gap-3 pl-2">
                             {crestB && <img src={crestB} alt={`${fixture.teamB} crest`} loading="lazy" className="w-6 h-6 object-contain flex-shrink-0 bg-white p-0.5 rounded-md shadow-sm" />}
                            {teamBLink.isLinkable ? (
                                <Link to={`/competitions/${teamBLink.competitionId}/teams/${teamBLink.teamId}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-gray-800 text-left truncate hover:underline">{fixture.teamB}</Link>
                            ) : (
                                <p className="font-semibold text-gray-800 text-left truncate">{fixture.teamB}</p>
                            )}
                        </div>
                    </div>
                    <div className="text-center flex-shrink-0 w-28">
                         <p className="font-bold text-lg text-gray-700 h-7 flex items-center justify-center">{fixture.status === 'scheduled' && fixture.time}</p>
                         <div className={`mt-1 py-1.5 text-center text-sm font-semibold rounded-md transition-colors duration-300 ${isExpanded ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}>
                             {isExpanded ? 'Hide Details' : 'View Details'}
                         </div>
                    </div>
                    <div className="pl-2">
                        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </button>
             <div className="relative flex-shrink-0 pr-4 flex items-center gap-1">
                {user?.role === 'super_admin' && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDeleteFixture(fixture.id); }}
                        className="text-gray-400 hover:text-red-600 p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                        aria-label={`Delete match: ${fixture.teamA} vs ${fixture.teamB}`}
                        disabled={isDeleting}
                    >
                        {isDeleting ? <Spinner className="w-5 h-5 border-2" /> : <TrashIcon className="w-5 h-5" />}
                    </button>
                )}
                <div className="relative">
                    <button
                        onClick={handleShare}
                        className="text-gray-400 hover:text-primary p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2"
                        aria-label={`Share match: ${fixture.teamA} vs ${fixture.teamB}`}
                    >
                        <ShareIcon className="w-5 h-5" />
                    </button>
                    {copied && (
                        <span className="absolute bottom-full mb-2 right-0 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10 animate-fade-in-tooltip">
                            Link Copied!
                            <div className="absolute top-full right-3 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
});

const MatchdaySelector: React.FC<{ matchdays: number[], active: number, onSelect: (day: number) => void }> = ({ matchdays, active, onSelect }) => (
    <div className="py-2 overflow-x-auto scrollbar-hide">
        <div className="flex items-center space-x-2 px-4">
            {matchdays.map(day => (
                <button
                    key={day}
                    onClick={() => onSelect(day)}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 whitespace-nowrap ${
                        active === day ? 'bg-primary text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Matchday {day}
                </button>
            ))}
        </div>
    </div>
);


const Fixtures: React.FC<FixturesProps> = ({ showSelector = true, defaultCompetition = 'mtn-premier-league' }) => {
    const [activeTab, setActiveTab] = useState<'fixtures' | 'results'>('fixtures');
    const [selectedCompetition, setSelectedCompetition] = useState<string>(defaultCompetition);
    const [expandedFixtureId, setExpandedFixtureId] = useState<number | null>(null);
    const [expandedResultId, setExpandedResultId] = useState<number | null>(null);
    const [competition, setCompetition] = useState<Competition | null>(null);
    const [loading, setLoading] = useState(true);
    const [competitionOptions, setCompetitionOptions] = useState<{ label: string, options: { value: string; name: string }[] }[]>([]);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [directoryMap, setDirectoryMap] = useState<Map<string, DirectoryEntity>>(new Map());

    const [activeFixtureMatchday, setActiveFixtureMatchday] = useState<number | null>(null);
    const [activeResultMatchday, setActiveResultMatchday] = useState<number | null>(null);


     useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [entries, allCompetitionsData, categoriesData] = await Promise.all([
                    fetchDirectoryEntries(),
                    fetchAllCompetitions(),
                    fetchCategories()
                ]);

                const map = new Map<string, DirectoryEntity>();
                entries.forEach(entry => map.set(entry.name.trim().toLowerCase(), entry));
                setDirectoryMap(map);

                if (showSelector) {
                    const allCompetitions = Object.entries(allCompetitionsData)
                        .map(([id, comp]) => ({ id, ...(comp as Competition) }))
                        .filter(comp => comp.name);
    
                    let finalOptions: { label: string, options: { value: string; name: string }[] }[] = [];

                    if (categoriesData && categoriesData.length > 0) {
                        const categoryGroups = new Map<string, { name: string; order: number; competitions: { value: string; name: string }[] }>();
                        categoriesData.forEach(cat => categoryGroups.set(cat.id, { name: cat.name, order: cat.order, competitions: [] }));

                        const uncategorizedCompetitions: { value: string; name: string }[] = [];

                        allCompetitions.forEach(comp => {
                            const item = { value: comp.id, name: comp.name };
                            const catId = comp.categoryId;
                            if (catId && categoryGroups.has(catId)) {
                                categoryGroups.get(catId)!.competitions.push(item);
                            } else {
                                uncategorizedCompetitions.push(item);
                            }
                        });

                        finalOptions = Array.from(categoryGroups.values())
                            .filter(group => group.competitions.length > 0)
                            .sort((a, b) => a.order - b.order)
                            .map(group => ({
                                label: group.name,
                                options: group.competitions.sort((a, b) => a.name.localeCompare(b.name))
                            }));
                        
                        if (uncategorizedCompetitions.length > 0) {
                            finalOptions.push({
                                label: "Other",
                                options: uncategorizedCompetitions.sort((a, b) => a.name.localeCompare(b.name))
                            });
                        }
                    }
    
                    // Fallback if categorization fails but competitions exist
                    if (finalOptions.length === 0 && allCompetitions.length > 0) {
                        console.warn("Category grouping failed. Falling back to a flat list.");
                        const flatOptions = allCompetitions
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(comp => ({ value: comp.id, name: comp.name }));
                        if (flatOptions.length > 0) {
                            finalOptions = [{ label: "All Competitions", options: flatOptions }];
                        }
                    }
                    
                    setCompetitionOptions(finalOptions);
                }
            } catch (error) {
                console.error("Failed to load initial data for Fixtures page:", error);
                setCompetitionOptions([]); // Clear options on error
            }
        };

        loadInitialData();
    }, [showSelector]);


    useEffect(() => {
        setLoading(true);
        setExpandedFixtureId(null);
        setExpandedResultId(null);
        
        // A robust key to identify a unique match, ignoring home/away designation.
        const getMatchKey = (fixture: CompetitionFixture) => {
            if (!fixture.teamA || !fixture.teamB) return null;
            const teams = [fixture.teamA.trim(), fixture.teamB.trim()].sort();
            return `${teams[0]}-${teams[1]}-${fixture.fullDate}`;
        };

        const unsubscribe = listenToCompetition(selectedCompetition, (data) => {
            if (data) {
                const fixtureMap = new Map<string, CompetitionFixture>();
                const now = new Date();
                now.setHours(0, 0, 0, 0); // Set to start of today for date-only comparison

                (data.fixtures || []).forEach(f => {
                    // A fixture is a match that is not finished AND is scheduled for today or a future date.
                    if (f.status !== 'finished' && f.fullDate) {
                       const matchDate = new Date(f.fullDate + 'T00:00:00'); // Normalize to avoid timezone issues
                       if (matchDate >= now) {
                            const key = getMatchKey(f);
                            if (key) fixtureMap.set(key, f);
                       }
                    }
                });

                const resultMap = new Map<string, CompetitionFixture>();
                (data.results || []).forEach(r => {
                    const key = getMatchKey(r);
                    if (key) resultMap.set(key, r);
                });
                
                // If a match exists as a result, remove it from the fixtures list
                // to prevent it from ever showing in both tabs. This is a critical UI safeguard.
                resultMap.forEach((_, key) => {
                    if (fixtureMap.has(key)) {
                        fixtureMap.delete(key);
                    }
                });

                const dedupedData = {
                    ...data,
                    fixtures: Array.from(fixtureMap.values()),
                    results: Array.from(resultMap.values()),
                };
                setCompetition(dedupedData);
            } else {
                setCompetition(null);
            }
            setLoading(false);
        });

        return () => {
            unsubscribe(); // Cleanup listener
        };
    }, [selectedCompetition]);

    const groupItemsByMatchday = (items: CompetitionFixture[]) => {
        return items
            .sort((a,b) => new Date(a.fullDate!).getTime() - new Date(b.fullDate!).getTime())
            .reduce((acc, fixture) => {
                const matchday = fixture.matchday || 1; // Default to matchday 1 if not specified
                if (!acc[matchday]) {
                    acc[matchday] = [];
                }
                acc[matchday].push(fixture);
                return acc;
            }, {} as Record<number, CompetitionFixture[]>);
    };

    const groupedFixtures = useMemo(() => groupItemsByMatchday(competition?.fixtures || []), [competition?.fixtures]);
    const groupedResults = useMemo(() => groupItemsByMatchday(competition?.results || []), [competition?.results]);

    const fixtureMatchdays = useMemo(() => Object.keys(groupedFixtures).map(Number).sort((a,b) => a - b), [groupedFixtures]);
    const resultMatchdays = useMemo(() => Object.keys(groupedResults).map(Number).sort((a,b) => a - b), [groupedResults]);

    useEffect(() => {
        if (fixtureMatchdays.length > 0) setActiveFixtureMatchday(fixtureMatchdays[0]);
        else setActiveFixtureMatchday(null);
    }, [fixtureMatchdays]);

    useEffect(() => {
        if (resultMatchdays.length > 0) setActiveResultMatchday(resultMatchdays[resultMatchdays.length - 1]);
        else setActiveResultMatchday(null);
    }, [resultMatchdays]);
    
    const handleDeleteFixture = async (fixtureId: number) => {
        if (!window.confirm("Are you sure you want to delete this match? This action cannot be undone and will recalculate standings.")) {
            return;
        }
        setDeletingId(fixtureId);
        try {
            const docRef = doc(db, 'competitions', selectedCompetition);
            
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Competition not found");
                
                const competitionData = docSnap.data() as Competition;
                
                const currentFixtures = competitionData.fixtures || [];
                const currentResults = competitionData.results || [];
                
                const fixtureExists = currentFixtures.some(f => f.id === fixtureId) || currentResults.some(r => r.id === fixtureId);
                
                if (!fixtureExists) {
                    throw new Error("Could not find the match to delete. It may have already been removed.");
                }

                const updatedFixtures = currentFixtures.filter(f => f.id !== fixtureId);
                const updatedResults = currentResults.filter(r => r.id !== fixtureId);
                const updatedTeams = calculateStandings(competitionData.teams || [], updatedResults, updatedFixtures);

                // CRITICAL: Sanitize the entire payload before updating.
                transaction.update(docRef, removeUndefinedProps({ 
                    fixtures: updatedFixtures, 
                    results: updatedResults, 
                    teams: updatedTeams 
                }));
            });
            // Listener will handle UI update
        } catch(error) {
            handleFirestoreError(error, 'delete fixture');
        } finally {
            setDeletingId(null);
        }
    };


    const handleToggleDetails = (fixtureId: number) => {
        setExpandedFixtureId(prevId => (prevId === fixtureId ? null : fixtureId));
    };

    const handleToggleResultDetails = (fixtureId: number) => {
        setExpandedResultId(prevId => (prevId === fixtureId ? null : fixtureId));
    };
    
    const handleTabChange = (tabName: 'fixtures' | 'results') => {
        setActiveTab(tabName);
        setExpandedFixtureId(null);
        setExpandedResultId(null);
    };
    
    const TabButton: React.FC<{ tabName: 'fixtures' | 'results'; children: React.ReactNode }> = ({ tabName, children }) => (
        <button
            onClick={() => handleTabChange(tabName)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light ${
                activeTab === tabName 
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-800'
            }`}
            role="tab"
            aria-selected={activeTab === tabName}
        >
            {children}
        </button>
    );

    const renderFixtureList = (
        items: CompetitionFixture[],
        expandedId: number | null,
        onToggle: (id: number) => void
    ) => (
        <div className="divide-y divide-gray-100">
            {items.map(fixture => (
                <div key={fixture.id}>
                    <FixtureItem
                        fixture={fixture}
                        isExpanded={expandedId === fixture.id}
                        onToggleDetails={() => onToggle(fixture.id)}
                        teams={competition?.teams || []}
                        onDeleteFixture={handleDeleteFixture}
                        isDeleting={deletingId === fixture.id}
                        directoryMap={directoryMap}
                        competitionId={selectedCompetition}
                    />
                    {expandedId === fixture.id && (
                        <FixtureDetail fixture={fixture} competitionId={selectedCompetition} />
                    )}
                </div>
            ))}
        </div>
    );


    return (
        <section>
            <Card className="shadow-lg animate-content-fade-in" key={selectedCompetition}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center p-4 gap-4">
                    <div className="flex items-center gap-4">
                        {competition?.logoUrl && <img src={competition.logoUrl} alt={`${competition.name} logo`} className="h-10 object-contain" />}
                        <h2 className="text-xl font-display font-bold text-center lg:text-left">{competition?.displayName || competition?.name}</h2>
                    </div>
                    {showSelector && (
                        <div className="min-w-[200px] w-full sm:w-auto">
                            <label htmlFor="competition-select" className="sr-only">Select Competition</label>
                            <select
                                id="competition-select"
                                value={selectedCompetition}
                                onChange={(e) => setSelectedCompetition(e.target.value)}
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-light focus:border-primary-light sm:text-sm rounded-md shadow-sm"
                                disabled={competitionOptions.length === 0}
                            >
                                {competitionOptions.map(group => (
                                    <optgroup key={group.label} label={group.label}>
                                        {group.options.map(comp => (
                                            <option key={comp.value} value={comp.value}>{comp.name}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                
                <div className="border-b border-gray-200">
                    <div className="px-4 flex space-x-4" role="tablist" aria-label="Fixtures and Results">
                        <TabButton tabName="fixtures">Fixtures</TabButton>
                        <TabButton tabName="results">Results</TabButton>
                    </div>
                </div>

                <div role="tabpanel" hidden={activeTab !== 'fixtures'}>
                    {activeFixtureMatchday !== null && fixtureMatchdays.length > 1 && (
                        <MatchdaySelector matchdays={fixtureMatchdays} active={activeFixtureMatchday} onSelect={setActiveFixtureMatchday} />
                    )}
                    {loading ? <div className="flex justify-center p-8"><Spinner /></div> :
                    activeFixtureMatchday !== null && groupedFixtures[activeFixtureMatchday] ?
                        renderFixtureList(groupedFixtures[activeFixtureMatchday], expandedFixtureId, handleToggleDetails)
                    : <p className="p-6 text-center text-gray-500">No upcoming fixtures for this competition.</p>
                    }
                </div>

                <div role="tabpanel" hidden={activeTab !== 'results'}>
                    {activeResultMatchday !== null && resultMatchdays.length > 1 && (
                         <MatchdaySelector matchdays={resultMatchdays} active={activeResultMatchday} onSelect={setActiveResultMatchday} />
                    )}
                    {loading ? <div className="flex justify-center p-8"><Spinner /></div> :
                     activeResultMatchday !== null && groupedResults[activeResultMatchday] ?
                        renderFixtureList(groupedResults[activeResultMatchday], expandedResultId, handleToggleResultDetails)
                     : <p className="p-6 text-center text-gray-500">No results available for this competition yet.</p>
                    }
                </div>

            </Card>
            <div className="mt-8">
                 <AdBanner placement="fixtures-banner" />
            </div>
        </section>
    );
};

export default Fixtures;
