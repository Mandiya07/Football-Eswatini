import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import { CompetitionFixture, Team, Competition, MatchEvent } from '../data/teams';
import { DirectoryEntity } from '../data/directory';
import ChevronDownIcon from './icons/ChevronDownIcon';
import FixtureDetail from './FixtureDetail';
import ShareIcon from './icons/ShareIcon';
import AdBanner from './AdBanner';
import { fetchAllCompetitions, listenToCompetition, fetchCategories, fetchDirectoryEntries, handleFirestoreError, Category } from '../services/api';
import Spinner from './ui/Spinner';
import { useAuth } from '../contexts/AuthContext';
import TrashIcon from './icons/TrashIcon';
import { db } from '../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { calculateStandings, removeUndefinedProps, findInMap } from '../services/utils';
import Button from './ui/Button';

interface FixturesProps {
    showSelector?: boolean;
    defaultCompetition?: string;
    maxHeight?: string;
}

interface FixtureItemProps {
    fixture: CompetitionFixture;
    isExpanded: boolean;
    onToggleDetails: () => void;
    teams: Team[];
    onDeleteFixture: (fixture: CompetitionFixture) => void;
    isDeleting: boolean;
    directoryMap: Map<string, DirectoryEntity>;
    competitionId: string;
}

export const FixtureItem: React.FC<FixtureItemProps> = React.memo(({ fixture, isExpanded, onToggleDetails, teams, onDeleteFixture, isDeleting, directoryMap, competitionId }) => {
    const [copied, setCopied] = useState(false);
    const { user } = useAuth();
    
    // Live Match Simulation State
    const [displayMinute, setDisplayMinute] = useState<string | number>(fixture.liveMinute || 0);

    useEffect(() => {
        if (fixture.status === 'live') {
            setDisplayMinute(fixture.liveMinute || 0);
            
            // Only auto-increment if it's a number (not "HT", "FT", "45+2" etc usually handled by manual update)
            if (typeof fixture.liveMinute === 'number') {
                const interval = setInterval(() => {
                    setDisplayMinute(prev => {
                        if (typeof prev === 'number' && prev < 90) return prev + 1;
                        return prev;
                    });
                }, 60000); // Update every minute
                return () => clearInterval(interval);
            }
        }
    }, [fixture.status, fixture.liveMinute]);

    const teamA = useMemo(() => teams.find(t => t.name.trim() === (fixture.teamA || '').trim()), [teams, fixture.teamA]);
    const teamB = useMemo(() => teams.find(t => t.name.trim() === (fixture.teamB || '').trim()), [teams, fixture.teamB]);
    
    const teamADirectory = findInMap(fixture.teamA || '', directoryMap);
    const teamBDirectory = findInMap(fixture.teamB || '', directoryMap);

    const crestA = teamADirectory?.crestUrl || teamA?.crestUrl;
    const crestB = teamBDirectory?.crestUrl || teamB?.crestUrl;

    // Parse Goal Scorers
    const { homeGoals, awayGoals } = useMemo(() => {
        const events = fixture.events || [];
        const home = events.filter(e => e.type === 'goal' && (e.teamName === fixture.teamA || (!e.teamName && !fixture.teamB))).map(e => `${e.playerName || 'Goal'} ${e.minute}'`);
        const away = events.filter(e => e.type === 'goal' && (e.teamName === fixture.teamB)).map(e => `${e.playerName || 'Goal'} ${e.minute}'`);
        return { homeGoals: home, awayGoals: away };
    }, [fixture.events, fixture.teamA, fixture.teamB]);

    const getLinkProps = (teamObj: Team | undefined, teamName: string) => {
        // 1. Direct match in current competition context -> Link to Profile
        if (teamObj?.id) {
            return { type: 'profile', url: `/competitions/${competitionId}/teams/${teamObj.id}` };
        }
        
        // 2. Check Directory for cross-linked ID -> Link to Profile
        const entity = findInMap(teamName || '', directoryMap);
        if (entity?.teamId && entity.competitionId) {
             return { type: 'profile', url: `/competitions/${entity.competitionId}/teams/${entity.teamId}` };
        }
        
        // 3. Fallback: Found in Directory but no profile ID -> Link to Directory Search
        if (entity) {
             return { type: 'directory', url: `/directory?q=${encodeURIComponent(entity.name)}` };
        }

        return { type: 'none', url: '' };
    };

    const teamALink = getLinkProps(teamA, fixture.teamA);
    const teamBLink = getLinkProps(teamB, fixture.teamB);

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        let title = `⚽ Match: ${fixture.teamA} vs ${fixture.teamB}`;
        let text = `Check out this Football Eswatini match!\n\n${fixture.teamA} vs ${fixture.teamB}`;

        if (fixture.status === 'live' || fixture.status === 'finished') {
            text += `\nScore: ${fixture.scoreA} - ${fixture.scoreB}`;
            if (fixture.scoreAPen !== undefined && fixture.scoreBPen !== undefined) {
                text += ` (${fixture.scoreAPen}-${fixture.scoreBPen} on penalties)`;
            }
            if (fixture.status === 'live' && displayMinute) {
                text += ` (Live at ${displayMinute}')`;
            } else if (fixture.status === 'finished') {
                text += ' (Full Time)';
            }
        } else if (['postponed', 'cancelled', 'abandoned'].includes(fixture.status || '')) {
            text += `\nStatus: ${fixture.status?.toUpperCase()}`;
        } else {
            text += `\n📅 On ${fixture.day}, ${fixture.date} at ${fixture.time}`;
        }
        
        if (fixture.venue) {
            text += `\n🏟️ At ${fixture.venue}`;
        }

        const shareData = {
          title: title,
          text: text,
          url: window.location.href,
        };
    
        if (navigator.share) {
          try {
            await navigator.share(shareData);
          } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                 console.error('Error sharing:', err);
            }
          }
        } else {
          try {
            await navigator.clipboard.writeText(`${text}\n\nView here: ${window.location.href}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            alert('Could not copy link to clipboard.');
          }
        }
    };
    
    const getStatusBadge = () => {
        switch (fixture.status) {
            case 'live':
                return (
                    <div className="absolute top-1 right-1 flex items-center space-x-1 text-secondary font-bold text-[9px]">
                        <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-ping"></span>
                        <span>LIVE</span>
                    </div>
                );
            case 'finished':
                return (
                    <div className="absolute top-1 right-1 text-gray-400 font-bold text-[9px]">
                        <span>FT</span>
                    </div>
                );
            case 'postponed':
                return (
                    <div className="absolute top-1 right-1 bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded font-bold text-[8px] uppercase tracking-wider">
                        Postponed
                    </div>
                );
            case 'cancelled':
                return (
                    <div className="absolute top-1 right-1 bg-red-100 text-red-800 px-1 py-0.5 rounded font-bold text-[8px] uppercase tracking-wider">
                        Cancelled
                    </div>
                );
            case 'abandoned':
                return (
                    <div className="absolute top-1 right-1 bg-gray-800 text-white px-1 py-0.5 rounded font-bold text-[8px] uppercase tracking-wider">
                        Abandoned
                    </div>
                );
             case 'suspended':
                return (
                    <div className="absolute top-1 right-1 bg-orange-100 text-orange-800 px-1 py-0.5 rounded font-bold text-[8px] uppercase tracking-wider">
                        Suspended
                    </div>
                );
            default:
                return null;
        }
    };

    const getStatusBorder = () => {
        switch (fixture.status) {
            case 'live': return 'border-secondary bg-red-50/10';
            case 'postponed': return 'border-yellow-500';
            case 'cancelled': return 'border-red-600';
            case 'abandoned': return 'border-gray-600';
            case 'suspended': return 'border-orange-500';
            default: return 'border-transparent hover:border-accent';
        }
    };

    const isScoreVisible = fixture.status === 'live' || fixture.status === 'finished' || (fixture.status === 'abandoned' && fixture.scoreA !== undefined);

    const renderTeamName = (name: string, linkProps: { type: string, url: string }) => {
        if (linkProps.type === 'profile' || linkProps.type === 'directory') {
            return (
                <Link 
                    to={linkProps.url} 
                    onClick={(e) => e.stopPropagation()} 
                    className="font-semibold text-gray-800 hover:underline hover:text-primary transition-colors text-sm sm:text-base truncate block w-full"
                    title={linkProps.type === 'directory' ? 'View in Directory' : 'View Team Profile'}
                >
                    {name}
                </Link>
            );
        }
        return <p className="font-semibold text-gray-800 truncate text-sm sm:text-base block w-full">{name}</p>;
    };

    return (
        <div className={`flex items-stretch hover:bg-gray-50/50 transition-colors duration-200 border-l-4 ${getStatusBorder()}`}>
            <div 
                className="flex-grow relative flex items-center space-x-2 p-3 min-h-[70px] cursor-pointer"
                onClick={onToggleDetails}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                aria-controls={`fixture-details-${fixture.id}`}
                onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') onToggleDetails(); }}
            >
                {getStatusBadge()}
                
                <div className={`flex flex-col items-center justify-center ${fixture.status === 'live' ? 'bg-secondary text-white' : 'bg-primary text-white'} w-12 h-12 rounded-md shadow-sm flex-shrink-0 transition-colors duration-300 border-b-2 ${fixture.status === 'live' ? 'border-red-800' : 'border-accent'}`}>
                    <span className="font-bold text-base leading-tight">{fixture.date}</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider">{fixture.day}</span>
                </div>

                <div className="flex-grow grid grid-cols-[1fr_auto_1fr] items-center text-center gap-2">
                    {/* Home Team */}
                    <div className="flex justify-end items-center gap-2 pr-1 overflow-hidden w-full">
                        <div className="text-right flex-grow min-w-0 flex flex-col items-end">
                             {renderTeamName(fixture.teamA, teamALink)}
                             {isScoreVisible && homeGoals.length > 0 && (
                                <div className="text-[10px] text-gray-500 leading-tight mt-0.5">
                                    {homeGoals.join(', ')}
                                </div>
                             )}
                        </div>
                        {crestA && <img src={crestA} alt={`${fixture.teamA} crest`} loading="lazy" className="w-6 h-6 object-contain flex-shrink-0 bg-white rounded-sm shadow-sm" />}
                    </div>
                    
                    {/* Score / Time */}
                    {isScoreVisible ? (
                        <div className="text-center min-w-[5rem] flex flex-col justify-center">
                            <p className={`font-bold text-xl leading-none ${fixture.status === 'live' ? 'text-red-600' : 'text-gray-900'}`}>
                                {fixture.scoreA ?? '-'} - {fixture.scoreB ?? '-'}
                            </p>
                            {(fixture.scoreAPen !== undefined && fixture.scoreBPen !== undefined) && (
                                <p className="text-xs font-semibold text-gray-500 mt-1">
                                    ({fixture.scoreAPen} - {fixture.scoreBPen} pen)
                                </p>
                            )}
                            {fixture.status === 'live' && (
                                <p className="text-[10px] font-bold text-red-600 mt-1 bg-red-100 px-1.5 py-0.5 rounded-full leading-none flex items-center justify-center gap-1 animate-pulse">
                                    {displayMinute}'
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center min-w-[5rem]">
                            <p className="text-sm text-red-500 font-black font-display italic tracking-widest">VS</p>
                            {fixture.status === 'postponed' && <span className="text-[9px] font-bold uppercase text-yellow-900 bg-yellow-200 px-1 rounded mt-0.5">PP</span>}
                            {fixture.status === 'cancelled' && <span className="text-[9px] font-bold uppercase text-red-900 bg-red-200 px-1 rounded mt-0.5">CANC</span>}
                            <p className="text-xs text-gray-400 mt-0.5">{fixture.time}</p>
                        </div>
                    )}

                    {/* Away Team */}
                    <div className="flex justify-start items-center gap-2 pl-1 overflow-hidden w-full">
                        {crestB && <img src={crestB} alt={`${fixture.teamB} crest`} loading="lazy" className="w-6 h-6 object-contain flex-shrink-0 bg-white rounded-sm shadow-sm" />}
                        <div className="text-left flex-grow min-w-0 flex flex-col items-start">
                             {renderTeamName(fixture.teamB, teamBLink)}
                             {isScoreVisible && awayGoals.length > 0 && (
                                <div className="text-[10px] text-gray-500 leading-tight mt-0.5">
                                    {awayGoals.join(', ')}
                                </div>
                             )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-1 px-2 border-l border-gray-100 bg-white/50">
                <div className="flex flex-col gap-1">
                    <button
                        onClick={handleShare}
                        className="text-gray-400 hover:text-blue-600 p-1.5 rounded-full hover:bg-blue-50 transition-colors flex items-center justify-center w-8 h-8"
                        aria-label="Share match"
                        type="button"
                    >
                        <ShareIcon className="w-4 h-4" />
                    </button>
                    {user?.role === 'super_admin' && (
                        <button
                            onClick={(e) => { 
                                e.preventDefault(); 
                                e.stopPropagation(); 
                                onDeleteFixture(fixture); 
                            }}
                            className="text-gray-400 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50 transition-colors flex items-center justify-center w-8 h-8"
                            disabled={isDeleting}
                            aria-label="Delete fixture"
                            type="button"
                            title="Delete Fixture"
                        >
                            {isDeleting ? <Spinner className="w-3 h-3 border-red-600 border-2" /> : <TrashIcon className="w-4 h-4" />}
                        </button>
                    )}
                </div>
                <button 
                    onClick={onToggleDetails}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center w-8 h-8"
                    aria-label="Toggle details"
                    type="button"
                >
                    <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'transform rotate-180' : ''}`} />
                </button>
                
                {copied && (
                    <span className="absolute top-2 right-12 bg-gray-800 text-white text-[9px] rounded py-0.5 px-1.5 whitespace-nowrap z-10 animate-fade-in-tooltip">
                        Copied!
                    </span>
                )}
            </div>

            {isExpanded && (
                <div id={`fixture-details-${fixture.id}`} className="w-full basis-full border-t border-gray-100 bg-gray-50/50 p-2">
                    <FixtureDetail fixture={fixture} competitionId={competitionId} />
                </div>
            )}
        </div>
    );
});

