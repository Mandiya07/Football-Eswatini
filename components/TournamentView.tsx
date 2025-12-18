
import React, { useState, useMemo, useEffect } from 'react';
import { HybridTournament, ConfigTeam } from '../data/international';
import { Team } from '../data/teams';
import { calculateGroupStandings } from '../services/utils';
import { Card, CardContent } from './ui/Card';
import StandingsTable from './StandingsTable';
import TournamentBracketDisplay from './TournamentBracketDisplay';
import { FixtureItem } from './Fixtures';
import TrophyIcon from './icons/TrophyIcon';
import UsersIcon from './icons/UsersIcon';
import CalendarIcon from './icons/CalendarIcon';
import BracketIcon from './icons/BracketIcon';
import { fetchCups } from '../services/api';
import { Tournament } from '../data/cups';
import Spinner from './ui/Spinner';

interface TournamentViewProps {
    tournament: HybridTournament;
}

const TournamentView: React.FC<TournamentViewProps> = ({ tournament }) => {
    const [activeTab, setActiveTab] = useState<'groups' | 'knockout' | 'fixtures'>('groups');
    const [linkedBracket, setLinkedBracket] = useState<Tournament | null>(null);
    const [loadingBracket, setLoadingBracket] = useState(false);

    // Fetch linked bracket if ID provided
    useEffect(() => {
        const loadBracket = async () => {
            if (tournament.bracketId) {
                setLoadingBracket(true);
                try {
                    const allCups = await fetchCups();
                    const match = allCups.find(c => c.id === tournament.bracketId);
                    setLinkedBracket(match || null);
                } catch (e) {
                    console.error("Failed to load linked bracket", e);
                } finally {
                    setLoadingBracket(false);
                }
            } else {
                setLinkedBracket(tournament.bracket || null);
            }
        };
        loadBracket();
    }, [tournament.bracketId, tournament.bracket]);

    // 1. Transform ConfigTeams into full Team objects for the StandingsTable component
    const allTeamsObj: Team[] = useMemo(() => {
        return (tournament.teams || []).map((ct: ConfigTeam) => ({
            id: ct.dbId || Math.random(),
            name: ct.name,
            crestUrl: ct.crestUrl,
            stats: { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' },
            players: [], fixtures: [], results: [], staff: []
        }));
    }, [tournament.teams]);

    const teamMap = useMemo(() => {
        const map = new Map<string, Team>();
        allTeamsObj.forEach(t => map.set(t.name, t));
        return map;
    }, [allTeamsObj]);

    // 2. Calculate Standings for Each Group
    const groupStandings = useMemo(() => {
        if (!tournament.groups) return {};
        const standings: Record<string, Team[]> = {};
        tournament.groups.forEach(group => {
            const groupTeams = group.teamNames
                .map(name => teamMap.get(name))
                .filter((t): t is Team => !!t);
            const calculated = calculateGroupStandings(groupTeams, tournament.matches || []);
            standings[group.name] = calculated;
        });
        return standings;
    }, [tournament.groups, tournament.matches, teamMap]);

    // 3. Filter Fixtures
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
        <button 
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-4 transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
            <Icon className="w-5 h-5" /> {label}
        </button>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center gap-6 mb-8 text-center md:text-left bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <img 
                    src={tournament.logoUrl || 'https://via.placeholder.com/150'} 
                    alt={tournament.name} 
                    className="w-24 h-24 object-contain"
                />
                <div>
                    <h1 className="text-3xl font-display font-extrabold text-gray-900">{tournament.name}</h1>
                    <p className="text-gray-600 mt-2 max-w-2xl">{tournament.description}</p>
                </div>
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                <div className="flex">
                    {tournament.groups && tournament.groups.length > 0 && <TabButton tab="groups" label="Group Stage" Icon={UsersIcon} />}
                    {linkedBracket && <TabButton tab="knockout" label="Knockout Phase" Icon={BracketIcon} />}
                    <TabButton tab="fixtures" label="Matches" Icon={CalendarIcon} />
                </div>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === 'groups' && tournament.groups && (
                    <div className="grid grid-cols-1 gap-8">
                        {tournament.groups.map(group => (
                            <div key={group.name} className="animate-fade-in">
                                <div className="flex items-center gap-3 mb-4 bg-primary text-white p-3 rounded-t-lg shadow-md">
                                    <TrophyIcon className="w-6 h-6 text-yellow-400" />
                                    <h3 className="text-xl font-bold font-display">{group.name}</h3>
                                </div>
                                <StandingsTable standings={groupStandings[group.name] || []} />
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'knockout' && (
                    <div className="animate-slide-up">
                         <h3 className="text-xl font-bold font-display mb-4 text-gray-800">Tournament Tree</h3>
                         {loadingBracket ? <Spinner /> : linkedBracket ? (
                            <TournamentBracketDisplay tournament={linkedBracket} />
                         ) : <p className="text-gray-500 italic">Knockout stage bracket not available.</p>}
                    </div>
                )}

                {activeTab === 'fixtures' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                        <div>
                            <h3 className="text-xl font-bold font-display mb-4 text-gray-800 border-b pb-2">Upcoming Fixtures</h3>
                            <div className="space-y-4">
                                {upcomingFixtures.length > 0 ? upcomingFixtures.map(f => (
                                    <Card key={f.id}>
                                        <FixtureItem 
                                            fixture={f} isExpanded={false} onToggleDetails={() => {}} 
                                            teams={allTeamsObj} onDeleteFixture={() => {}} isDeleting={false} 
                                            directoryMap={new Map()} competitionId={tournament.id}
                                        />
                                    </Card>
                                )) : <p className="text-gray-500 italic">No upcoming matches scheduled.</p>}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold font-display mb-4 text-gray-800 border-b pb-2">Recent Results</h3>
                             <div className="space-y-4">
                                {results.length > 0 ? results.map(f => (
                                    <Card key={f.id} className="border-l-4 border-gray-400">
                                        <FixtureItem 
                                            fixture={f} isExpanded={false} onToggleDetails={() => {}} 
                                            teams={allTeamsObj} onDeleteFixture={() => {}} isDeleting={false} 
                                            directoryMap={new Map()} competitionId={tournament.id}
                                        />
                                    </Card>
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
