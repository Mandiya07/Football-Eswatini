
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from './ui/Card';
// Fix: Added CompetitionFixture to imports to resolve "Cannot find name 'CompetitionFixture'" error on line 112
import { Team, Competition, CompetitionFixture } from '../data/teams';
import { DirectoryEntity } from '../data/directory';
import { fetchAllCompetitions, listenToCompetition, fetchCategories, fetchDirectoryEntries, fetchStandaloneMatches } from '../services/api';
import Spinner from './ui/Spinner';
import ArrowUpIcon from './icons/ArrowUpIcon';
import ArrowDownIcon from './icons/ArrowDownIcon';
import MinusIcon from './icons/MinusIcon';
import ShareIcon from './icons/ShareIcon';
import FormGuide from './ui/FormGuide';
import { calculateStandings, findInMap, superNormalize } from '../services/utils';
import CollapsibleSelector from './ui/CollapsibleSelector';
import StandingsTable from './StandingsTable';
import { useDataCache } from '../contexts/DataCacheContext';

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
  const { competitions: allComps } = useDataCache();
  const [selectedLeague, setSelectedLeague] = useState(defaultLeague);
  const [leagueOptions, setLeagueOptions] = useState<{ label: string, options: { value: string; name: string; type?: 'league' | 'cup' }[] }[]>([]);
  const [compTypeFilter, setCompTypeFilter] = useState<'all' | 'league' | 'cup'>('all');
  const [leagueData, setLeagueData] = useState<Team[]>([]);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [directoryMap, setDirectoryMap] = useState<Map<string, DirectoryEntity>>(new Map());

  const filteredLeagueOptions = useMemo(() => {
    if (compTypeFilter === 'all') return leagueOptions;
    return leagueOptions
        .map(group => ({
            ...group,
            options: group.options.filter(opt => {
                const comp = allComps[opt.value];
                return comp?.competitionType === compTypeFilter;
            })
        }))
        .filter(group => group.options.length > 0);
  }, [leagueOptions, compTypeFilter, allComps]);

  useEffect(() => {
      if (defaultLeague) setSelectedLeague(defaultLeague);
  }, [defaultLeague]);

  useEffect(() => {
    const loadInitialData = async () => {
        try {
            const [entries, categoriesData] = await Promise.all([
                fetchDirectoryEntries(),
                fetchCategories()
            ]);

            const map = new Map<string, DirectoryEntity>();
            entries.forEach(entry => map.set(entry.name.trim().toLowerCase(), entry));
            setDirectoryMap(map);

            if (showSelector) {
                const categoryGroups = new Map<string, { name: string; order: number; competitions: { value: string; name: string }[] }>();
                categoriesData.forEach(cat => categoryGroups.set(cat.id, { name: cat.name, order: cat.order, competitions: [] }));
                
                const allCompetitions = Object.entries(allComps)
                    .map(([id, comp]) => ({ id, ...(comp as Competition) }))
                    .filter(comp => comp.name);

                allCompetitions.forEach(comp => {
                    const item = { value: comp.id, name: comp.displayName || comp.name, type: comp.competitionType };
                    const catId = comp.categoryId;
                    if (catId) {
                        if (categoryGroups.has(catId)) {
                            categoryGroups.get(catId)!.competitions.push(item);
                        } else {
                            // Fallback for categories not in the DB (like u19-national-football)
                            const fallbackName = catId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                            categoryGroups.set(catId, { name: fallbackName, order: 999, competitions: [item] });
                        }
                    }
                });

                const finalOptions = Array.from(categoryGroups.values())
                    .filter(group => group.competitions.length > 0)
                    .sort((a, b) => a.order - b.order)
                    .map(group => ({
                        label: group.name,
                        options: group.competitions.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                    }));
                
                // Add the pseudo "Independent Clubs" hub at the end
                finalOptions.push({
                    label: "Community & Independent",
                    options: [{ value: 'independent-clubs', name: 'Independent Clubs (Friendlies)' }]
                });

                setLeagueOptions(finalOptions);
            }
        } catch (error) {}
    };
    loadInitialData();
  }, [showSelector]); 

  useEffect(() => {
    if (!selectedLeague) return;
    setLoading(true);

    if (selectedLeague === 'independent-clubs') {
        const loadIndependent = async () => {
            const [dir, standalone] = await Promise.all([
                fetchDirectoryEntries(),
                fetchStandaloneMatches()
            ]);
            // Only teams marked as 'Club' in directory
            const clubs = dir.filter(e => e.category === 'Club');
            const teams: Team[] = clubs.map(c => ({
                id: c.teamId || String(Math.random()),
                name: c.name,
                crestUrl: c.crestUrl || '',
                stats: { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' },
                players: [], fixtures: [], results: [], staff: [],
                shortName: c.name.substring(0, 3).toUpperCase(),
                logo: c.crestUrl || '',
                primaryColor: '#000000',
                secondaryColor: '#FFFFFF',
                founded: 1900,
                stadium: 'TBD',
                city: 'TBD',
                coach: 'TBD'
            }));
            
            // Map results to CompetitionFixture format
            const results: CompetitionFixture[] = standalone.filter(m => m.status === 'finished').map(m => ({
                ...m, status: 'finished'
            }));

            const standings = calculateStandings(teams, results);
            setLeagueData(standings);
            setCompetition({ id: 'independent-clubs', name: 'Independent Clubs Hub', type: 'league', season: '2023/24', fixtures: [], results: [], teams });
            setLoading(false);
        };
        loadIndependent();
        return;
    }

    if (selectedLeague !== 'independent-clubs') {
        const comp = allComps[selectedLeague];
        if (comp) {
            setCompetition(comp);
            const standings = calculateStandings(comp.teams || [], comp.results || [], comp.fixtures || []);
            setLeagueData(standings);
        } else {
            setLeagueData([]);
            setCompetition(null);
        }
        setLoading(false);
    }
  }, [selectedLeague, allComps]);

  const handleShareStandings = async () => {
      let text = `🏆 Standings: ${competition?.displayName || competition?.name || 'League'}\n\n`;
      leagueData.slice(0, 5).forEach((team, i) => {
          text += `${i + 1}. ${team.name} - ${team.stats.pts}pts\n`;
      });
      text += `\nSee full table here: ${window.location.href}`;

      if (navigator.share) {
          try { await navigator.share({ title: `${competition?.displayName || competition?.name} Standings`, text }); } catch (e) {}
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
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    {competition?.logoUrl ? <img src={competition.logoUrl} alt="" className="h-10 object-contain" /> : null}
                    <h2 className="text-3xl font-display font-bold">{competition?.displayName || competition?.name || 'Standings'}</h2>
                    {!loading && leagueData.length > 0 && (
                        <button onClick={handleShareStandings} className="p-2 text-gray-400 hover:text-primary transition-colors">
                            <ShareIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
                {showSelector && (
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={compTypeFilter}
                            onChange={(e) => setCompTypeFilter(e.target.value as 'all' | 'league' | 'cup')}
                            className="text-xs font-bold bg-white border border-gray-300 rounded-lg px-2 py-2"
                        >
                            <option key="all" value="all">All</option>
                            <option key="league" value="league">Leagues</option>
                            <option key="cup" value="cup">Cups</option>
                        </select>
                        <div className="min-w-[200px]">
                            <CollapsibleSelector 
                                value={selectedLeague} 
                                onChange={setSelectedLeague} 
                                options={filteredLeagueOptions} 
                            />
                        </div>
                    </div>
                )}
            </div>

        {selectedLeague === 'independent-clubs' && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-xs text-blue-800">
                <strong>Performance Tracker:</strong> This table ranks independent clubs based on verified friendly match results and standalone cup outcomes.
            </div>
        )}

        <div className={`overflow-y-auto overflow-x-hidden custom-scrollbar ${maxHeight || ''}`}>
             {loading ? (
                <div className="flex justify-center items-center py-20"><Spinner /></div>
             ) : leagueData.length > 0 ? (
                <StandingsTable standings={leagueData} competitionId={selectedLeague} />
             ) : (
                <div className="text-center py-20 text-gray-500 italic">
                    No standings available for this league yet.
                </div>
             )}
        </div>
    </section>
  );
};

export default Logs;
