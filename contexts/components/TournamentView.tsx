
import React, { useState, useMemo, useEffect } from 'react';
import { HybridTournament, ConfigTeam } from '../data/international';
import { Team } from '../data/teams';
import { calculateGroupStandings, findInMap } from '../services/utils';
import { Card, CardContent } from './ui/Card';
import StandingsTable from './StandingsTable';
import TournamentBracketDisplay from './TournamentBracketDisplay';
import { FixtureItem } from './Fixtures';
import TrophyIcon from './icons/TrophyIcon';
import UsersIcon from './icons/UsersIcon';
import CalendarIcon from './icons/CalendarIcon';
import BracketIcon from './icons/BracketIcon';
import { fetchCups, fetchDirectoryEntries } from '../services/api';
import { Tournament } from '../data/cups';
import Spinner from './ui/Spinner';
import InfoIcon from './icons/InfoIcon';

interface TournamentViewProps {
    tournament: HybridTournament;
}

const UCLLegend: React.FC = () => (
    <div className="space-y-4 mb-8">
        <div className="bg-gray-900 text-white p-6 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl"></div>
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-accent mb-3 flex items-center gap-2">
                <InfoIcon className="w-4 h-4"/> New League Phase Format
            </h4>
            <p className="text-sm text-gray-300 leading-relaxed max-w-3xl">
                All 36 teams are ranked in <span className="text-white font-bold">ONE single league table</span>. Each club plays 8 matches (4 home, 4 away) against 8 different opponents. Tie-breakers prioritize Points, Goal Difference, Goals Scored, and Away Wins.
            </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center gap-3 shadow-sm">
                <div className="w-4 h-4 bg-green-500 rounded-full shadow-inner"></div>
                <div>
                    <p className="text-xs font-black text-green-900 uppercase">1 – 8</p>
                    <p className="text-[10px] text-green-700 font-medium leading-tight">Direct Round of 16</p>
                </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center gap-3 shadow-sm">
                <div className="w-4 h-4 bg-blue-600 rounded-full shadow-inner"></div>
                <div>
                    <p className="text-xs font-black text-blue-900 uppercase">9 – 16</p>
                    <p className="text-[10px] text-blue-700 font-medium leading-tight">Play-offs (Seeded)</p>
                </div>
            </div>
            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-center gap-3 shadow-sm">
                <div className="w-4 h-4 bg-blue-400 rounded-full shadow-inner"></div>
                <div>
                    <p className="text-xs font-black text-blue-800 uppercase">17 – 24</p>
                    <p className="text-[10px] text-blue-600 font-medium leading-tight">Play-offs (Unseeded)</p>
                </div>
            </div>
            <div className="bg-gray-100 border border-gray-300 p-4 rounded-xl flex items-center gap-3 shadow-sm">
                <div className="w-4 h-4 bg-gray-400 rounded-full shadow-inner"></div>
                <div>
                    <p className="text-xs font-black text-gray-700 uppercase">25 – 36</p>
                    <p className="text-[10px] text-gray-500 font-medium leading-tight">Eliminated</p>
                </div>
            </div>
        </div>
    </div>
);

