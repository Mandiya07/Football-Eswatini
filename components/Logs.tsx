
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
import CollapsibleSelector from './ui/CollapsibleSelector';

interface LogsProps {
    showSelector?: boolean;
    defaultLeague?: string;
    maxHeight?: string;
}

export const PositionIndicator: React.FC<{ change?: 'up' | 'down' | 'same' }> = ({ change }) => {
    if (!change || change === 'same') return <MinusIcon className="w-2.5 h-2.5 text-gray-300" />;
    if (change === 'up') return <ArrowUpIcon className="w-3 h-3 text-green-500" />;
    return <ArrowDownIcon className="w-3 h-3 text-red-500" />;
};

const Logs: React.FC<LogsProps> = ({ showSelector = true, defaultLeague = 'mtn-premier-league', maxHeight }) => {
  const [selectedLeague, setSelectedLeague] = useState(defaultLeague);
  const [leagueOptions, setLeagueOptions] = useState<{ label: string, options: { value: string; name: string; }[] }[]>([]);
  const [leagueData, setLeagueData] = useState<Team[]>([]);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [directoryMap, setDirectoryMap] = useState<Map<string, DirectoryEntity>>(new Map());

  // Sync selectedLeague with prop if it changes
  useEffect(() => {
      if (defaultLeague) setSelectedLeague(defaultLeague);
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
                setLeagueOptions(finalOptions);
            }
        } catch (error) {}
    };
    loadInitialData();
  }, [showSelector]); 

  useEffect(() => {
    if (!selectedLeague) return;
    setLoading(true);
    const unsubscribe = listenToCompetition(selectedLeague, (data) => {
        if (data) {
            setCompetition(data);
            const standings = calculateStandings(data.teams || [], data.results || [], data.fixtures || []);
            setLeagueData(standings);
        } else {
            setLeagueData([]);
            setCompetition(null);
        }
        setLoading(false);
    });
    return () => unsubscribe();
  }, [selectedLeague]);

  const handleShareStandings = async () => {
      let text = `🏆 Standings: ${competition?.name || 'League'}\n\n`;
      leagueData.slice(0, 5).forEach((team, i) => {
          text += `${i + 1}. ${team.name} - ${team.stats.pts}pts\n`;
      });
      text += `\nSee full table here: ${window.location.href}`;

      if (navigator.share) {
          try {
              await navigator.share({ title: `${competition?.name} Standings`, text });
          } catch (e) {}
      } else {
          await navigator.clipboard.writeText(text);
          alert("Standings copied to clipboard!");
      }
  };

  const getTrend = (form: string) => {
      const last = form.split(' ')[0];
      if (last === 'W') return 'up';
      if (last === 'L') return 'down';
      return 'same';
  };

  return (
    <section>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
                {competition?.logoUrl && <img src={competition.logoUrl} alt="" className="h-10 object-contain" />}
                <h2 className="text-3xl font-display font-bold">{competition?.name || 'Standings'}</h2>
                {!loading && leagueData.length > 0 && (
                    <button onClick={handleShareStandings} className="p-2 text-gray-400 hover:text-primary transition-colors">
                        <ShareIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
            {showSelector && (
                <div className="min-w-[280px]">
                    <CollapsibleSelector 
                        value={selectedLeague} 
                        onChange={setSelectedLeague} 
                        options={leagueOptions} 
                    />
                </div>
            )}
        </div>

        <Card className="shadow-lg overflow-hidden border border-gray-100">
            <div className={`overflow-x-auto overflow-y-auto custom-scrollbar ${maxHeight || ''}`}>
                 {loading ? (
                    <div className="flex justify-center items-center py-20"><Spinner /></div>
                 ) : leagueData.length > 0 ? (
                    <table className="w-full text-sm">
                        <thead className="bg-primary text-white text-[10px] sm:text-xs uppercase font-bold sticky top-0 z-10">
                            <tr>
                                <th className="px-2 sm:px-3 py-4 w-12 text-center">#</th>
                                <th className="px-2 sm:px-3 py-4 text-left">Team</th>
                                <th className="px-1 sm:px-2 py-4 text-center" title="Played">P</th>
                                <th className="px-1 sm:px-2 py-4 text-center" title="Wins">W</th>
                                <th className="px-1 sm:px-2 py-4 text-center" title="Draws">D</th>
                                <th className="px-1 sm:px-2 py-4 text-center" title="Losses">L</th>
                                <th className="px-1 sm:px-2 py-4 text-center font-black bg-primary-dark shadow-inner">Pts</th>
                                <th className="px-2 sm:px-3 py-4 w-20 sm:w-24">Form</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {leagueData.map((team, index) => {
                                const dirEntry = findInMap(team.name, directoryMap);
                                const profileUrl = team.id ? `/competitions/${selectedLeague}/teams/${team.id}` : 
                                                  (dirEntry?.teamId && dirEntry?.competitionId) ? `/competitions/${dirEntry.competitionId}/teams/${dirEntry.teamId}` : null;

                                return (
                                    <tr key={team.id || team.name} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-2 sm:px-3 py-3 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="font-black text-gray-900 leading-none">{index + 1}</span>
                                                <PositionIndicator change={getTrend(team.stats.form)} />
                                            </div>
                                        </td>
                                        <td className="px-2 sm:px-3 py-3">
                                            {profileUrl ? (
                                                <Link to={profileUrl} className="flex items-center gap-2 sm:gap-3 group/link">
                                                    <img src={dirEntry?.crestUrl || team.crestUrl} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" alt="" />
                                                    <span className="font-bold text-gray-900 truncate max-w-[120px] sm:max-w-none group-hover/link:text-primary group-hover/link:underline transition-colors">{team.name}</span>
                                                </Link>
                                            ) : (
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <img src={dirEntry?.crestUrl || team.crestUrl} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" alt="" />
                                                    <span className="font-bold text-gray-900 truncate max-w-[120px] sm:max-w-none">{team.name}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-1 sm:px-2 py-3 text-center text-gray-600 font-medium">{team.stats.p}</td>
                                        <td className="px-1 sm:px-2 py-3 text-center text-gray-600">{team.stats.w}</td>
                                        <td className="px-1 sm:px-2 py-3 text-center text-gray-600">{team.stats.d}</td>
                                        <td className="px-1 sm:px-2 py-3 text-center text-gray-600">{team.stats.l}</td>
                                        <td className="px-1 sm:px-2 py-3 text-center font-black bg-primary/5 border-x border-primary/5 relative">
                                            <span className="relative z-10 text-primary">{team.stats.pts}</span>
                                        </td>
                                        <td className="px-2 sm:px-3 py-3"><FormGuide form={team.stats.form} /></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                 ) : (
                    <div className="text-center py-20 text-gray-500 italic">
                        No standings available for this league yet.
                    </div>
                 )}
            </div>
        </Card>
    </section>
  );
};

export default Logs;
