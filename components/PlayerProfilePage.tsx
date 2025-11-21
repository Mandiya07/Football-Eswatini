
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
// FIX: Import 'fetchPlayerById' which is now correctly exported from the API service.
import { fetchPlayerById } from '../services/api';
import { Player, Team } from '../data/teams';
import { Card, CardContent } from './ui/Card';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ShareIcon from './icons/ShareIcon';
import Spinner from './ui/Spinner';
import BarChartIcon from './icons/BarChartIcon';
import HistoryIcon from './icons/HistoryIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';

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
            setPlayer(data.player);
            setTeam(data.team);
            setCompetitionId(data.competitionId);
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-1">
                <Card className="shadow-lg animate-fade-in sticky top-20">
                     <div className="relative">
                        <div className="h-32 bg-gradient-to-br from-primary to-primary-dark rounded-t-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-black/10"></div>
                             <div className="absolute top-3 right-3 z-10">
                                <div className="relative">
                                    <button
                                        onClick={handleShare}
                                        className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                                        aria-label={`Share ${player.name}'s profile`}
                                    >
                                        <ShareIcon className="w-5 h-5" />
                                    </button>
                                    {copied && (
                                        <span className="absolute bottom-full mb-2 -right-2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10 animate-fade-in-tooltip">
                                            Link Copied!
                                            <div className="absolute top-full right-3 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center -mt-16 relative z-10">
                            <img src={player.photoUrl} alt={player.name} className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover bg-white" />
                        </div>
                     </div>
                     <CardContent className="p-6 text-center pt-2">
                         <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mt-2">{player.position}</p>
                         <h1 className="text-2xl font-bold font-display text-gray-900 mb-1">{player.name}</h1>
                         <div className="flex justify-center items-baseline gap-1 mb-4">
                            <span className="text-4xl font-extrabold font-display text-gray-200 select-none">#{player.number}</span>
                         </div>
                         
                         <Link to={`/competitions/${competitionId}/teams/${team.id}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors group">
                            <img src={team.crestUrl} alt={team.name} className="w-6 h-6 object-contain" />
                            <span className="font-semibold text-sm text-gray-700 group-hover:text-primary">{team.name}</span>
                         </Link>
                     </CardContent>
                </Card>
            </div>
            
            <div className="md:col-span-2 space-y-8">
                 {/* Biography */}
                 <Card className="shadow-lg animate-fade-in" style={{animationDelay: '100ms'}}>
                    <CardContent className="p-6">
                        <h2 className="text-xl font-bold font-display mb-4 text-gray-800">Biography</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex flex-col">
                                <span className="text-gray-500 text-xs uppercase tracking-wide font-semibold">Nationality</span>
                                <span className="font-medium text-gray-900">{player.bio.nationality}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-500 text-xs uppercase tracking-wide font-semibold">Age</span>
                                <span className="font-medium text-gray-900">{player.bio.age} years</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-500 text-xs uppercase tracking-wide font-semibold">Height</span>
                                <span className="font-medium text-gray-900">{player.bio.height}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-500 text-xs uppercase tracking-wide font-semibold">Club</span>
                                <span className="font-medium text-gray-900">{player.club || team.name}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                 
                 {/* Player Statistics */}
                 <Card className="shadow-lg animate-fade-in" style={{animationDelay: '200ms'}}>
                    <CardContent className="p-6">
                        <h2 className="text-xl font-bold font-display mb-6 flex items-center gap-2 text-gray-800">
                            <BarChartIcon className="w-6 h-6 text-primary" />
                            Player Statistics
                        </h2>
                         <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gray-50 p-5 rounded-xl text-center border border-gray-100 transition-all hover:border-primary/30">
                                <span className="block text-4xl font-extrabold text-gray-900 mb-1">{player.stats.appearances}</span>
                                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Appearances</span>
                            </div>
                            <div className="bg-gray-50 p-5 rounded-xl text-center border border-gray-100 transition-all hover:border-primary/30">
                                <span className="block text-4xl font-extrabold text-primary mb-1">{player.stats.goals}</span>
                                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Goals</span>
                            </div>
                            <div className="bg-gray-50 p-5 rounded-xl text-center border border-gray-100 transition-all hover:border-primary/30">
                                <span className="block text-4xl font-extrabold text-accent mb-1">{player.stats.assists}</span>
                                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Assists</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                 {/* Transfer History */}
                 <Card className="shadow-lg animate-fade-in" style={{animationDelay: '300ms'}}>
                    <CardContent className="p-6">
                        <h2 className="text-xl font-bold font-display mb-4 flex items-center gap-2 text-gray-800">
                            <HistoryIcon className="w-6 h-6 text-primary" />
                            Transfer History
                        </h2>
                        <div className="overflow-hidden rounded-lg border border-gray-200">
                            {player.transferHistory.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100 text-gray-600 font-semibold uppercase text-xs tracking-wide">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Season/Year</th>
                                            <th className="px-4 py-3 text-left">From</th>
                                            <th className="px-4 py-3 text-center w-10"></th>
                                            <th className="px-4 py-3 text-left">To</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {player.transferHistory.map((transfer, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 font-mono text-gray-600 font-medium">{transfer.year}</td>
                                                <td className="px-4 py-3 font-medium text-gray-800">{transfer.from}</td>
                                                <td className="px-4 py-3 text-center text-gray-400">
                                                    <ArrowRightIcon className="w-4 h-4 mx-auto" />
                                                </td>
                                                <td className="px-4 py-3 font-medium text-primary">{transfer.to}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-8 text-center text-gray-500 bg-gray-50">
                                    <p className="italic">No transfer history records available for this player.</p>
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
