
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchPlayerById, fetchCompetition, fetchAllCompetitions, fetchStandaloneMatches } from '../services/api';
import { Player, Team, CompetitionFixture } from '../data/teams';
import { Card, CardContent } from './ui/Card';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ShareIcon from './icons/ShareIcon';
import Spinner from './ui/Spinner';
import BarChartIcon from './icons/BarChartIcon';
import HistoryIcon from './icons/HistoryIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import { reconcilePlayers, superNormalize } from '../services/utils';

const StatCard: React.FC<{ label: string; value: number | string; icon?: React.ReactNode; colorClass?: string }> = ({ label, value, icon, colorClass = "text-gray-900" }) => (
    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center transition-all hover:shadow-md hover:border-primary/20">
        {icon && <div className="mb-2">{icon}</div>}
        <span className={`block text-3xl font-black tabular-nums ${colorClass}`}>{value}</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{label}</span>
    </div>
);

const PlayerProfilePage: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [competitionId, setCompetitionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlayer = async () => {
        if (!playerId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const data = await fetchPlayerById(parseInt(playerId, 10));
        
        if (data) {
            // RE-RECONCILE STATS FROM ALL COMPETITIONS & STANDALONE MATCHES
            const [allComps, standalone] = await Promise.all([
                fetchAllCompetitions(),
                fetchStandaloneMatches(data.team.name)
            ]);

            const normTeamName = superNormalize(data.team.name);
            const masterMatchList: CompetitionFixture[] = [...standalone];

            Object.values(allComps).forEach(hub => {
                const hubMatches = [...(hub.fixtures || []), ...(hub.results || [])].filter(m => 
                    superNormalize(m.teamA) === normTeamName || superNormalize(m.teamB) === normTeamName
                );
                masterMatchList.push(...hubMatches);
            });

            // Use the original team object as the base but apply global reconciliation
            const reconciled = reconcilePlayers([data.team], masterMatchList);
            const updatedTeam = reconciled[0];
            const updatedPlayer = updatedTeam?.players.find(p => p.id === parseInt(playerId, 10));
            
            if (updatedPlayer && updatedTeam) {
                setPlayer(updatedPlayer);
                setTeam(updatedTeam);
                setCompetitionId(data.competitionId);
            } else {
                setPlayer(data.player);
                setTeam(data.team);
                setCompetitionId(data.competitionId);
            }
        }
        setLoading(false);
    };
    loadPlayer();
  }, [playerId]);

  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen">
            <Spinner />
        </div>
    );
  }

  if (!player || !team) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold">Player not found.</h1>
        <Link to="/logs" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to League Logs
        </Link>
      </div>
    );
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareData = {
      title: `Check out ${player.name} on Football Eswatini`,
      text: `View the profile of ${player.name}, playing for ${team.name}.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        alert('Could not copy link to clipboard.');
      }
    }
  };

  return (
    <div className="py-12 bg-slate-50/50 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
         <div className="mb-6">
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100"
            >
                <ArrowLeftIcon className="w-4 h-4" />
                Back
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-1">
                <Card className="shadow-2xl border-0 overflow-hidden rounded-[2.5rem] sticky top-24">
                     <div className="relative">
                        <div className="h-40 bg-gradient-to-br from-primary via-primary-dark to-slate-900 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                             <div className="absolute top-4 right-4 z-10">
                                <div className="relative">
                                    <button
                                        onClick={handleShare}
                                        className="bg-white/10 backdrop-blur-md text-white hover:bg-white/20 p-2.5 rounded-2xl transition-all border border-white/10 shadow-lg active:scale-95"
                                        aria-label={`Share ${player.name}'s profile`}
                                    >
                                        <ShareIcon className="w-5 h-5" />
                                    </button>
                                    {copied && (
                                        <span className="absolute bottom-full mb-3 -right-2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg py-1.5 px-3 whitespace-nowrap z-10 animate-fade-in shadow-2xl border border-white/10">
                                            Link Copied!
                                            <div className="absolute top-full right-4 w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-gray-900"></div>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center -mt-20 relative z-10">
                            <div className="relative">
                                <img src={player.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${player.name}`} alt={player.name} className="w-40 h-40 rounded-[3rem] border-8 border-white shadow-2xl object-cover bg-white" />
                                <div className="absolute -bottom-2 -right-2 bg-accent text-primary-dark font-black text-2xl w-12 h-12 flex items-center justify-center rounded-2xl border-4 border-white shadow-lg">
                                    {player.number}
                                </div>
                            </div>
                        </div>
                     </div>
                     <CardContent className="p-8 text-center pt-6">
                         <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-2">{player.position}</p>
                         <h1 className="text-3xl font-display font-black text-slate-900 mb-6 leading-tight">{player.name}</h1>
                         
                         <Link to={`/competitions/${competitionId}/teams/${team.id}`} className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all group w-full justify-center">
                            <img src={team.crestUrl} alt={team.name} className="w-8 h-8 object-contain transition-transform group-hover:scale-110" />
                            <span className="font-black text-sm text-slate-700 group-hover:text-primary uppercase tracking-tight">{team.name}</span>
                         </Link>
                     </CardContent>
                </Card>
            </div>
            
            <div className="md:col-span-2 space-y-8">
                 {/* Player Statistics - Detailed Breakdown */}
                 <Card className="shadow-xl border-0 overflow-hidden rounded-[2.5rem] bg-white">
                    <div className="bg-slate-900 p-6 text-white flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary rounded-xl shadow-lg"><BarChartIcon className="w-6 h-6 text-white" /></div>
                            <h2 className="text-xl font-display font-black uppercase tracking-tight">Performance Analytics</h2>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total System Record</span>
                    </div>
                    <CardContent className="p-8 bg-slate-50/30">
                         <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                            <StatCard label="Appearances" value={player.stats.appearances} />
                            <StatCard label="Goals Scored" value={player.stats.goals} colorClass="text-primary" />
                            <StatCard label="Assists" value={player.stats.assists} colorClass="text-blue-500" />
                            
                            <StatCard 
                                label="Yellow Cards" 
                                value={player.stats.yellowCards || 0} 
                                icon={<div className="w-4 h-6 bg-yellow-400 rounded-sm shadow-sm border border-yellow-500"></div>}
                            />
                            <StatCard 
                                label="Red Cards" 
                                value={player.stats.redCards || 0} 
                                icon={<div className="w-4 h-6 bg-red-600 rounded-sm shadow-sm border border-red-700"></div>}
                            />
                            <StatCard 
                                label="Clean Sheets" 
                                value={player.stats.cleanSheets || 0} 
                                icon={<ShieldCheckIcon className="w-6 h-6 text-green-500" />}
                                colorClass="text-green-600"
                            />
                        </div>
                        
                        <div className="mt-8 p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Verified Technical Data</span>
                            </div>
                            <p className="text-[10px] text-slate-300 font-medium">Aggregated across all competitions & friendlies</p>
                        </div>
                    </CardContent>
                </Card>

                 {/* Biography */}
                 <Card className="shadow-lg border-0 rounded-[2.5rem] overflow-hidden">
                    <CardContent className="p-8">
                        <h2 className="text-xl font-display font-black uppercase tracking-tight mb-6 text-slate-800 border-b pb-4">Player Profile</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div className="flex flex-col">
                                <span className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black mb-1">Nationality</span>
                                <span className="font-bold text-slate-900">{player.bio.nationality}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black mb-1">Age</span>
                                <span className="font-bold text-slate-900">{player.bio.age} Years</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black mb-1">Height</span>
                                <span className="font-bold text-slate-900">{player.bio.height}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black mb-1">Current Club</span>
                                <span className="font-bold text-primary">{player.club || team.name}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                 
                 {/* Transfer History */}
                 <Card className="shadow-lg border-0 rounded-[2.5rem] overflow-hidden bg-white">
                    <CardContent className="p-8">
                        <h2 className="text-xl font-display font-black uppercase tracking-tight mb-6 flex items-center gap-3 text-slate-800 border-b pb-4">
                            <HistoryIcon className="w-6 h-6 text-primary" />
                            Career Timeline
                        </h2>
                        <div className="overflow-hidden rounded-2xl border border-slate-100">
                            {player.transferHistory.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4 text-left">Season</th>
                                            <th className="px-6 py-4 text-left">From</th>
                                            <th className="px-6 py-4 text-center w-12"></th>
                                            <th className="px-6 py-4 text-left">To</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 bg-white">
                                        {player.transferHistory.map((transfer, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4 font-mono text-slate-500 font-bold">{transfer.year}</td>
                                                <td className="px-6 py-4 font-bold text-slate-700">{transfer.from}</td>
                                                <td className="px-6 py-4 text-center text-slate-300">
                                                    <ArrowRightIcon className="w-4 h-4 mx-auto group-hover:text-primary transition-colors" />
                                                </td>
                                                <td className="px-6 py-4 font-black text-primary">{transfer.to}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-12 text-center text-slate-400 bg-slate-50/50">
                                    <HistoryIcon className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                    <p className="italic font-medium">No transfer history records verified for this profile.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfilePage;
