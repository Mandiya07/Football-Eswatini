
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Team, Player, Competition, CompetitionFixture } from '../data/teams';
import { fetchCompetition, handleFirestoreError, fetchDirectoryEntries } from '../services/api';
import { DirectoryEntity } from '../data/directory';
import { Card, CardContent } from './ui/Card';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import UsersIcon from './icons/UsersIcon';
import UserIcon from './icons/UserIcon';
import BarChartIcon from './icons/BarChartIcon';
import CalendarIcon from './icons/CalendarIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import Spinner from './ui/Spinner';
import FormGuide from './ui/FormGuide';
import Skeleton from './ui/Skeleton';
import { useAuth } from '../contexts/AuthContext';
import PencilIcon from './icons/PencilIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';
import TrashIcon from './icons/TrashIcon';
import TeamFormModal from './admin/TeamFormModal';
import TeamRosterModal from './admin/TeamRosterModal';
import { db } from '../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { removeUndefinedProps, findInMap, calculateStandings } from '../services/utils';

const TeamProfilePage: React.FC = () => {
  const { competitionId, teamId } = useParams<{ competitionId: string, teamId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [team, setTeam] = useState<Team | null>(null);
  const [allTeams, setAllTeams] = useState<Team[]>([]); // Store all teams to help finding opponents
  const [teamFixtures, setTeamFixtures] = useState<CompetitionFixture[]>([]);
  const [teamResults, setTeamResults] = useState<CompetitionFixture[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [directoryMap, setDirectoryMap] = useState<Map<string, DirectoryEntity>>(new Map());
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
      if (!teamId || !competitionId) {
          setLoading(false);
          return;
      }
      if (!team) setLoading(true);
      
      const [competitionData, directoryEntries] = await Promise.all([
          fetchCompetition(competitionId),
          fetchDirectoryEntries()
      ]);
      
      if (competitionData) {
          const currentTeams = competitionData.teams || [];
          setAllTeams(currentTeams);
          
          const currentTeam = currentTeams.find(t => t.id === parseInt(teamId, 10));
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
           setAllTeams([]);
           setTeamFixtures([]);
           setTeamResults([]);
      }
      
      const map = new Map<string, DirectoryEntity>();
      directoryEntries.forEach(entry => map.set(entry.name.trim().toLowerCase(), entry));
      setDirectoryMap(map);

      setLoading(false);
  }, [competitionId, teamId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
            
            transaction.update(docRef, removeUndefinedProps({ teams: updatedTeams, fixtures: updatedFixtures }));
        });
        
        setTeam(prevTeam => prevTeam ? { ...prevTeam, ...data } as Team : null);
    } catch (error) {
        handleFirestoreError(error, 'save team');
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
      if (!team || !competitionId || isDeleting) return;
      if (!window.confirm(`Are you sure you want to delete ${team.name}? This will also remove them from any associated fixtures and results, and standings will be recalculated.`)) return;

      setIsDeleting(true);
      try {
          const docRef = doc(db, 'competitions', competitionId);
          await runTransaction(db, async (transaction) => {
              const docSnap = await transaction.get(docRef);
              if (!docSnap.exists()) throw new Error("Competition not found");
              const competition = docSnap.data() as Competition;

              const teamIndex = (competition.teams || []).findIndex(t => t.id === team.id);
              if (teamIndex === -1) throw new Error("Team not found");

              const updatedTeams = [...(competition.teams || [])];
              updatedTeams.splice(teamIndex, 1);

              const targetName = team.name.trim();
              const updatedFixtures = (competition.fixtures || []).filter(f => f.teamA.trim() !== targetName && f.teamB.trim() !== targetName);
              const updatedResults = (competition.results || []).filter(r => r.teamA.trim() !== targetName && r.teamB.trim() !== targetName);

              const recalculatedTeams = calculateStandings(updatedTeams, updatedResults);

              transaction.update(docRef, removeUndefinedProps({ teams: recalculatedTeams, fixtures: updatedFixtures, results: updatedResults }));
          });
          navigate('/logs');
      } catch (error) {
          handleFirestoreError(error, 'delete team');
          setIsDeleting(false);
      }
  };

  const handleDeleteFixture = async (fixture: CompetitionFixture) => {
      if (!competitionId || isDeleting) return;
      if (!window.confirm("Are you sure you want to delete this match?")) return;

      setIsDeleting(true);
      try {
          const docRef = doc(db, 'competitions', competitionId);
          await runTransaction(db, async (transaction) => {
              const docSnap = await transaction.get(docRef);
              if (!docSnap.exists()) throw new Error("Competition not found");
              const comp = docSnap.data() as Competition;

              const filterList = (list: CompetitionFixture[]) => list.filter(f => String(f.id) !== String(fixture.id));
              
              const updatedFixtures = filterList(comp.fixtures || []);
              const updatedResults = filterList(comp.results || []);
              
              const updatedTeams = calculateStandings(comp.teams || [], updatedResults, updatedFixtures);

              transaction.update(docRef, removeUndefinedProps({ fixtures: updatedFixtures, results: updatedResults, teams: updatedTeams }));
          });
          loadData(); // Refresh
      } catch (error) {
          handleFirestoreError(error, 'delete fixture');
      } finally {
          setIsDeleting(false);
      }
  };

  const handleDeletePlayer = async (playerId: number) => {
      if (!team || !competitionId || isDeleting) return;
      if (!window.confirm("Are you sure you want to remove this player from the team?")) return;

      setIsDeleting(true);
      try {
          const docRef = doc(db, 'competitions', competitionId);
          await runTransaction(db, async (transaction) => {
              const docSnap = await transaction.get(docRef);
              if (!docSnap.exists()) throw new Error("Competition not found");
              const comp = docSnap.data() as Competition;

              const updatedTeams = (comp.teams || []).map(t => {
                  if (t.id === team.id) {
                      return { ...t, players: (t.players || []).filter(p => p.id !== playerId) };
                  }
                  return t;
              });

              transaction.update(docRef, removeUndefinedProps({ teams: updatedTeams }));
          });
          loadData(); // Refresh
      } catch (error) {
          handleFirestoreError(error, 'delete player');
      } finally {
          setIsDeleting(false);
      }
  };

  const handleRosterSave = async () => {
      await loadData();
      setIsRosterModalOpen(false);
  };

  if (loading && !team) {
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
  
  const canManage = user?.role === 'super_admin' || (user?.role === 'club_admin' && user?.club === team.name);
  const isSuperAdmin = user?.role === 'super_admin';

  const renderContent = () => {
    switch(activeTab) {
        case 'overview': return <OverviewTab team={team} />;
        case 'squad': return <SquadTab players={team.players} canManage={canManage} onManage={() => setIsRosterModalOpen(true)} onDeletePlayer={handleDeletePlayer} isSuperAdmin={isSuperAdmin} />;
        case 'fixtures': return <FixturesTab fixtures={teamFixtures} teamName={team.name} allTeams={allTeams} competitionId={competitionId!} onDeleteFixture={handleDeleteFixture} isSuperAdmin={isSuperAdmin} />;
        case 'results': return <ResultsTab results={teamResults} teamName={team.name} allTeams={allTeams} competitionId={competitionId!} onDeleteFixture={handleDeleteFixture} isSuperAdmin={isSuperAdmin} />;
        default: return <SquadTab players={team.players} canManage={canManage} onManage={() => setIsRosterModalOpen(true)} onDeletePlayer={handleDeletePlayer} isSuperAdmin={isSuperAdmin} />;
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
                     {isSuperAdmin && (
                        <div className="absolute top-2 right-2 flex gap-2">
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="bg-white/80 text-blue-600 hover:bg-white p-2 rounded-full shadow-md transition-colors"
                                aria-label="Edit Team"
                                title="Edit Team"
                            >
                                <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleDeleteTeam}
                                disabled={isDeleting}
                                className="bg-white/80 text-red-600 hover:bg-white p-2 rounded-full shadow-md transition-colors"
                                aria-label="Delete Team"
                                title="Delete Team"
                            >
                                {isDeleting ? <Spinner className="w-5 h-5 border-red-600 border-2" /> : <TrashIcon className="w-5 h-5" />}
                            </button>
                        </div>
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
      {isRosterModalOpen && team && competitionId && (
        <TeamRosterModal
            isOpen={isRosterModalOpen}
            onClose={() => setIsRosterModalOpen(false)}
            onSave={handleRosterSave}
            team={team}
            competitionId={competitionId}
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


const SquadTab: React.FC<{players: Player[], canManage: boolean, onManage: () => void, onDeletePlayer?: (id: number) => void, isSuperAdmin: boolean}> = ({players, canManage, onManage, onDeletePlayer, isSuperAdmin}) => (
    <div>
        {canManage && (
            <div className="flex justify-end mb-6">
                <button 
                    onClick={onManage}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    <PlusCircleIcon className="w-4 h-4" />
                    Manage Squad
                </button>
            </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {(players || []).map(player => (
                <div key={player.id} className="group block text-center relative">
                    <Link to={`/players/${player.id}`} className="block">
                        <Card className="overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                            <div className="relative">
                                <div className="h-24 bg-gradient-to-br from-primary to-primary-dark relative overflow-hidden flex justify-center items-end pb-2">
                                    {player.photoUrl ? (
                                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 z-10">
                                            <img src={player.photoUrl} alt={player.name} className="w-20 h-20 rounded-full border-4 border-white shadow-md object-cover bg-white" />
                                        </div>
                                    ) : (
                                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 z-10 w-20 h-20 rounded-full border-4 border-white shadow-md bg-gray-200 flex items-center justify-center">
                                            <UserIcon className="w-12 h-12 text-gray-400" />
                                        </div>
                                    )}
                                    {player.number > 0 && (
                                        <div className="absolute top-2 right-2 text-white/30 font-display font-bold text-4xl opacity-50 select-none pointer-events-none">
                                            {player.number}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <CardContent className="p-4 pt-10 text-center">
                                <p className="font-bold text-gray-900 truncate group-hover:text-primary transition-colors mb-1">{player.name}</p>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{player.position}</p>
                            </CardContent>
                        </Card>
                    </Link>
                    {isSuperAdmin && onDeletePlayer && (
                        <button 
                            onClick={() => onDeletePlayer(player.id)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1.5 rounded-full shadow-md hover:bg-red-700 transition-colors z-20"
                            title="Delete Player"
                        >
                            <TrashIcon className="w-3 h-3" />
                        </button>
                    )}
                </div>
            ))}
            {(!players || players.length === 0) && (
                <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">No players listed in the squad yet.</p>
                </div>
            )}
        </div>
    </div>
);

const FixturesTab: React.FC<{ fixtures: CompetitionFixture[], teamName: string, allTeams: Team[], competitionId: string, onDeleteFixture?: (f: CompetitionFixture) => void, isSuperAdmin: boolean }> = ({ fixtures, teamName, allTeams, competitionId, onDeleteFixture, isSuperAdmin }) => {
    if (fixtures.length === 0) return <p className="text-gray-500">No upcoming fixtures scheduled.</p>;

    return (
        <ul className="space-y-3">
            {fixtures.map((fixture) => {
                const isHome = fixture.teamA === teamName;
                const opponentName = isHome ? fixture.teamB : fixture.teamA;
                // Find opponent ID from the competition's team list for robust linking
                const opponentTeam = allTeams.find(t => t.name === opponentName);
                
                const opponentContent = opponentTeam ? (
                    <Link to={`/competitions/${competitionId}/teams/${opponentTeam.id}`} className="font-semibold hover:underline text-primary text-left">
                        {opponentName}
                    </Link>
                ) : (
                    <span className="font-semibold text-left">{opponentName}</span>
                );

                return (
                    <li key={fixture.id} className="text-sm bg-gray-5 p-3 rounded-md flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded">{isHome ? 'H' : 'A'}</span>
                            {opponentContent}
                        </div>
                        <div className="flex items-center gap-3">
                             <div className="text-right">
                                 <p className="font-medium text-gray-700">{fixture.day}, {fixture.date}</p>
                                 <p className="text-xs text-gray-500">{fixture.time} at {fixture.venue || 'TBD'}</p>
                             </div>
                             {isSuperAdmin && onDeleteFixture && (
                                <button 
                                    onClick={() => onDeleteFixture(fixture)}
                                    className="ml-2 p-1.5 bg-red-50 text-red-600 rounded-full hover:bg-red-100"
                                    title="Delete Fixture"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                             )}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

const ResultsTab: React.FC<{ results: CompetitionFixture[], teamName: string, allTeams: Team[], competitionId: string, onDeleteFixture?: (f: CompetitionFixture) => void, isSuperAdmin: boolean }> = ({ results, teamName, allTeams, competitionId, onDeleteFixture, isSuperAdmin }) => {
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

                // Find opponent ID from the competition's team list for robust linking
                const opponentTeam = allTeams.find(t => t.name === opponentName);
                
                const opponentContent = opponentTeam ? (
                    <Link to={`/competitions/${competitionId}/teams/${opponentTeam.id}`} className="font-semibold hover:underline text-primary text-left">
                        {opponentName}
                    </Link>
                ) : (
                    <span className="font-semibold text-left">{opponentName}</span>
                );

                return (
                     <li key={result.id} className="text-sm bg-gray-5 p-3 rounded-md flex justify-between items-center">
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
                             {isSuperAdmin && onDeleteFixture && (
                                <button 
                                    onClick={() => onDeleteFixture(result)}
                                    className="ml-1 p-1.5 bg-red-50 text-red-600 rounded-full hover:bg-red-100"
                                    title="Delete Result"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                             )}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};


export default TeamProfilePage;
