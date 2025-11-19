
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import { CompetitionFixture, Team, Competition } from '../data/teams';
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

interface FixturesProps {
    showSelector?: boolean;
    defaultCompetition?: string;
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
    
    const teamA = useMemo(() => teams.find(t => t.name.trim() === (fixture.teamA || '').trim()), [teams, fixture.teamA]);
    const teamB = useMemo(() => teams.find(t => t.name.trim() === (fixture.teamB || '').trim()), [teams, fixture.teamB]);
    
    const teamADirectory = findInMap(fixture.teamA || '', directoryMap);
    const teamBDirectory = findInMap(fixture.teamB || '', directoryMap);

    const crestA = teamADirectory?.crestUrl || teamA?.crestUrl;
    const crestB = teamBDirectory?.crestUrl || teamB?.crestUrl;

    const getLinkProps = (teamObj: Team | undefined, teamName: string) => {
        // 1. Prioritize direct ID from competition data
        if (teamObj?.id) {
            return { isLinkable: true, competitionId, teamId: teamObj.id };
        }
        // 2. Fallback to directory for inconsistent data
        const entity = findInMap(teamName || '', directoryMap);
        if (entity?.teamId && entity.competitionId) {
            return { isLinkable: true, competitionId: entity.competitionId, teamId: entity.teamId };
        }
        return { isLinkable: false, competitionId: null, teamId: null };
    };

    const teamALink = getLinkProps(teamA, fixture.teamA);
    const teamBLink = getLinkProps(teamB, fixture.teamB);

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();

        let title = `⚽ Match: ${fixture.teamA} vs ${fixture.teamB}`;
        let text = `Check out this Football Eswatini match!\n\n${fixture.teamA} vs ${fixture.teamB}`;

