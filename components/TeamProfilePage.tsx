
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Team, Player, Competition, CompetitionFixture, TeamVideo } from '../data/teams';
import { fetchCompetition, handleFirestoreError, fetchDirectoryEntries, fetchStandaloneMatches, fetchAllCompetitions, fetchTeamByIdGlobally } from '../services/api';
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
import { useAuth } from '../contexts/AuthContext';
import { removeUndefinedProps, findInMap, reconcilePlayers, superNormalize, calculateStandings } from '../services/utils';
import FacebookIcon from './icons/FacebookIcon';
import InstagramIcon from './icons/InstagramIcon';
import YouTubeIcon from './icons/YouTubeIcon';
import TwitterIcon from './icons/TwitterIcon';
import GlobeIcon from './icons/GlobeIcon';
import FilmIcon from './icons/FilmIcon';
import VideoPlayer from './VideoPlayer';
import BriefcaseIcon from './icons/BriefcaseIcon';
import Button from './ui/Button';
import { FixtureItem } from './Fixtures';

const HERO_IMAGES = [
    "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2000&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1522778119026-d647f0565c79?q=80&w=2000&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1517466787929-bc90951d64b8?q=80&w=2000&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?q=80&w=2000&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=2000&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1510563800743-aed236490d08?q=80&w=2000&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=2000&auto=format&fit=crop"  
];

