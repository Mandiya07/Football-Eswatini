import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Team, Player, Competition, CompetitionFixture } from '../data/teams';
import { fetchCompetition, handleFirestoreError, fetchDirectoryEntries } from '../services/api';
import { DirectoryEntity } from '../data/directory';
import { Card, CardContent } from './ui/Card';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import UsersIcon from './icons/UsersIcon';
import BarChartIcon from './icons/BarChartIcon';
import CalendarIcon from './icons/CalendarIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import Spinner from './ui/Spinner';
import FormGuide from './ui/FormGuide';
import Skeleton from './ui/Skeleton';
import { useAuth } from '../contexts/AuthContext';
import PencilIcon from './icons/PencilIcon';
import TeamFormModal from './admin/TeamFormModal';
import { db } from '../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { removeUndefinedProps, findInMap } from '../services/utils';

const TeamProfilePage: React.FC = () => {
  const { competitionId, teamId } = useParams<{ competitionId: string, teamId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [team, setTeam] = useState<Team | null>(null);
  const [teamFixtures, setTeamFixtures] = useState<CompetitionFixture[]>([]);
  const [teamResults, setTeamResults] = useState<CompetitionFixture[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [directoryMap, setDirectoryMap] = useState<Map<string, DirectoryEntity>>(new Map());

  useEffect(() => {
    const loadData = async () => {
        if (!teamId || !competitionId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const [competitionData, directoryEntries] = await Promise.all([
            fetchCompetition(competitionId),
            fetchDirectoryEntries()
        ]);
        
        if (competitionData) {
            const currentTeam = competitionData.teams?.find(t => t.id === parseInt(teamId, 10));
            setTeam(currentTeam || null);

            if (currentTeam) {
                // Filter fixtures for this team
                const upcoming = (competitionData.fixtures || [])
                    .filter(f => f.teamA === currentTeam.name || f.teamB === currentTeam.name)
                    .sort((a, b) => new Date(a.fullDate!).getTime() - new Date(b.fullDate!).getTime());
                setTeamFixtures(upcoming);

                // Filter results for this team
                const finished = (competitionData.results || [])
                    .filter(r => r.teamA === currentTeam.name || r.teamB === currentTeam.name)
                    .sort((a, b) => new Date(b.fullDate!).getTime() - new Date(a.fullDate!).getTime());
                setTeamResults(finished);
            }
        } else {
             setTeam(null);
             setTeamFixtures([]);
             setTeamResults([]);
        }
        
        const map = new Map<string, DirectoryEntity>();
        directoryEntries.forEach(entry => map.set(entry.name.trim().toLowerCase(), entry));
        setDirectoryMap(map);

        setLoading(false);
    };
    loadData();
  }, [competitionId, teamId]);

  const handleSave = async (data: Partial<Omit<Team, 'id' | 'stats' | 'players' | 'fixtures' | 'results' | 'staff'>>, id?: number) => {
    if (!id || !team || !competitionId) return;

    setLoading(true);
    setIsEditModalOpen(false);

    try {
        const docRef = doc(db, 'competitions', competitionId);
        await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(docRef);
            if (!docSnap.exists()) throw new Error("Competition not found");
            const competition = docSnap.data() as Competition;
            let currentTeams = competition.teams || [];

            const oldTeam = currentTeams.find(t => t.id === id);
            if (!oldTeam) throw new Error("Original team not found for update");
            
            const updatedTeams = currentTeams.map(t => t.id === id ? { ...t, ...data } : t);
            
            let updatedFixtures = competition.fixtures || [];
            if (oldTeam.name !== data.name) {
                updatedFixtures = updatedFixtures.map(f => {
                    if (f.teamA === oldTeam.name) return { ...f, teamA: data.name };
                    if (f.teamB === oldTeam.name) return { ...f, teamB: data.name };
                    return f;
                });
            }
            
            // CRITICAL: Sanitize the entire payload before updating.
            transaction.update(docRef, removeUndefinedProps({ teams: updatedTeams, fixtures: updatedFixtures }));
        });
        
        setTeam(prevTeam => prevTeam ? { ...prevTeam, ...data } as Team : null);
    } catch (error) {
        handleFirestoreError(error, 'save team');
    } finally {
        setLoading(false);
    }
  };


  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen">
            <Spinner />
        </div>
    );
  }

  if (!team) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold">Team not found.</h1>
        <p className="text-gray-600">The team may not exist in this competition or has been moved.</p>
        <Link to="/logs" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to League Logs
        </Link>
      </div>
    );
  }

  const directoryEntry = findInMap(team.name, directoryMap);
  const crestUrl = directoryEntry?.crestUrl || team.crestUrl;

  const renderContent = () => {
    switch(activeTab) {
        case 'overview': return <OverviewTab team={team} />;
        case 'squad': return <SquadTab players={team.players} />;
        case 'fixtures': return <FixturesTab fixtures={teamFixtures} teamName={team.name} directoryMap={directoryMap} />;
        case 'results': return <ResultsTab results={teamResults} teamName={team.name} directoryMap={directoryMap} />;
        default: return <SquadTab players={team.players} />;
    }
  }

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
                <ArrowLeftIcon className="w-4 h-4" />
                Back
            </button>
        </div>

        <Card className="shadow-lg animate-fade-in overflow-hidden">
            <header className="bg-cover bg-center p-8" style={{backgroundImage: "url('https://picsum.photos/1200/300?blur=5&grayscale')"}}>
                <div className="relative flex flex-col sm:flex-row items-center gap-6 bg-black/30 backdrop-blur-sm p-6 rounded-xl">
                    <img src={crestUrl} alt={`${team.name} crest`} className="w-24 h-24 sm:w-32 sm:h-32 object-contain bg-white/80 rounded-full p-2" />
                    <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white text-center sm:text-left tracking-tight" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.7)'}}>{team.name}</h1>
                     {user?.role === 'super_admin' && (
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="absolute top-2 right-2 bg-white/80 text-gray-800 hover:bg-white p-2 rounded-full shadow-md transition-colors"
                            aria-label="Edit Team"
                        >
                            <PencilIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </header>
            
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-4 px-6" aria-label="Tabs">
                    <TabButton name="overview" label="Overview" Icon={BarChartIcon} activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton name="squad" label="Squad" Icon={UsersIcon} activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton name="fixtures" label="Fixtures" Icon={CalendarIcon} activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton name="results" label="Results" Icon={CheckCircleIcon} activeTab={activeTab} setActiveTab={setActiveTab} />
                </nav>
            </div>

            <CardContent className="p-6 md:p-8">
                {renderContent()}
            </CardContent>
        </Card>
      </div>
      {isEditModalOpen && (
        <TeamFormModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSave}
            team={team}
        />
      )}
    </div>
  );
};

