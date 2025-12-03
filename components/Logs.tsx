
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card } from './ui/Card';
import { Team, Competition } from '../data/teams';
import { DirectoryEntity } from '../data/directory';
import { fetchAllCompetitions, listenToCompetition, fetchCategories, fetchDirectoryEntries } from '../services/api';
import Spinner from './ui/Spinner';
import ArrowUpIcon from './icons/ArrowUpIcon';
import ArrowDownIcon from './icons/ArrowDownIcon';
import MinusIcon from './icons/MinusIcon';
import ShareIcon from './icons/ShareIcon';
import FormGuide from './ui/FormGuide';
import { calculateStandings, findInMap } from '../services/utils';

interface LogsProps {
    showSelector?: boolean;
    defaultLeague?: string;
    maxHeight?: string;
}

export const PositionIndicator: React.FC<{ change?: 'up' | 'down' | 'same' }> = ({ change }) => {
    if (!change || change === 'same') {
        return <MinusIcon className="w-3 h-3 text-gray-400" />;
    }
    if (change === 'up') {
        return <ArrowUpIcon className="w-3 h-3 text-green-500" />;
    }
    return <ArrowDownIcon className="w-3 h-3 text-red-500" />;
};

const Logs: React.FC<LogsProps> = ({ showSelector = true, defaultLeague = 'mtn-premier-league', maxHeight }) => {
  const [selectedLeague, setSelectedLeague] = useState(defaultLeague);
  const [leagueOptions, setLeagueOptions] = useState<{ label: string, options: { value: string; name: string; }[] }[]>([]);
  const [leagueData, setLeagueData] = useState<Team[]>([]);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [positionChanges, setPositionChanges] = useState<Record<number, 'up' | 'down' | 'same'>>({});
  const prevPositionsRef = useRef<Map<number, number>>(new Map());
  const [directoryMap, setDirectoryMap] = useState<Map<string, DirectoryEntity>>(new Map());
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (defaultLeague) {
        setSelectedLeague(defaultLeague);
    }
  }, [defaultLeague]);

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

                let finalOptions: { label: string, options: { value: string; name: string; }[] }[] = [];

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
                            label: "Other Leagues",
                            options: uncategorizedCompetitions.sort((a, b) => a.name.localeCompare(b.name))
                        });
                    }
                }

                if (finalOptions.length === 0 && allCompetitions.length > 0) {
                    const flatLeagueOptions = allCompetitions
                        .sort((a,b) => a.name.localeCompare(b.name))
                        .map(comp => ({ value: comp.id, name: comp.name }));
                        
                    if (flatLeagueOptions.length > 0) {
                        finalOptions = [{ label: "All Leagues", options: flatLeagueOptions }];
                    }
                }

                setLeagueOptions(finalOptions);
                
                if (finalOptions.length > 0) {
                    const allLeagueOptions = finalOptions.flatMap(g => g.options);
                    if (allLeagueOptions.length > 0 && showSelector && !allLeagueOptions.some(opt => opt.value === selectedLeague)) {
                        setSelectedLeague(allLeagueOptions[0].value);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to load initial data for Logs page:", error);
            setLeagueOptions([]);
        }
    };

    loadInitialData();
  }, [showSelector]); 

  useEffect(() => {
    setLoading(true);

    const unsubscribe = listenToCompetition(selectedLeague, (data) => {
        if (data) {
            setCompetition(data);
            const standings = calculateStandings(data.teams || [], data.results || [], data.fixtures || []);

            if (standings.length > 0) {
                const newPositions = new Map(standings.map((t, i) => [t.id, i]));
                const changes: Record<number, 'up' | 'down' | 'same'> = {};

                if (prevPositionsRef.current.size > 0) {
                    standings.forEach((team, index) => {
                        const prevPos = prevPositionsRef.current.get(team.id);
                        if (prevPos === undefined) {
                            changes[team.id] = 'same';
                        } else if (index < prevPos) {
                            changes[team.id] = 'up';
                        } else if (index > prevPos) {
                            changes[team.id] = 'down';
                        } else {
                            changes[team.id] = 'same';
                        }
                    });
                }
                setLeagueData(standings);
                setPositionChanges(changes);
                prevPositionsRef.current = newPositions;
            } else {
                 setLeagueData([]);
            }
        } else {
            setCompetition(null);
            setLeagueData([]);
        }
        setLoading(false);
    });
    
    return () => unsubscribe();

  }, [selectedLeague]);

  const handleShare = async () => {
        const shareData = {
            title: `${competition?.name || 'League'} Standings`,
            text: `Check out the latest ${competition?.name || 'league'} standings on Football Eswatini!`,
            url: window.location.href // Use full absolute URL
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
                await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy', err);
            }
        }
    };

  return (
    <section>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
            {showSelector && (
                 <div className="flex items-center gap-4">
                    {competition?.logoUrl && <img src={competition.logoUrl} alt={`${competition.name} logo`} className="h-10 object-contain" />}
                    <h2 className="text-3xl font-display font-bold text-center lg:text-left">League Standings</h2>
                </div>
            )}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                    onClick={handleShare}
                    className="p-2 bg-white border border-gray-300 rounded-md text-gray-600 hover:text-primary hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary-light"
                    title="Share Standings"
                    aria-label="Share Standings"
                >
                    <ShareIcon className="w-5 h-5" />
                </button>
                {copied && <span className="text-xs text-green-600 font-medium animate-fade-in">Link Copied!</span>}

                {showSelector && (
                     <div className="min-w-[200px] flex-grow sm:flex-grow-0">
                        <label htmlFor="league-select" className="sr-only">Select League</label>
                        <select
                            id="league-select"
                            value={selectedLeague}
                            onChange={(e) => setSelectedLeague(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-light focus:border-primary-light sm:text-sm rounded-md shadow-sm"
                        >
                            {leagueOptions.map(group => (
                                <optgroup key={group.label} label={group.label}>
                                    {group.options.map(league => (
                                        <option key={league.value} value={league.value}>{league.name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </div>

        <Card className="shadow-lg animate-content-fade-in" key={selectedLeague}>
            <div className={`overflow-x-auto ${maxHeight ? 'overflow-y-auto ' + maxHeight : ''}`}>
                 {loading ? (
                    <div className="flex justify-center items-center h-64"><Spinner /></div>
                 ) : leagueData.length > 0 ? (
                    <table className="w-full text-sm">
                        <thead className="text-left font-bold uppercase text-xs sticky top-0 z-10">
                            <tr className="bg-primary text-white shadow-md border-b-4 border-secondary">
                                <th className="px-3 py-3 w-8 text-center">#</th>
                                <th className="px-3 py-3">Team</th>
                                <th className="px-2 py-3 text-center w-8" title="Played">P</th>
                                <th className="px-2 py-3 text-center w-8" title="Won">W</th>
                                <th className="px-2 py-3 text-center w-8" title="Drawn">D</th>
                                <th className="px-2 py-3 text-center w-8" title="Lost">L</th>
                                <th className="px-2 py-3 text-center w-8 hidden sm:table-cell" title="Goals Scored">GS</th>
                                <th className="px-2 py-3 text-center w-8 hidden sm:table-cell" title="Goals Conceded">GC</th>
                                <th className="px-2 py-3 text-center w-10 font-bold" title="Goal Difference">GD</th>
                                <th className="px-2 py-3 text-center w-10 font-bold" title="Points">Pts</th>
                                <th className="px-3 py-3 w-24">Form</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {leagueData.map((team, index) => {
                                const linkProps = {
                                    isLinkable: !!team.id,
                                    competitionId: selectedLeague,
                                    teamId: team.id
                                };

                                const directoryEntry = findInMap(team.name, directoryMap);
                                const crestUrl = directoryEntry?.crestUrl || team.crestUrl;

                                const teamRowContent = (
                                    <div className="flex items-center space-x-2 group">
                                        {crestUrl && <img src={crestUrl} alt={`${team.name} crest`} loading="lazy" className="w-6 h-6 object-contain flex-shrink-0 bg-white rounded-sm shadow-sm" />}
                                        <span className={`font-semibold text-gray-800 ${linkProps.isLinkable ? 'group-hover:underline' : ''} truncate max-w-[120px] sm:max-w-[200px]`}>{team.name}</span>
                                    </div>
                                );

                                return (
                                <tr key={team.id || team.name} className="hover:bg-gray-50/50">
                                    <td className="px-3 py-2 font-bold text-gray-700 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <span>{index + 1}</span>
                                            <div className="hidden sm:block">
                                                <PositionIndicator change={positionChanges[team.id]} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        {linkProps.isLinkable ? (
                                            <Link to={`/competitions/${linkProps.competitionId}/teams/${linkProps.teamId}`} className="block w-full">
                                                {teamRowContent}
                                            </Link>
                                        ) : (
                                            teamRowContent
                                        )}
                                    </td>
                                    <td className="px-2 py-2 text-center">{team.stats.p}</td>
                                    <td className="px-2 py-2 text-center">{team.stats.w}</td>
                                    <td className="px-2 py-2 text-center">{team.stats.d}</td>
                                    <td className="px-2 py-2 text-center">{team.stats.l}</td>
                                    <td className="px-2 py-2 text-center hidden sm:table-cell">{team.stats.gs}</td>
                                    <td className="px-2 py-2 text-center hidden sm:table-cell">{team.stats.gc}</td>
                                    <td className="px-2 py-2 text-center font-bold">{team.stats.gd}</td>
                                    <td className="px-2 py-2 text-center font-bold bg-gray-50">{team.stats.pts}</td>
                                    <td className="px-3 py-2">
                                        <FormGuide form={team.stats.form} />
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                 ) : (
                    <p className="p-6 text-center text-gray-500 text-sm">No standings available yet.</p>
                 )}
            </div>
        </Card>
    </section>
  );
};

export default Logs;
