
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import { CompetitionFixture, Team, Competition, MatchEvent } from '../data/teams';
import { DirectoryEntity } from '../data/directory';
import ChevronDownIcon from './icons/ChevronDownIcon';
import FixtureDetail from './FixtureDetail';
import ShareIcon from './icons/ShareIcon';
import AdBanner from './AdBanner';
import { fetchAllCompetitions, listenToCompetition, fetchCategories, fetchDirectoryEntries, handleFirestoreError, Category, fetchFootballDataOrg, fetchApiFootball } from '../services/api';
import Spinner from './ui/Spinner';
import { useAuth } from '../contexts/AuthContext';
import TrashIcon from './icons/TrashIcon';
import { db } from '../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { calculateStandings, removeUndefinedProps, findInMap } from '../services/utils';
import Button from './ui/Button';
import CollapsibleSelector from './ui/CollapsibleSelector';
import ClockIcon from './icons/ClockIcon';

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
    const [displayMinute, setDisplayMinute] = useState<string | number>(fixture.liveMinute || 0);

    useEffect(() => {
        if (fixture.status === 'live') {
            setDisplayMinute(fixture.liveMinute || 0);
            if (typeof fixture.liveMinute === 'number') {
                const interval = setInterval(() => {
                    setDisplayMinute(prev => {
                        if (typeof prev === 'number' && prev < 90) return prev + 1;
                        return prev;
                    });
                }, 60000); 
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

    const getLinkProps = (teamObj: Team | undefined, teamName: string) => {
        if (teamObj?.id) return { type: 'profile', url: `/competitions/${competitionId}/teams/${teamObj.id}` };
        const entity = findInMap(teamName || '', directoryMap);
        if (entity?.teamId && entity.competitionId) return { type: 'profile', url: `/competitions/${entity.competitionId}/teams/${entity.teamId}` };
        if (entity) return { type: 'directory', url: `/directory?q=${encodeURIComponent(entity.name)}` };
        return { type: 'none', url: '' };
    };

    const teamALink = getLinkProps(teamA, fixture.teamA);
    const teamBLink = getLinkProps(teamB, fixture.teamB);

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        let title = `⚽ Match: ${fixture.teamA} vs ${fixture.teamB}`;
        let text = `Check out this match on Football Eswatini!\n\n${fixture.teamA} vs ${fixture.teamB}`;
        if (fixture.status === 'live' || fixture.status === 'finished') text += `\nScore: ${fixture.scoreA} - ${fixture.scoreB}`;
        const shareData = { title, text, url: window.location.href };
        if (navigator.share) {
          try { await navigator.share(shareData); } catch (err) {}
        } else {
          try {
            await navigator.clipboard.writeText(`${text}\n\nView here: ${window.location.href}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch (err) {}
        }
    };
    
    const getStatusBadge = () => {
        switch (fixture.status) {
            case 'live': 
                return (
                    <div className="absolute top-1 right-2 flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                        </span>
                        <span className="bg-red-600 text-white font-black text-[8px] px-1.5 py-0.5 rounded shadow-sm tracking-tighter">LIVE</span>
                    </div>
                );
            case 'finished': 
                return <div className="absolute top-1 right-2 text-gray-400 font-bold text-[9px] uppercase tracking-widest bg-gray-100 px-1.5 py-0.5 rounded">FT</div>;
            default: return null;
        }
    };

    const isScoreVisible = fixture.status === 'live' || fixture.status === 'finished' || (fixture.status === 'abandoned' && fixture.scoreA !== undefined);

    const renderTeamName = (name: string, linkProps: { type: string, url: string }) => {
        if (linkProps.type === 'profile' || linkProps.type === 'directory') {
            return <Link to={linkProps.url} onClick={(e) => e.stopPropagation()} className="font-semibold text-gray-800 hover:underline hover:text-primary transition-colors text-sm sm:text-base truncate block w-full">{name}</Link>;
        }
        return <p className="font-semibold text-gray-800 truncate text-sm sm:text-base block w-full">{name}</p>;
    };

    return (
        <div className={`flex flex-col border-l-4 transition-all duration-300 ${fixture.status === 'live' ? 'border-red-600 bg-red-50/40 ring-1 ring-red-100/50' : 'border-transparent hover:bg-gray-50/50'}`}>
            <div className="flex items-center space-x-2 p-3 min-h-[70px] cursor-pointer relative" onClick={onToggleDetails}>
                {getStatusBadge()}
                <div className={`flex flex-col items-center justify-center ${fixture.status === 'live' ? 'bg-red-600 text-white shadow-md' : 'bg-primary text-white'} w-12 h-12 rounded-md flex-shrink-0 transition-colors duration-300 border-b-2 ${fixture.status === 'live' ? 'border-red-800' : 'border-accent'}`}>
                    <span className="font-bold text-base leading-tight">{fixture.date}</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider">{fixture.day}</span>
                </div>
                <div className="flex-grow grid grid-cols-[1fr_auto_1fr] items-center text-center gap-2">
                    <div className="flex justify-end items-center gap-2 pr-1 overflow-hidden w-full text-right">
                         {renderTeamName(fixture.teamA, teamALink)}
                         {crestA && <img src={crestA} alt="" loading="lazy" className="w-6 h-6 object-contain flex-shrink-0 bg-white rounded-sm shadow-sm border border-gray-100" />}
                    </div>
                    {isScoreVisible ? (
                        <div className="text-center min-w-[5.5rem] flex flex-col items-center justify-center">
                            <p className={`font-black text-2xl tracking-tighter leading-none ${fixture.status === 'live' ? 'text-red-600 drop-shadow-sm' : 'text-gray-900'}`}>{fixture.scoreA ?? '-'} - {fixture.scoreB ?? '-'}</p>
                            {fixture.status === 'live' && (
                                <div className="flex items-center gap-1 mt-1">
                                    <ClockIcon className="w-2.5 h-2.5 text-red-600" />
                                    <p className="text-[10px] font-mono font-black text-red-600 animate-pulse">{displayMinute}'</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center min-w-[5.5rem]">
                            <p className="text-sm text-red-500 font-black italic tracking-widest">VS</p>
                            <p className="text-xs text-gray-400 mt-0.5 font-bold uppercase">{fixture.time}</p>
                        </div>
                    )}
                    <div className="flex justify-start items-center gap-2 pl-1 overflow-hidden w-full text-left">
                        {crestB && <img src={crestB} alt="" loading="lazy" className="w-6 h-6 object-contain flex-shrink-0 bg-white rounded-sm shadow-sm border border-gray-100" />}
                        {renderTeamName(fixture.teamB, teamBLink)}
                    </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={handleShare} className={`p-2 transition-colors rounded-full ${fixture.status === 'live' ? 'text-red-400 hover:bg-red-100 hover:text-red-600' : 'text-gray-400 hover:text-primary hover:bg-gray-100'}`} title="Share Match"><ShareIcon className="w-4 h-4" /></button>
                    <div className={`p-1 text-gray-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}><ChevronDownIcon className="w-5 h-5" /></div>
                </div>
            </div>
            {isExpanded && <div className="w-full border-t border-gray-100 bg-white/50"><FixtureDetail fixture={fixture} competitionId={competitionId} /></div>}
        </div>
    );
});

const Fixtures: React.FC<FixturesProps> = ({ showSelector = true, defaultCompetition = 'mtn-premier-league', maxHeight }) => {
    const [selectedComp, setSelectedComp] = useState(defaultCompetition);
    const [activeTab, setActiveTab] = useState<'fixtures' | 'results'>('fixtures');
    const [competition, setCompetition] = useState<Competition | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedFixtureId, setExpandedFixtureId] = useState<number | string | null>(null);
    const [directoryMap, setDirectoryMap] = useState<Map<string, DirectoryEntity>>(new Map());
    const [compOptions, setCompOptions] = useState<{ label: string, options: { value: string; name: string; }[] }[]>([]);

    useEffect(() => {
        if (defaultCompetition) setSelectedComp(defaultCompetition);
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
                    const allCompetitions = Object.entries(allCompetitionsData).map(([id, comp]) => ({ id, ...(comp as Competition) })).filter(comp => comp.name);
                    const categoryGroups = new Map<string, { name: string; order: number; competitions: { value: string; name: string }[] }>();
                    categoriesData.forEach(cat => categoryGroups.set(cat.id, { name: cat.name, order: cat.order, competitions: [] }));
                    const uncategorizedCompetitions: { value: string; name: string }[] = [];
                    allCompetitions.forEach(comp => {
                        const item = { value: comp.id, name: comp.displayName || comp.name };
                        const catId = comp.categoryId;
                        if (catId && categoryGroups.has(catId)) categoryGroups.get(catId)!.competitions.push(item);
                        else uncategorizedCompetitions.push(item);
                    });
                    const finalOptions = Array.from(categoryGroups.values()).filter(group => group.competitions.length > 0).sort((a, b) => a.order - b.order).map(group => ({ label: group.name, options: group.competitions.sort((a, b) => (a.name || '').localeCompare(b.name || '')) }));
                    if (uncategorizedCompetitions.length > 0) finalOptions.push({ label: "Other Leagues", options: uncategorizedCompetitions.sort((a, b) => (a.name || '').localeCompare(b.name || '')) });
                    setCompOptions(finalOptions);
                }
             } catch (error) {}
        };
        loadMetadata();
    }, [showSelector]);

    useEffect(() => {
        if (!selectedComp) return;
        setLoading(true);
        const unsubscribe = listenToCompetition(selectedComp, async (data) => {
            setCompetition(data || null);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [selectedComp, activeTab]);

    const groupedData = useMemo(() => {
        if (!competition) return [];
        const isResults = activeTab === 'results';
        let sourceData = isResults ? (competition.results || []) : (competition.fixtures || []);
        const now = new Date();
        sourceData = sourceData.filter(f => {
            if (isResults) return true;
            if (f.status === 'live') return true;
            if (f.fullDate) {
                const matchTime = new Date(`${f.fullDate}T${f.time || '00:00'}`);
                return matchTime > now;
            }
            return true;
        });
        const groups: Record<string, CompetitionFixture[]> = {};
        sourceData.forEach(fixture => {
            const key = fixture.matchday ? `Matchday ${fixture.matchday}` : 'Other';
            if (!groups[key]) groups[key] = [];
            groups[key].push(fixture);
        });
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            const numA = parseInt(a.replace('Matchday ', ''), 10) || 999;
            const numB = parseInt(b.replace('Matchday ', ''), 10) || 999;
            return isResults ? numB - numA : numA - numB;
        });
        return sortedKeys.map(key => {
            const fixturesInGroup = [...groups[key]];
            fixturesInGroup.sort((a, b) => {
                const dateTimeA = new Date(`${a.fullDate || '1970-01-01'}T${a.time || '00:00'}`).getTime();
                const dateTimeB = new Date(`${b.fullDate || '1970-01-01'}T${b.time || '00:00'}`).getTime();
                return isResults ? dateTimeB - dateTimeA : dateTimeA - dateTimeB;
            });
            return { title: key, fixtures: fixturesInGroup };
        });
    }, [competition, activeTab]);

    return (
        <section>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    {competition?.logoUrl && <img src={competition.logoUrl} alt="" className="h-10 object-contain" />}
                    <h2 className="text-3xl font-display font-bold">{competition?.displayName || competition?.name || 'Fixtures & Results'}</h2>
                </div>
                {showSelector && <div className="min-w-[280px]"><CollapsibleSelector value={selectedComp} onChange={setSelectedComp} options={compOptions} /></div>}
            </div>
            <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg w-fit mb-6 shadow-inner">
                <button onClick={() => setActiveTab('fixtures')} className={`px-6 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'fixtures' ? 'bg-primary text-white shadow' : 'text-gray-600 hover:text-primary'}`}>Upcoming</button>
                <button onClick={() => setActiveTab('results')} className={`px-6 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'results' ? 'bg-secondary text-white shadow' : 'text-gray-600 hover:text-secondary'}`}>Results</button>
            </div>
            {loading ? <div className="flex justify-center py-12"><Spinner /></div> : groupedData.length > 0 ? (
                <div className={`${maxHeight || ''} ${maxHeight ? 'overflow-y-auto custom-scrollbar pr-2' : ''}`}>
                    {groupedData.map((group) => (
                        <div key={group.title} className="mb-8">
                            <h3 className="text-sm font-black uppercase text-gray-400 mb-3 tracking-widest pl-2 border-l-4 border-accent">{group.title}</h3>
                            <Card className="divide-y overflow-hidden shadow-md">
                                {group.fixtures.map(f => (
                                    <FixtureItem key={f.id} fixture={f} isExpanded={expandedFixtureId === f.id} onToggleDetails={() => setExpandedFixtureId(expandedFixtureId === f.id ? null : f.id)} teams={competition?.teams || []} onDeleteFixture={() => {}} isDeleting={false} directoryMap={directoryMap} competitionId={selectedComp} />
                                ))}
                            </Card>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200"><p className="text-gray-500 italic">No matches found for this period.</p></div>
            )}
        </section>
    );
};
export default Fixtures;
