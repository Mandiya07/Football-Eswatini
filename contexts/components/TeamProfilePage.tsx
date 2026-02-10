
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
import { removeUndefinedProps, findInMap, reconcilePlayers, superNormalize } from '../services/utils';
import FacebookIcon from './icons/FacebookIcon';
import InstagramIcon from './icons/InstagramIcon';
import YouTubeIcon from './icons/YouTubeIcon';
import TwitterIcon from './icons/TwitterIcon';
import GlobeIcon from './icons/GlobeIcon';
import FilmIcon from './icons/FilmIcon';
import VideoPlayer from './VideoPlayer';
import BriefcaseIcon from './icons/BriefcaseIcon';
import Button from './ui/Button';

const HERO_IMAGES = [
    "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2000&auto=format&fit=crop", // Stadium Action
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000&auto=format&fit=crop", // Professional Pitch
    "https://images.unsplash.com/photo-1522778119026-d647f0565c79?q=80&w=2000&auto=format&fit=crop", // Stadium Lights
    "https://images.unsplash.com/photo-1517466787929-bc90951d64b8?q=80&w=2000&auto=format&fit=crop", // Net & Ball
    "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?q=80&w=2000&auto=format&fit=crop", // Match Day Atmosphere
    "https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=2000&auto=format&fit=crop", // Ball Close-up
    "https://images.unsplash.com/photo-1510563800743-aed236490d08?q=80&w=2000&auto=format&fit=crop", // Soccer Aerial
    "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=2000&auto=format&fit=crop"  // Fans & Flags
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
  
  const heroImage = useMemo(() => {
      const idNum = parseInt(teamId || '0', 10) || 0;
      const index = idNum % HERO_IMAGES.length;
      return HERO_IMAGES[index];
  }, [teamId]);

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

      // 1. ATTEMPT INITIAL LOOKUP BY URL PARAMS
      let resolvedCompId = competitionId;
      let competitionData = competitionId ? allCompetitionsData[competitionId] : undefined;
      let teamMatch = competitionData?.teams?.find(t => String(t.id) === String(teamId));
      
      // 2. DATA RECOVERY: GLOBAL ID SWEEP
      if (!teamMatch) {
          const globalResult = await fetchTeamByIdGlobally(teamId);
          if (globalResult) {
              teamMatch = globalResult.team;
              resolvedCompId = globalResult.competitionId;
              competitionData = allCompetitionsData[resolvedCompId];
          }
      }

      // 3. DATA RECOVERY: NAME SWEEP (If ID is missing in the destination hub)
      if (!teamMatch) {
          const dirEntry = directoryEntries.find(e => String(e.teamId) === String(teamId));
          const nameToSearch = dirEntry?.name;
          
          if (nameToSearch) {
              const normSearch = superNormalize(nameToSearch);
              const plHub = allCompetitionsData['mtn-premier-league'];
              const plMatch = plHub?.teams?.find(t => superNormalize(t.name) === normSearch);
              
              if (plMatch) {
                  teamMatch = plMatch;
                  resolvedCompId = 'mtn-premier-league';
                  competitionData = plHub;
              } else {
                  for (const [compId, comp] of Object.entries(allCompetitionsData)) {
                      const match = comp.teams?.find(t => superNormalize(t.name) === normSearch);
                      if (match) {
                          teamMatch = match;
                          resolvedCompId = compId;
                          competitionData = comp;
                          break;
                      }
                  }
              }
          }
      }

      setActiveCompId(resolvedCompId || null);

      if (competitionData && teamMatch) {
          const allMatches = [...(competitionData.fixtures || []), ...(competitionData.results || [])];
          const reconciledTeams = reconcilePlayers(competitionData.teams || [], allMatches);
          
          const currentTeam = reconciledTeams.find(t => String(t.id) === String(teamMatch!.id));
          setTeam(currentTeam || null);

          if (currentTeam) {
              const teamName = currentTeam.name;
              const officialUpcoming = (competitionData.fixtures || [])
                  .filter(f => f.teamA === teamName || f.teamB === teamName);
              const officialFinished = (competitionData.results || [])
                  .filter(r => r.teamA === teamName || r.teamB === teamName);
              
              const standalone = await fetchStandaloneMatches(teamName);
              
              setTeamFixtures([...officialUpcoming, ...standalone.filter(m => m.status !== 'finished')].sort((a, b) => {
                  const dateA = new Date(a.fullDate || 0).getTime();
                  const dateB = new Date(b.fullDate || 0).getTime();
                  return dateA - dateB;
              }));
              
              setTeamResults([...officialFinished, ...standalone.filter(m => m.status === 'finished')].sort((a, b) => {
                  const dateA = a.fullDate || '';
                  const dateB = b.fullDate || '';
                  return (dateB || '').localeCompare(dateA || '');
              }));
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
        case 'fixtures': return <FixturesTab fixtures={teamFixtures} teamName={team.name} directoryMap={directoryMap} allComps={allComps} currentCompId={activeCompId || ''} />;
        case 'results': return <ResultsTab results={teamResults} teamName={team.name} directoryMap={directoryMap} allComps={allComps} currentCompId={activeCompId || ''} />;
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
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end"><p className="text-white font-black text-xl leading-none">#{player.number}</p>{player.stats.goals > 0 && <div className="flex items-center gap-1 bg-green-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">⚽ {player.stats.goals}</div>}</div>
                </div>
                <p className="font-bold text-gray-900 group-hover:text-primary transition-colors truncate">{player.name}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{player.position}</p>
            </Link>
        ))}
    </div>
);