const TournamentView: React.FC<TournamentViewProps> = ({ tournament }) => {
    const [activeTab, setActiveTab] = useState<'groups' | 'knockout' | 'fixtures'>('groups');
    const [linkedBracket, setLinkedBracket] = useState<Tournament | null>(null);
    const [loadingBracket, setLoadingBracket] = useState(false);
    const [directoryMap, setDirectoryMap] = useState<Map<string, any>>(new Map());

    const isUCL = tournament.id === 'uefa-champions-league';

    useEffect(() => {
        const loadBracketAndDir = async () => {
            setLoadingBracket(true);
            try {
                const [allCups, dirEntries] = await Promise.all([
                    fetchCups(),
                    fetchDirectoryEntries()
                ]);

                const dMap = new Map();
                dirEntries.forEach(e => dMap.set(e.name.trim().toLowerCase(), e));
                setDirectoryMap(dMap);

                if (tournament.bracketId) {
                    const foundCup = allCups.find(c => c.id === tournament.bracketId);
                    if (foundCup) {
                        const hydratedRounds = foundCup.rounds.map(round => ({
                            ...round,
                            matches: round.matches.map((m: any) => {
                                const team1Name = m.team1Name || m.team1?.name || 'TBD';
                                const team2Name = m.team2Name || m.team2?.name || 'TBD';
                                const findCrest = (name: string) => {
                                    const configMatch = tournament.teams?.find(ct => ct.name === name);
                                    if (configMatch?.crestUrl) return configMatch.crestUrl;
                                    return findInMap(name, dMap)?.crestUrl;
                                };
                                return {
                                    ...m,
                                    team1: { name: team1Name, score: m.score1 ?? m.team1?.score, crestUrl: findCrest(team1Name) },
                                    team2: { name: team2Name, score: m.score2 ?? m.team2?.score, crestUrl: findCrest(team2Name) }
                                };
                            })
                        }));
                        setLinkedBracket({ ...foundCup, rounds: hydratedRounds });
                    }
                } else if (tournament.bracket) {
                    setLinkedBracket(tournament.bracket);
                }
            } catch (e) {
                console.error("Failed to load tournament metadata", e);
            } finally {
                setLoadingBracket(false);
            }
        };
        loadBracketAndDir();
    }, [tournament.bracketId, tournament.bracket, tournament.teams]);

    const allTeamsObj: Team[] = useMemo(() => {
        return (tournament.teams || []).map((ct: ConfigTeam) => {
            const dirCrest = findInMap(ct.name, directoryMap)?.crestUrl;
            return {
                id: ct.dbId || Math.random(),
                name: ct.name,
                crestUrl: dirCrest || ct.crestUrl,
                stats: { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' },
                players: [], fixtures: [], results: [], staff: []
            };
        });
    }, [tournament.teams, directoryMap]);

    const teamMap = useMemo(() => {
        const map = new Map<string, Team>();
        allTeamsObj.forEach(t => map.set(t.name, t));
        return map;
    }, [allTeamsObj]);

    const groupStandings = useMemo(() => {
        if (!tournament.groups) return {};
        const standings: Record<string, Team[]> = {};
        tournament.groups.forEach(group => {
            const groupTeams = group.teamNames.map(name => teamMap.get(name)).filter((t): t is Team => !!t);
            standings[group.name] = calculateGroupStandings(groupTeams, tournament.matches || []);
        });
        return standings;
    }, [tournament.groups, tournament.matches, teamMap]);

    const upcomingFixtures = useMemo(() => {
        return (tournament.matches || [])
            .filter(m => m.status !== 'finished')
            .sort((a, b) => new Date(a.fullDate || '').getTime() - new Date(b.fullDate || '').getTime());
    }, [tournament.matches]);

    const results = useMemo(() => {
        return (tournament.matches || [])
            .filter(m => m.status === 'finished')
            .sort((a, b) => new Date(b.fullDate || '').getTime() - new Date(a.fullDate || '').getTime());
    }, [tournament.matches]);

    const TabButton: React.FC<{tab: typeof activeTab, label: string, Icon: any}> = ({tab, label, Icon}) => (
        <button onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-4 transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-5 h-5" /> {label}
        </button>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row items-center gap-6 mb-8 text-center md:text-left bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <img src={tournament.logoUrl || 'https://via.placeholder.com/150'} alt={tournament.name} className="w-24 h-24 object-contain" />
                <div>
                    <h1 className="text-3xl font-display font-extrabold text-gray-900">{tournament.name}</h1>
                    <p className="text-gray-600 mt-2 max-w-2xl">{tournament.description}</p>
                </div>
            </div>
            {isUCL && activeTab === 'groups' && <UCLLegend />}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                <div className="flex">
                    {tournament.groups && tournament.groups.length > 0 && <TabButton tab="groups" label={isUCL ? "League Table" : "Group Stage"} Icon={UsersIcon} />}
                    {linkedBracket && <TabButton tab="knockout" label="Knockout Phase" Icon={BracketIcon} />}
                    <TabButton tab="fixtures" label="Matches" Icon={CalendarIcon} />
                </div>
            </div>
            <div className="min-h-[400px]">
                {activeTab === 'groups' && tournament.groups && (
                    <div className="grid grid-cols-1 gap-8">
                        {tournament.groups.map(group => (
                            <div key={group.name} className="animate-fade-in">
                                <div className="flex items-center gap-3 mb-4 bg-primary text-white p-3 rounded-t-lg shadow-md">
                                    <TrophyIcon className="w-6 h-6 text-yellow-400" />
                                    <h3 className="text-xl font-bold font-display">{group.name}</h3>
                                </div>
                                <StandingsTable standings={groupStandings[group.name] || []} competitionId={tournament.id} />
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'knockout' && (
                    <div className="animate-slide-up">
                         <h3 className="text-xl font-bold font-display mb-4 text-gray-800">Tournament Tree</h3>
                         {loadingBracket ? <Spinner /> : linkedBracket ? <TournamentBracketDisplay tournament={linkedBracket} /> : <p className="text-gray-500 italic">Knockout stage bracket not available.</p>}
                    </div>
                )}
                {activeTab === 'fixtures' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                        <div>
                            <h3 className="text-xl font-bold font-display mb-4 text-gray-800 border-b pb-2">Upcoming Fixtures</h3>
                            <div className="space-y-4">
                                {upcomingFixtures.length > 0 ? upcomingFixtures.map(f => (
                                    <Card key={f.id}><FixtureItem fixture={f} isExpanded={false} onToggleDetails={() => {}} teams={allTeamsObj} onDeleteFixture={() => {}} isDeleting={false} directoryMap={directoryMap} competitionId={tournament.id} /></Card>
                                )) : <p className="text-gray-500 italic">No upcoming matches scheduled.</p>}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold font-display mb-4 text-gray-800 border-b pb-2">Recent Results</h3>
                             <div className="space-y-4">
                                {results.length > 0 ? results.map(f => (
                                    <Card key={f.id} className="border-l-4 border-gray-400"><FixtureItem fixture={f} isExpanded={false} onToggleDetails={() => {}} teams={allTeamsObj} onDeleteFixture={() => {}} isDeleting={false} directoryMap={directoryMap} competitionId={tournament.id} /></Card>
                                )) : <p className="text-gray-500 italic">No results yet.</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TournamentView;