interface TabButtonProps {
    name: string;
    label: string;
    Icon: React.FC<React.SVGProps<SVGSVGElement>>;
    activeTab: string;
    setActiveTab: (name: string) => void;
}

const TabButton: React.FC<TabButtonProps> = ({ name, label, Icon, activeTab, setActiveTab }) => (
    <button
      onClick={() => setActiveTab(name)}
      className={`
        ${activeTab === name ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
        whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center gap-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t-sm
      `}
      aria-current={activeTab === name ? 'page' : undefined}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
);

const StatBox: React.FC<{label: string; value: string | number; color?: 'green' | 'yellow' | 'red' | 'blue'; className?: string}> = ({ label, value, color, className = '' }) => {
    const colorClasses = {
        green: 'bg-green-100 text-green-800',
        yellow: 'bg-yellow-100 text-yellow-800',
        red: 'bg-red-100 text-red-800',
        blue: 'bg-blue-100 text-blue-800',
    };
    const bgColor = color ? colorClasses[color] : 'bg-gray-100 text-gray-800';
    return (
        <div className={`${bgColor} p-4 rounded-lg ${className}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm">{label}</p>
        </div>
    );
};

const OverviewTab: React.FC<{team: Team}> = ({team}) => {
    if (!team.stats) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>Season statistics for this team are not available yet.</p>
            </div>
        );
    }
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <StatBox label="Played" value={team.stats.p} />
                <StatBox label="Won" value={team.stats.w} color="green" />
                <StatBox label="Drawn" value={team.stats.d} color="yellow" />
                <StatBox label="Lost" value={team.stats.l} color="red" />
                <StatBox label="Points" value={team.stats.pts} color="blue" className="col-span-2 md:col-span-1" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center items-center">
                 <StatBox label="Goals Scored" value={team.stats.gs} />
                 <StatBox label="Goals Conceded" value={team.stats.gc} />
                 <StatBox label="Goal Difference" value={team.stats.gd} />
                {team.stats.form && (
                    <div className="bg-gray-100 p-4 rounded-lg col-span-2 md:col-span-1 h-full flex flex-col justify-center items-center">
                         <p className="text-sm font-semibold text-gray-600 mb-2">Recent Form</p>
                         <FormGuide form={team.stats.form} />
                    </div>
                )}
            </div>
            {team.kitSponsor && (
                <Card>
                    <CardContent className="p-4 text-center">
                        <h4 className="text-sm font-semibold text-gray-500 mb-2">Official Kit Partner</h4>
                        <img src={team.kitSponsor.logoUrl} alt={team.kitSponsor.name} className="h-12 mx-auto object-contain" />
                    </CardContent>
                </Card>
            )}
        </div>
    );
};


const SquadTab: React.FC<{players: Player[]}> = ({players}) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {players.map(player => (
            <Link key={player.id} to={`/players/${player.id}`} className="group block text-center">
                <Card className="overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                    <div className="relative">
                        <img src={player.photoUrl} alt={player.name} className="w-full h-auto aspect-square object-cover" />
                        <div className="absolute top-2 right-2 bg-black/50 text-white font-bold text-lg w-8 h-8 flex items-center justify-center rounded-full">{player.number}</div>
                    </div>
                    <CardContent className="p-3">
                        <p className="font-semibold text-sm truncate group-hover:text-blue-600">{player.name}</p>
                        <p className="text-xs text-gray-500">{player.position}</p>
                    </CardContent>
                </Card>
            </Link>
        ))}
    </div>
);

const FixturesTab: React.FC<{ fixtures: CompetitionFixture[], teamName: string, directoryMap: Map<string, DirectoryEntity> }> = ({ fixtures, teamName, directoryMap }) => {
    if (fixtures.length === 0) return <p className="text-gray-500">No upcoming fixtures scheduled.</p>;

    return (
        <ul className="space-y-3">
            {fixtures.map((fixture) => {
                const isHome = fixture.teamA === teamName;
                const opponentName = isHome ? fixture.teamB : fixture.teamA;
                const opponentEntity = findInMap(opponentName, directoryMap);
                const isLinkable = !!(opponentEntity?.teamId && opponentEntity.competitionId);

                const opponentContent = isLinkable ? (
                    <Link to={`/competitions/${opponentEntity!.competitionId}/teams/${opponentEntity!.teamId}`} className="font-semibold hover:underline text-primary text-left">
                        {opponentName}
                    </Link>
                ) : (
                    <span className="font-semibold text-left">{opponentName}</span>
                );

                return (
                    <li key={fixture.id} className="text-sm bg-gray-50 p-3 rounded-md flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded">{isHome ? 'H' : 'A'}</span>
                            {opponentContent}
                        </div>
                        <div className="text-right">
                             <p className="font-medium text-gray-700">{fixture.day}, {fixture.date}</p>
                             <p className="text-xs text-gray-500">{fixture.time} at {fixture.venue || 'TBD'}</p>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

const ResultsTab: React.FC<{ results: CompetitionFixture[], teamName: string, directoryMap: Map<string, DirectoryEntity> }> = ({ results, teamName, directoryMap }) => {
    if (results.length === 0) return <p className="text-gray-500">No recent results found.</p>;

    return (
        <ul className="space-y-3">
            {results.map((result) => {
                const isHome = result.teamA === teamName;
                const opponentName = isHome ? result.teamB : result.teamA;
                const teamScore = isHome ? result.scoreA : result.scoreB;
                const opponentScore = isHome ? result.scoreB : result.scoreA;

                let outcome: 'W' | 'D' | 'L';
                let colors = '';

                if (teamScore! > opponentScore!) {
                    outcome = 'W';
                    colors = 'bg-green-100 text-green-800';
                } else if (teamScore! < opponentScore!) {
                    outcome = 'L';
                    colors = 'bg-red-100 text-red-800';
                } else {
                    outcome = 'D';
                    colors = 'bg-yellow-100 text-yellow-800';
                }

                const opponentEntity = findInMap(opponentName, directoryMap);
                const isLinkable = !!(opponentEntity?.teamId && opponentEntity.competitionId);
                
                const opponentContent = isLinkable ? (
                    <Link to={`/competitions/${opponentEntity!.competitionId}/teams/${opponentEntity!.teamId}`} className="font-semibold hover:underline text-primary text-left">
                        {opponentName}
                    </Link>
                ) : (
                    <span className="font-semibold text-left">{opponentName}</span>
                );

                return (
                     <li key={result.id} className="text-sm bg-gray-50 p-3 rounded-md flex justify-between items-center">
                        <div className="flex items-center gap-3">
                             <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${colors}`}>{outcome}</span>
                             <div className="flex items-center gap-2">
                                <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded">{isHome ? 'H' : 'A'}</span>
                                {opponentContent}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                             <p className="font-bold text-lg">{teamScore} - {opponentScore}</p>
                             <p className="text-xs text-gray-500 text-right w-16">{result.day}, {result.date}</p>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};


export default TeamProfilePage;