const TeamProfilePage: React.FC = () => {
  const { competitionId, teamId } = useParams<{ competitionId: string, teamId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [team, setTeam] = useState<Team | null>(null);
  const [activeCompId, setActiveCompId] = useState<string | null>(null);
  const [teamFixtures, setTeamFixtures] = useState<CompetitionFixture[]>([]);
  const [teamResults, setTeamResults] = useState<CompetitionFixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [directoryMap, setDirectoryMap] = useState<Map<string, DirectoryEntity>>(new Map());
  const [allComps, setAllComps] = useState<Record<string, Competition>>({});
  const [currentCompTeams, setCurrentCompTeams] = useState<Team[]>([]);
  const [expandedMatchId, setExpandedMatchId] = useState<string | number | null>(null);
  
  const heroImage = useMemo(() => {
      const idNum = parseInt(teamId || '0', 10) || 0;
      const index = idNum % HERO_IMAGES.length;
      return HERO_IMAGES[index];
  }, [teamId]);

  /**
   * EVENT-AUTHORITATIVE PUBLIC LOADER
   * 1. Merges metadata from all hubs.
   * 2. Recalculates all stats from the global match feed.
   */
  const loadData = useCallback(async () => {
      if (!teamId) {
          setLoading(false);
          return;
      }
      setLoading(true);
      
      const [directoryEntries, allCompetitionsData] = await Promise.all([
          fetchDirectoryEntries(),
          fetchAllCompetitions()
      ]);
      setAllComps(allCompetitionsData);

      // Search for the team identity
      let teamMatch: Team | null = null;
      let resolvedCompId = competitionId;
      const normId = String(teamId);

      // 1. Direct hub check
      if (competitionId && allCompetitionsData[competitionId]) {
          const t = allCompetitionsData[competitionId].teams?.find(t => String(t.id) === normId);
          if (t) teamMatch = t;
      }

      // 2. Global hub check (Recovery mode)
      const teamVersions: Team[] = [];
      Object.entries(allCompetitionsData).forEach(([compId, comp]) => {
          const t = comp.teams?.find(t => String(t.id) === normId);
          if (t) {
              teamVersions.push(t);
              if (!teamMatch) {
                  teamMatch = t;
                  resolvedCompId = compId;
              }
          }
      });

      if (!teamMatch) {
          const dirEntry = directoryEntries.find(e => String(e.teamId) === normId);
          if (dirEntry) {
              const normSearch = superNormalize(dirEntry.name);
              Object.entries(allCompetitionsData).forEach(([compId, comp]) => {
                  const t = comp.teams?.find(t => superNormalize(t.name) === normSearch);
                  if (t) {
                      teamVersions.push(t);
                      if (!teamMatch) {
                          teamMatch = t;
                          resolvedCompId = compId;
                      }
                  }
              });
          }
      }

      setActiveCompId(resolvedCompId || null);

      if (teamMatch) {
          const normName = superNormalize(teamMatch.name);

          // AGGREGATE ALL MATCHES IN SYSTEM
          const masterMatchList: CompetitionFixture[] = [];
          Object.values(allCompetitionsData).forEach(hub => {
              const hubMatches = [...(hub.fixtures || []), ...(hub.results || [])].filter(m => 
                  superNormalize(m.teamA) === normName || superNormalize(m.teamB) === normName
              );
              masterMatchList.push(...hubMatches);
          });

          const standalone = await fetchStandaloneMatches(teamMatch.name);
          masterMatchList.push(...standalone);
          
          // PERFORM EVENT-DRIVEN RECONCILIATION
          // Calculates apps, goals, etc. purely from the match logs
          const reconciledTeams = reconcilePlayers(teamVersions, masterMatchList);
          const currentTeam = reconciledTeams.find(t => superNormalize(t.name) === normName);
          
          // Calculate Standings specific to the main hub context for the overview box
          if (resolvedCompId && allCompetitionsData[resolvedCompId]) {
              const contextComp = allCompetitionsData[resolvedCompId];
              const leagueStandings = calculateStandings(
                  contextComp.teams || [], 
                  contextComp.results || [], 
                  contextComp.fixtures || []
              );
              const leagueVersion = leagueStandings.find(t => superNormalize(t.name) === normName);
              if (currentTeam && leagueVersion) {
                  currentTeam.stats = leagueVersion.stats;
              }
          }

          setTeam(currentTeam || null);
          setCurrentCompTeams(reconciledTeams);

          if (currentTeam) {
              const matches = masterMatchList.filter(m => superNormalize(m.teamA) === normName || superNormalize(m.teamB) === normName);
              setTeamFixtures(matches.filter(m => m.status !== 'finished').sort((a,b) => new Date(a.fullDate || 0).getTime() - new Date(b.fullDate || 0).getTime()));
              setTeamResults(matches.filter(m => m.status === 'finished').sort((a,b) => new Date(b.fullDate || 0).getTime() - new Date(a.fullDate || 0).getTime()));
          }
      }
      
      const map = new Map<string, DirectoryEntity>();
      directoryEntries.forEach(entry => map.set(entry.name.trim().toLowerCase(), entry));
      setDirectoryMap(map);
      setLoading(false);
  }, [competitionId, teamId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const renderContent = () => {
    if (!team) return null;
    switch(activeTab) {
        case 'overview': return <OverviewTab team={team} primaryColor={team?.branding?.primaryColor} welcomeMessage={team?.branding?.welcomeMessage} />;
        case 'squad': return <SquadTab players={team?.players || []} />;
        case 'fixtures': return <MatchTab matches={teamFixtures} teams={currentCompTeams} directoryMap={directoryMap} competitionId={activeCompId || ''} expandedId={expandedMatchId} setExpandedId={setExpandedMatchId} />;
        case 'results': return <MatchTab matches={teamResults} teams={currentCompTeams} directoryMap={directoryMap} competitionId={activeCompId || ''} expandedId={expandedMatchId} setExpandedId={setExpandedMatchId} />;
        case 'videos': return <VideosTab videos={team?.videos} />;
        default: return null;
    }
  }

  if (loading) return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
  if (!team) return <div className="py-20 text-center flex flex-col items-center gap-4">
    <p className="text-gray-500 font-bold">Team Profile Not Initialized</p>
    <Link to="/directory" className="text-primary hover:underline font-bold">Return to Directory</Link>
  </div>;

  const bannerImg = (team.branding?.bannerUrl && team.branding.bannerUrl.trim() !== "" && !team.branding.bannerUrl.startsWith('data:')) ? team.branding.bannerUrl : heroImage;

  return (
    <div className="py-12" style={team.branding ? { backgroundColor: `${team.branding.primaryColor}08` } : {}}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeftIcon className="w-4 h-4" /> Back
            </button>
        </div>

        <Card className="shadow-lg animate-fade-in overflow-hidden" style={team.branding ? { borderTop: `4px solid ${team.branding.secondaryColor}` } : {}}>
            <header className="bg-cover bg-center p-8 relative min-h-[350px] flex items-end transition-all" style={{ backgroundImage: `url('${bannerImg}')` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent"></div>
                <div className="relative z-10 flex flex-col sm:flex-row items-end sm:items-center gap-6 w-full">
                    <img src={findInMap(team.name, directoryMap)?.crestUrl || team.crestUrl} alt="" className="w-24 h-24 sm:w-32 sm:h-32 object-contain bg-white rounded-full p-2 border-4 border-white shadow-lg" />
                    <div className="mb-2 flex-grow">
                        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>{team.name}</h1>
                        <div className="flex flex-wrap items-center gap-6 mt-4">
                            {team.socialMedia && (
                                <div className="flex gap-3">
                                    {team.socialMedia.facebook && <a href={team.socialMedia.facebook} className="text-white/80 hover:text-white p-1.5 bg-white/10 rounded-full transition-colors"><FacebookIcon className="w-5 h-5"/></a>}
                                    {team.socialMedia.twitter && <a href={team.socialMedia.twitter} className="text-white/80 hover:text-white p-1.5 bg-white/10 rounded-full transition-colors"><TwitterIcon className="w-5 h-5"/></a>}
                                    {team.socialMedia.instagram && <a href={team.socialMedia.instagram} className="text-white/80 hover:text-white p-1.5 bg-white/10 rounded-full transition-colors"><InstagramIcon className="w-5 h-5"/></a>}
                                    {team.socialMedia.website && <a href={team.socialMedia.website} className="text-white/80 hover:text-white p-1.5 bg-white/10 rounded-full transition-colors"><GlobeIcon className="w-5 h-5"/></a>}
                                </div>
                            )}
                            
                            <Link to="/partnerships" className="ml-0 sm:ml-2">
                                <Button variant="accent" className="h-10 px-6 rounded-xl shadow-2xl flex items-center gap-2 group transition-all">
                                    <BriefcaseIcon className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                                    Manage Team
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-4 px-6 overflow-x-auto" aria-label="Tabs">
                    <TabButton name="overview" label="Overview" Icon={BarChartIcon} activeTab={activeTab} setActiveTab={setActiveTab} activeColor={team.branding?.primaryColor} />
                    <TabButton name="squad" label="Squad" Icon={UsersIcon} activeTab={activeTab} setActiveTab={setActiveTab} activeColor={team.branding?.primaryColor} />
                    <TabButton name="fixtures" label="Fixtures" Icon={CalendarIcon} activeTab={activeTab} setActiveTab={setActiveTab} activeColor={team.branding?.primaryColor} />
                    <TabButton name="results" label="Results" Icon={CheckCircleIcon} activeTab={activeTab} setActiveTab={setActiveTab} activeColor={team.branding?.primaryColor} />
                    <TabButton name="videos" label="Videos" Icon={FilmIcon} activeTab={activeTab} setActiveTab={setActiveTab} activeColor={team.branding?.primaryColor} />
                </nav>
            </div>
            <CardContent className="p-6 md:p-8">{renderContent()}</CardContent>
        </Card>
      </div>
    </div>
  );
};

interface TabButtonProps { name: string; label: string; Icon: any; activeTab: string; setActiveTab: (n: string) => void; activeColor?: string; }
const TabButton: React.FC<TabButtonProps> = ({ name, label, Icon, activeTab, setActiveTab, activeColor }) => {
    const isActive = activeTab === name;
    const style = isActive && activeColor ? { color: activeColor, borderColor: activeColor } : {};
    return (
        <button onClick={() => setActiveTab(name)} style={style} className={`${isActive ? (activeColor ? '' : 'border-blue-600 text-blue-600') : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-black uppercase text-[10px] tracking-widest inline-flex items-center gap-2 transition-colors duration-200`}>
          <Icon className="w-4 h-4" />{label}
        </button>
    );
};

const OverviewTab: React.FC<{team: Team, primaryColor?: string, welcomeMessage?: string}> = ({team, primaryColor, welcomeMessage}) => (
    <div className="space-y-8">
        {welcomeMessage && <div className="bg-gray-50 border-l-4 p-6 rounded-r-2xl" style={{ borderColor: primaryColor || '#3b82f6' }}><p className="text-gray-700 italic text-lg leading-relaxed">"{welcomeMessage}"</p></div>}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            <StatBox label="Played" value={team.stats.p} /><StatBox label="Won" value={team.stats.w} color="green" /><StatBox label="Drawn" value={team.stats.d} color="yellow" /><StatBox label="Lost" value={team.stats.l} color="red" /><StatBox label="GS" value={team.stats.gs} /><StatBox label="GC" value={team.stats.gc} /><StatBox label="GD" value={team.stats.gd} color={team.stats.gd > 0 ? "green" : team.stats.gd < 0 ? "red" : undefined} /><StatBox label="Points" value={team.stats.pts} color="blue" />
        </div>
        <div className="bg-gray-100 p-6 rounded-2xl flex flex-col items-center justify-center"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Recent Form</p><FormGuide form={team.stats.form} /></div>
    </div>
);

const StatBox: React.FC<{label: string; value: string | number; color?: 'green' | 'yellow' | 'red' | 'blue'}> = ({ label, value, color }) => {
    const colorClasses = { green: 'bg-green-100 text-green-800', yellow: 'bg-yellow-100 text-yellow-800', red: 'bg-red-100 text-red-800', blue: 'bg-blue-600 text-white shadow-lg' };
    return (<div className={`${color ? colorClasses[color] : 'bg-gray-50 text-gray-800'} p-5 rounded-2xl text-center flex flex-col justify-center`}><p className="text-3xl font-black tabular-nums">{value}</p><p className="text-[10px] font-bold uppercase opacity-60 tracking-wider">{label}</p></div>);
};

const SquadTab: React.FC<{players: Player[]}> = ({players}) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {players.map(player => (
            <Link key={player.id} to={`/players/${player.id}`} className="group block text-center">
                <div className="aspect-[4/5] bg-gray-100 rounded-2xl overflow-hidden relative mb-3 shadow-sm border border-gray-200">
                    {player.photoUrl ? <img src={player.photoUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" /> : <div className="w-full h-full flex items-center justify-center bg-gray-100"><UserIcon className="w-12 h-12 text-gray-300" /></div>}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
                        <p className="text-white font-black text-xl leading-none">#{player.number}</p>
                        <div className="flex flex-col gap-1 items-end">
                            {player.stats.goals > 0 && <div className="flex items-center gap-1 bg-green-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">⚽ {player.stats.goals}</div>}
                            {(player.stats.yellowCards || 0) > 0 && <div className="flex items-center gap-1 bg-yellow-400 text-yellow-900 text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm border border-yellow-500">🟨 {player.stats.yellowCards}</div>}
                        </div>
                    </div>
                </div>
                <p className="font-bold text-gray-900 group-hover:text-primary transition-colors truncate">{player.name}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{player.position}</p>
            </Link>
        ))}
    </div>
);

const MatchTab: React.FC<{ matches: CompetitionFixture[], teams: Team[], directoryMap: Map<string, any>, competitionId: string, expandedId: any, setExpandedId: any }> = ({ matches, teams, directoryMap, competitionId, expandedId, setExpandedId }) => (
    <div className="space-y-4">
        {matches.length > 0 ? matches.map(m => (
            <Card key={m.id} className="overflow-hidden border border-gray-100 shadow-sm">
                <FixtureItem 
                    fixture={m} 
                    isExpanded={expandedId === m.id} 
                    onToggleDetails={() => setExpandedId(expandedId === m.id ? null : m.id)} 
                    teams={teams} 
                    onDeleteFixture={() => {}} 
                    isDeleting={false} 
                    directoryMap={directoryMap} 
                    competitionId={competitionId} 
                />
            </Card>
        )) : <p className="text-center py-10 text-gray-400 italic">No matches found in this category.</p>}
    </div>
);

const VideosTab: React.FC<{ videos?: TeamVideo[] }> = ({ videos }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">{(videos || []).map(v => (<div key={v.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"><VideoPlayer src={v.url} title={v.title} /><div className="p-4"><p className="font-bold text-gray-800">{v.title}</p><p className="text-[10px] text-gray-400 uppercase mt-1">{v.date}</p></div></div>))}</div>
);

export default TeamProfilePage;