const Fixtures: React.FC<FixturesProps> = ({ showSelector = true, defaultCompetition = 'mtn-premier-league', maxHeight }) => {
    const [selectedComp, setSelectedComp] = useState(defaultCompetition);
    const [activeTab, setActiveTab] = useState<'fixtures' | 'results'>('fixtures');
    const [competition, setCompetition] = useState<Competition | null>(null);
    const [loading, setLoading] = useState(true);
    // FIX: Update expandedFixtureId type to support string | number to match revised CompetitionFixture
    const [expandedFixtureId, setExpandedFixtureId] = useState<number | string | null>(null);
    const [directoryMap, setDirectoryMap] = useState<Map<string, DirectoryEntity>>(new Map());
    const [compOptions, setCompOptions] = useState<{ label: string, options: { value: string; name: string; }[] }[]>([]);
    const [deletingId, setDeletingId] = useState<number | string | null>(null);

    useEffect(() => {
        if (defaultCompetition) {
            setSelectedComp(defaultCompetition);
        }
    }, [defaultCompetition]);

    useEffect(() => {
        const loadMetadata = async () => {
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

                    const finalOptions = Array.from(categoryGroups.values())
                        .filter(group => group.competitions.length > 0)
                        .sort((a, b) => a.order - b.order)
                        .map(group => ({
                            label: group.name,
                            options: group.competitions.sort((a, b) => a.name.localeCompare(b.name))
                        }));
                    
                    if (uncategorizedCompetitions.length > 0) {
                        finalOptions.push({
                            label: "Other Leagues",
                            options: uncategorizedCompetitions.sort((a, b) => a.name.localeCompare(b.name))
                        });
                    }
                    setCompOptions(finalOptions);
                    
                    if (showSelector && finalOptions.length > 0 && !allCompetitions.some(c => c.id === selectedComp)) {
                         const firstOpt = finalOptions[0].options[0];
                         if (firstOpt) setSelectedComp(firstOpt.value);
                    }
                }
             } catch (error) {
                 console.error("Error loading fixture metadata", error);
             }
        };
        loadMetadata();
    }, [showSelector]);


    useEffect(() => {
        setLoading(true);
        const unsubscribe = listenToCompetition(selectedComp, (data) => {
            if (data) {
                setCompetition(data);
            } else {
                setCompetition(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [selectedComp]);

    const handleDeleteFixture = async (fixture: CompetitionFixture) => {
         if (!window.confirm("Are you sure you want to delete this match?")) return;
         
         setDeletingId(fixture.id);
         try {
            const docRef = doc(db, 'competitions', selectedComp);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if(!docSnap.exists()) throw new Error("Competition not found");
                const compData = docSnap.data() as Competition;
                
                const targetId = String(fixture.id).trim();
                const filterList = (list: CompetitionFixture[]) => list.filter(f => String(f.id).trim() !== targetId);

                const updatedFixtures = filterList(compData.fixtures || []);
                const updatedResults = filterList(compData.results || []);
                
                const updatedTeams = calculateStandings(compData.teams || [], updatedResults, updatedFixtures);
                transaction.update(docRef, removeUndefinedProps({ fixtures: updatedFixtures, results: updatedResults, teams: updatedTeams }));
            });
         } catch(error) {
             console.error("Failed to delete fixture:", error);
             alert("Failed to delete fixture. " + (error as Error).message);
             handleFirestoreError(error, 'delete fixture');
         } finally {
             setDeletingId(null);
         }
    };

    const groupedData = useMemo(() => {
        if (!competition) return [];

        const isResults = activeTab === 'results';
        let sourceData = isResults ? (competition.results || []) : (competition.fixtures || []);
        
        const todayStr = new Date().toISOString().split('T')[0];

        if (!isResults) {
            sourceData = sourceData.filter(f => {
                const isFinished = f.status === 'finished';
                const hasScore = f.scoreA !== undefined && f.scoreB !== undefined;
                // Only hide if fullDate is strictly less than today. If equal, keep it (match happens today).
                const isStrictlyPast = f.fullDate && f.fullDate < todayStr;
                return !isFinished && !hasScore && !isStrictlyPast;
            });
        } else {
            sourceData = sourceData.filter(f => {
                const isFinished = f.status === 'finished';
                const hasScore = f.scoreA !== undefined && f.scoreB !== undefined;
                const isAbandoned = f.status === 'abandoned';
                return isFinished || hasScore || isAbandoned;
            });
        }
        
        const groups: Record<string, CompetitionFixture[]> = {};
        sourceData.forEach(fixture => {
            const key = fixture.matchday ? `Matchday ${fixture.matchday}` : 'Unscheduled / Other';
            if (!groups[key]) groups[key] = [];
            groups[key].push(fixture);
        });

        Object.values(groups).forEach(group => {
            group.sort((a, b) => {
                 const dateA = new Date((a.fullDate || '1970-01-01') + 'T' + (a.time || '00:00')).getTime();
                 const dateB = new Date((b.fullDate || '1970-01-01') + 'T' + (b.time || '00:00')).getTime();
                 return isResults ? dateB - dateA : dateA - dateB;
            });
        });

        const sortedKeys = Object.keys(groups).sort((a, b) => {
            const isMatchdayA = a.startsWith('Matchday');
            const isMatchdayB = b.startsWith('Matchday');

            if (isMatchdayA && isMatchdayB) {
                const numA = parseInt(a.replace('Matchday ', ''), 10);
                const numB = parseInt(b.replace('Matchday ', ''), 10);
                return isResults ? numB - numA : numA - numB;
            }
            
            if (isMatchdayA) return -1;
            if (isMatchdayB) return 1;
            return a.localeCompare(b);
        });

        return sortedKeys.map(key => ({ title: key, fixtures: groups[key] }));
    }, [competition, activeTab]);

    return (
        <section>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                {showSelector && (
                     <div className="flex items-center gap-4">
                        {competition?.logoUrl && <img src={competition.logoUrl} alt={`${competition.name} logo`} className="h-10 object-contain" />}
                        <h2 className="text-3xl font-display font-bold text-center lg:text-left">Fixtures & Results</h2>
                    </div>
                )}
                {showSelector && (
                    <div className="min-w-[200px]">
                         <select
                            value={selectedComp}
                            onChange={(e) => setSelectedComp(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-light focus:border-primary-light sm:text-sm rounded-md shadow-sm"
                        >
                            {compOptions.map(group => (
                                <optgroup key={group.label} label={group.label}>
                                    {group.options.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="flex justify-center sm:justify-start space-x-2 bg-gray-100 p-1 rounded-lg w-fit mb-4 mx-auto sm:mx-0 shadow-inner">
                <button
                    onClick={() => setActiveTab('fixtures')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-300 ${
                        activeTab === 'fixtures' 
                        ? 'bg-primary text-white shadow-md ring-1 ring-black/5' 
                        : 'text-gray-600 hover:text-primary hover:bg-white'
                    }`}
                >
                    Fixtures
                </button>
                <button
                    onClick={() => setActiveTab('results')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-300 ${
                        activeTab === 'results' 
                        ? 'bg-secondary text-white shadow-md ring-1 ring-black/5' 
                        : 'text-gray-600 hover:text-secondary hover:bg-white'
                    }`}
                >
                    Results
                </button>
            </div>

            {loading ? (
                <Card className="shadow-lg">
                    <div className="flex justify-center items-center h-64"><Spinner /></div>
                </Card>
            ) : groupedData.length > 0 ? (
                <div className={maxHeight ? `overflow-y-auto ${maxHeight} pr-1` : ''}>
                    <div className="space-y-6">
                        {groupedData.map((group, groupIndex) => (
                            <div key={group.title} className="animate-content-fade-in">
                                <div className="flex items-center mb-2 sticky top-0 z-10 bg-gray-50/95 py-1 backdrop-blur-sm">
                                    <div className="bg-primary text-white px-3 py-1 rounded-r-full shadow-md inline-flex items-center gap-2 border-l-4 border-accent">
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{group.title}</span>
                                    </div>
                                    <div className="flex-grow h-px bg-gray-200 ml-2"></div>
                                </div>
                                
                                <Card className="shadow-md mb-4 overflow-hidden">
                                    <div className="divide-y divide-gray-100">
                                        {group.fixtures.map((fixture) => (
                                            <div key={fixture.id} className={expandedFixtureId === fixture.id ? 'flex flex-col' : ''}>
                                                <FixtureItem 
                                                    fixture={fixture} 
                                                    isExpanded={expandedFixtureId === fixture.id} 
                                                    onToggleDetails={() => setExpandedFixtureId(expandedFixtureId === fixture.id ? null : fixture.id)}
                                                    teams={competition?.teams || []}
                                                    onDeleteFixture={handleDeleteFixture}
                                                    isDeleting={String(deletingId).trim() === String(fixture.id).trim()}
                                                    directoryMap={directoryMap}
                                                    competitionId={selectedComp}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                                {groupIndex === 0 && <AdBanner placement="fixtures-banner" className="mb-6" />}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <Card className="shadow-lg">
                    <p className="p-6 text-center text-gray-500 text-sm">
                        {activeTab === 'fixtures' ? 'No upcoming fixtures scheduled.' : 'No results found for this competition.'}
                    </p>
                </Card>
            )}
        </section>
    );
};

export default Fixtures;