const OpponentLink: React.FC<{ 
    opponentName: string, 
    directoryMap: Map<string, DirectoryEntity>, 
    allComps: Record<string, Competition>,
    currentCompId: string
}> = ({ opponentName, directoryMap, allComps, currentCompId }) => {
    
    const profile = useMemo(() => {
        const norm = superNormalize(opponentName);
        const localComp = allComps[currentCompId];
        const localMatch = localComp?.teams?.find(t => superNormalize(t.name) === norm);
        if (localMatch) return { tid: localMatch.id, cid: currentCompId };
        const dirEntry = findInMap(opponentName, directoryMap);
        if (dirEntry?.teamId && dirEntry.competitionId) return { tid: dirEntry.teamId, cid: dirEntry.competitionId };
        for (const [compId, comp] of Object.entries(allComps)) {
            const team = (comp as Competition).teams?.find(t => superNormalize(t.name) === norm);
            if (team) return { tid: team.id, cid: compId };
        }
        return null;
    }, [opponentName, directoryMap, allComps, currentCompId]);

    return profile ? (
        <Link to={`/competitions/${profile.cid}/teams/${profile.tid}`} className="text-blue-600 hover:text-blue-800 font-black hover:underline transition-all underline-offset-4 decoration-2 decoration-blue-200">{opponentName}</Link>
    ) : <span className="font-bold text-gray-600">{opponentName}</span>;
};

const FixturesTab: React.FC<{ fixtures: CompetitionFixture[], teamName: string, directoryMap: Map<string, DirectoryEntity>, allComps: Record<string, Competition>, currentCompId: string }> = ({ fixtures, teamName, directoryMap, allComps, currentCompId }) => (
    <div className="space-y-3">
        {fixtures.length > 0 ? fixtures.map(f => {
            const isHome = f.teamA === teamName;
            return (
                <div key={f.id} className="p-4 border rounded-2xl flex justify-between items-center bg-white hover:bg-gray-50 transition-all border-gray-100">
                    <div><div className="flex items-center gap-3"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded border">{isHome ? 'Home' : 'Away'}</span><span className="font-black text-gray-800 text-lg">vs <OpponentLink opponentName={isHome ? f.teamB : f.teamA} directoryMap={directoryMap} allComps={allComps} currentCompId={currentCompId} /></span></div><p className="text-xs text-gray-400 font-bold uppercase mt-1">{f.fullDate} @ {f.time} &bull; {f.venue || 'TBA'}</p></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest border px-3 py-1 rounded-lg">Scheduled</span>
                </div>
            );
        }) : <p className="text-center py-10 text-gray-400 italic">No upcoming matches scheduled.</p>}
    </div>
);

const ResultsTab: React.FC<{ results: CompetitionFixture[], teamName: string, directoryMap: Map<string, DirectoryEntity>, allComps: Record<string, Competition>, currentCompId: string }> = ({ results, teamName, directoryMap, allComps, currentCompId }) => (
    <div className="space-y-3">
        {results.length > 0 ? results.map(r => {
            const isTeamA = r.teamA === teamName;
            const outcome: 'W'|'D'|'L' = r.scoreA === r.scoreB ? 'D' : (isTeamA ? (r.scoreA! > r.scoreB! ? 'W' : 'L') : (r.scoreB! > r.scoreA! ? 'W' : 'L'));
            const colors = { 'W': 'bg-green-100 text-green-700 border-green-200', 'D': 'bg-gray-100 text-gray-700 border-gray-200', 'L': 'bg-red-100 text-red-700 border-red-200' };
            return (
                <div key={r.id} className="p-5 border rounded-2xl flex justify-between items-center bg-white hover:shadow-md transition-all border-gray-100">
                    <div className="flex-1 min-w-0"><div className="flex items-center gap-3"><div className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center font-black text-xs border ${colors[outcome]}`}>{outcome}</div><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded border">{isTeamA ? 'Home' : 'Away'}</span><span className="font-black text-gray-900 text-lg truncate">vs <OpponentLink opponentName={isTeamA ? r.teamB : r.teamA} directoryMap={directoryMap} allComps={allComps} currentCompId={currentCompId} /></span></div><p className="text-xs text-gray-400 font-bold uppercase mt-1 truncate">{r.fullDate} &bull; {r.competition}</p></div>
                    <div className="bg-slate-900 text-white px-5 py-2 rounded-xl font-black text-2xl tabular-nums shadow-lg ml-4">{isTeamA ? `${r.scoreA} - ${r.scoreB}` : `${r.scoreB} - ${r.scoreA}`}</div>
                </div>
            );
        }) : <p className="text-center py-10 text-gray-400 italic">No recent results found.</p>}
    </div>
);

const VideosTab: React.FC<{ videos?: TeamVideo[] }> = ({ videos }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">{(videos || []).map(v => (<div key={v.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"><VideoPlayer src={v.url} title={v.title} /><div className="p-4"><p className="font-bold text-gray-800">{v.title}</p><p className="text-[10px] text-gray-400 uppercase mt-1">{v.date}</p></div></div>))}</div>
);

export default TeamProfilePage;