        if (fixture.status === 'live' || fixture.status === 'finished') {
            text += `\nScore: ${fixture.scoreA} - ${fixture.scoreB}`;
            if (fixture.status === 'live' && fixture.liveMinute) {
                text += ` (Live at ${fixture.liveMinute}')`;
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
                    <div className="absolute top-2 right-2 flex items-center space-x-1.5 text-secondary font-bold text-xs animate-pulse">
                        <span className="w-2 h-2 bg-secondary rounded-full"></span>
                        <span>LIVE</span>
                    </div>
                );
            case 'finished':
                return (
                    <div className="absolute top-2 right-2 text-gray-500 font-bold text-xs">
                        <span>FT</span>
                    </div>
                );
            case 'postponed':
                return (
                    <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider">
                        Postponed
                    </div>
                );
            case 'cancelled':
                return (
                    <div className="absolute top-2 right-2 bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider">
                        Cancelled
                    </div>
                );
            case 'abandoned':
                return (
                    <div className="absolute top-2 right-2 bg-gray-800 text-white px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider">
                        Abandoned
                    </div>
                );
             case 'suspended':
                return (
                    <div className="absolute top-2 right-2 bg-orange-100 text-orange-800 px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider">
                        Suspended
                    </div>
                );
            default:
                return null;
        }
    };

    const getStatusBorder = () => {
        switch (fixture.status) {
            case 'live': return 'border-secondary';
            case 'postponed': return 'border-yellow-500';
            case 'cancelled': return 'border-red-600';
            case 'abandoned': return 'border-gray-600';
            case 'suspended': return 'border-orange-500';
            default: return 'border-transparent hover:border-accent';
        }
    };

    const isScoreVisible = fixture.status === 'live' || fixture.status === 'finished' || (fixture.status === 'abandoned' && fixture.scoreA !== undefined);

    return (
        <div className={`flex items-center hover:bg-gray-50/50 transition-colors duration-200 border-l-4 ${getStatusBorder()}`}>
            <button
                onClick={onToggleDetails}
                className="flex-grow w-full text-left"
                aria-expanded={isExpanded}
                aria-controls={`fixture-details-${fixture.id}`}
            >
                <div className="relative flex items-center space-x-4 p-4 min-h-[100px]">
                    {getStatusBadge()}
                    
                    {/* Date Box: Uses Primary Blue with a Yellow Accent Border */}
                    <div className={`flex flex-col items-center justify-center ${fixture.status === 'live' ? 'bg-secondary text-white animate-pulse' : 'bg-primary text-white'} w-16 h-16 rounded-lg shadow-sm flex-shrink-0 transition-colors duration-300 border-b-4 ${fixture.status === 'live' ? 'border-red-800' : 'border-accent'}`}>
                        <span className="font-bold text-xl">{fixture.date}</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider">{fixture.day}</span>
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
                        
                        {isScoreVisible ? (
                            <div className="text-center">
                                <p 
                                    key={`score-${fixture.id}-${fixture.scoreA}-${fixture.scoreB}`}
                                    className={`font-bold text-2xl ${fixture.status === 'live' ? 'text-secondary animate-score-update' : 'text-primary'} tracking-wider`}
                                >
                                    {fixture.scoreA} - {fixture.scoreB}
                                </p>
                                {fixture.status === 'live' && <p className="text-xs font-bold text-secondary mt-0.5">{fixture.liveMinute}'</p>}
                                {fixture.status === 'abandoned' && <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-gray-600 px-2 py-0.5 rounded mt-1 inline-block">Abandoned</span>}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center">
                                <p className="text-sm text-red-500 font-black font-display italic tracking-widest">VS</p>
                                {fixture.status === 'postponed' && <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-900 bg-yellow-200 px-2 py-0.5 rounded mt-1">Postponed</span>}
                                {fixture.status === 'cancelled' && <span className="text-[10px] font-bold uppercase tracking-wider text-red-900 bg-red-200 px-2 py-0.5 rounded mt-1">Cancelled</span>}
                                {fixture.status === 'suspended' && <span className="text-[10px] font-bold uppercase tracking-wider text-orange-900 bg-orange-200 px-2 py-0.5 rounded mt-1">Suspended</span>}
                                {fixture.status === 'abandoned' && <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-gray-700 px-2 py-0.5 rounded mt-1">Abandoned</span>}
                                
                                <p className="text-xs text-gray-400 mt-1">{fixture.time}</p>
                            </div>
                        )}

                        <div className="flex justify-start items-center gap-3 pl-2">
                            {crestB && <img src={crestB} alt={`${fixture.teamB} crest`} loading="lazy" className="w-6 h-6 object-contain flex-shrink-0 bg-white p-0.5 rounded-md shadow-sm" />}
                            {teamBLink.isLinkable ? (
                                <Link to={`/competitions/${teamBLink.competitionId}/teams/${teamBLink.teamId}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-gray-800 text-left truncate hover:underline">{fixture.teamB}</Link>
                            ) : (
                                <p className="font-semibold text-gray-800 text-left truncate">{fixture.teamB}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex-shrink-0 ml-4 flex flex-col items-center gap-2">
                         <div className="flex gap-2">
                            <button
                                onClick={handleShare}
                                className="text-gray-400 hover:text-blue-600 p-1.5 rounded-full hover:bg-blue-50 transition-colors"
                                aria-label="Share match"
                            >
                                <ShareIcon className="w-5 h-5" />
                            </button>
                            {user?.role === 'super_admin' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteFixture(fixture); }}
                                    className="text-gray-400 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                                    disabled={isDeleting}
                                    aria-label="Delete fixture"
                                >
                                    {isDeleting ? <Spinner className="w-4 h-4 border-red-600 border-2" /> : <TrashIcon className="w-5 h-5" />}
                                </button>
                            )}
                        </div>
                         <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'transform rotate-180' : ''}`} />
                    </div>
                     {copied && (
                        <span className="absolute top-2 right-12 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10 animate-fade-in-tooltip">
                            Link Copied!
                        </span>
                    )}
                </div>
            </button>
            {isExpanded && (
                <div id={`fixture-details-${fixture.id}`} className="border-t border-gray-100 bg-gray-50/50 p-4">
                    <FixtureDetail fixture={fixture} competitionId={competitionId} />
                </div>
            )}
        </div>
    );
});

const Fixtures: React.FC<FixturesProps> = ({ showSelector = true, defaultCompetition = 'mtn-premier-league' }) => {
    const [selectedComp, setSelectedComp] = useState(defaultCompetition);
    const [activeTab, setActiveTab] = useState<'fixtures' | 'results'>('fixtures');
    const [competition, setCompetition] = useState<Competition | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedFixtureId, setExpandedFixtureId] = useState<number | null>(null);
    const [directoryMap, setDirectoryMap] = useState<Map<string, DirectoryEntity>>(new Map());
    const [compOptions, setCompOptions] = useState<{ label: string, options: { value: string; name: string; }[] }[]>([]);
    const [deletingId, setDeletingId] = useState<number | string | null>(null);

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
                    
                    if (finalOptions.length > 0 && !allCompetitions.some(c => c.id === defaultCompetition)) {
                        const firstOpt = finalOptions[0].options[0];
                        if (firstOpt) setSelectedComp(firstOpt.value);
                    }
                }
             } catch (error) {
                 console.error("Error loading fixture metadata", error);
             }
        };
        loadMetadata();
    }, [showSelector, defaultCompetition]);


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
                const matchA = fixture.teamA.trim();
                const matchB = fixture.teamB.trim();
                const matchDate = fixture.fullDate;

                // Robust Deletion Strategy:
                // 1. Try to delete by ID.
                // 2. If nothing removed, try to delete by content (Team A + Team B + Date).
                const filterList = (list: CompetitionFixture[]) => {
                    const initialLen = list.length;
                    // 1. ID Match
                    let filtered = list.filter(f => String(f.id).trim() !== targetId);
                    
                    // 2. Content Fallback
                    if (filtered.length === initialLen) {
                        filtered = list.filter(f => {
                             const fTeamA = f.teamA.trim();
                             const fTeamB = f.teamB.trim();
                             // Check exact match or swapped teams (unlikely for scheduled but possible for manual entry error)
                             const teamsMatch = (fTeamA === matchA && fTeamB === matchB) || (fTeamA === matchB && fTeamB === matchA);
                             const dateMatches = f.fullDate === matchDate;
                             return !(teamsMatch && dateMatches);
                        });
                    }
                    return filtered;
                };

                const updatedFixtures = filterList(compData.fixtures || []);
                const updatedResults = filterList(compData.results || []);
                
                // Check if anything was removed
                const deletedCount = ((compData.fixtures?.length || 0) - updatedFixtures.length) + ((compData.results?.length || 0) - updatedResults.length);
                
                if (deletedCount === 0) {
                    throw new Error(`Could not find match to delete. It might have already been removed.`);
                }
                
                // Always recalculate standings to ensure consistency
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
        const sourceData = isResults ? (competition.results || []) : (competition.fixtures || []);
        
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
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                 <div className="flex items-center gap-4">
                    {competition?.logoUrl && <img src={competition.logoUrl} alt={`${competition.name} logo`} className="h-10 object-contain" />}
                    <h2 className="text-3xl font-display font-bold text-center lg:text-left">Fixtures & Results</h2>
                </div>
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

            {/* Color-coded Tabs for Fixtures (Blue) vs Results (Red) */}
            <div className="flex justify-center sm:justify-start space-x-2 bg-gray-100 p-1.5 rounded-lg w-fit mb-6 mx-auto sm:mx-0 shadow-inner">
                <button
                    onClick={() => setActiveTab('fixtures')}
                    className={`px-6 py-2 text-sm font-bold rounded-md transition-all duration-300 ${
                        activeTab === 'fixtures' 
                        ? 'bg-primary text-white shadow-md ring-1 ring-black/5' 
                        : 'text-gray-600 hover:text-primary hover:bg-white'
                    }`}
                >
                    Fixtures
                </button>
                <button
                    onClick={() => setActiveTab('results')}
                    className={`px-6 py-2 text-sm font-bold rounded-md transition-all duration-300 ${
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
                <div className="space-y-8">
                    {groupedData.map((group, groupIndex) => (
                        <div key={group.title} className="animate-content-fade-in">
                            <div className="flex items-center mb-4">
                                {/* Group Header with Blue Background and Yellow Accent Border */}
                                <div className="bg-primary text-white px-4 py-1.5 rounded-r-full shadow-md inline-flex items-center gap-2 border-l-4 border-accent">
                                    <span className="text-sm font-bold uppercase tracking-widest">{group.title}</span>
                                </div>
                                <div className="flex-grow h-px bg-gray-200 ml-4"></div>
                            </div>
                            
                            <Card className="shadow-lg mb-6">
                                <div className="divide-y divide-gray-100">
                                    {group.fixtures.map((fixture) => (
                                        <FixtureItem 
                                            key={fixture.id}
                                            fixture={fixture} 
                                            isExpanded={expandedFixtureId === fixture.id} 
                                            onToggleDetails={() => setExpandedFixtureId(expandedFixtureId === fixture.id ? null : fixture.id)}
                                            teams={competition?.teams || []}
                                            onDeleteFixture={handleDeleteFixture}
                                            isDeleting={String(deletingId).trim() === String(fixture.id).trim()}
                                            directoryMap={directoryMap}
                                            competitionId={selectedComp}
                                        />
                                    ))}
                                </div>
                            </Card>
                            {groupIndex === 0 && <AdBanner placement="fixtures-banner" className="mb-8" />}
                        </div>
                    ))}
                </div>
            ) : (
                <Card className="shadow-lg">
                    <p className="p-6 text-center text-gray-500">
                        {activeTab === 'fixtures' ? 'No upcoming fixtures scheduled.' : 'No results found for this competition.'}
                    </p>
                </Card>
            )}
        </section>
    );
};

export default Fixtures;
