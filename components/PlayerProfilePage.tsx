
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
// FIX: Import 'fetchPlayerById' which is now correctly exported from the API service.
import { fetchPlayerById } from '../services/api';
import { Player, Team } from '../data/teams';
import { Card, CardContent } from './ui/Card';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ShareIcon from './icons/ShareIcon';
import Spinner from './ui/Spinner';

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

  // Mock calculation for career stats based on season stats for demonstration
  const careerStats = {
      appearances: Math.floor(player.stats.appearances * (1 + Math.random() * 5) + 20),
      goals: Math.floor(player.stats.goals * (1 + Math.random() * 5) + 5),
      assists: Math.floor(player.stats.assists * (1 + Math.random() * 5) + 5),
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
                        <img src={player.photoUrl} alt={player.name} className="w-full h-auto aspect-square object-cover rounded-t-2xl" />
                         <div className="absolute top-3 right-3">
                            <div className="relative">
                                <button
                                    onClick={handleShare}
                                    className="bg-white/70 backdrop-blur-sm text-gray-700 hover:text-blue-600 p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md"
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
                     <CardContent className="p-4 text-center">
                         <p className="text-gray-500 text-sm">{player.position}</p>
                         <h1 className="text-2xl font-bold font-display">{player.name}</h1>
                         <p className="text-6xl font-extrabold font-display text-gray-200 -mt-2">{player.number}</p>
                         <Link to={`/competitions/${competitionId}/teams/${team.id}`} className="inline-flex items-center gap-2 mt-2 group">
                            <img src={team.crestUrl} alt={team.name} className="w-6 h-6 object-contain" />
                            <span className="font-semibold group-hover:underline">{team.name}</span>
                         </Link>
                     </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2 space-y-8">
                 <Card className="shadow-lg animate-fade-in" style={{animationDelay: '100ms'}}>
                    <CardContent className="p-6">
                        <h2 className="text-xl font-bold font-display mb-4">Biography</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="font-semibold text-gray-600">Nationality</div><div>{player.bio.nationality}</div>
                            <div className="font-semibold text-gray-600">Age</div><div>{player.bio.age}</div>
                            <div className="font-semibold text-gray-600">Height</div><div>{player.bio.height}</div>
                        </div>
                    </CardContent>
                </Card>
                 
                 {/* Season Stats */}
                 <Card className="shadow-lg animate-fade-in" style={{animationDelay: '200ms'}}>
                    <CardContent className="p-6">
                        <h2 className="text-xl font-bold font-display mb-4">Season Stats</h2>
                         <div className="grid grid-cols-3 gap-4 text-center">
                            <div><p className="text-3xl font-bold">{player.stats.appearances}</p><p className="text-sm text-gray-600">Appearances</p></div>
                            <div><p className="text-3xl font-bold">{player.stats.goals}</p><p className="text-sm text-gray-600">Goals</p></div>
                            <div><p className="text-3xl font-bold">{player.stats.assists}</p><p className="text-sm text-gray-600">Assists</p></div>
                        </div>
                    </CardContent>
                </Card>

                 {/* Career Stats - New Section */}
                 <Card className="shadow-lg animate-fade-in" style={{animationDelay: '250ms'}}>
                    <CardContent className="p-6">
                        <h2 className="text-xl font-bold font-display mb-4">Career Stats (All Competitions)</h2>
                         <div className="grid grid-cols-3 gap-4 text-center">
                            <div><p className="text-3xl font-bold text-primary">{careerStats.appearances}</p><p className="text-sm text-gray-600">Appearances</p></div>
                            <div><p className="text-3xl font-bold text-primary">{careerStats.goals}</p><p className="text-sm text-gray-600">Goals</p></div>
                            <div><p className="text-3xl font-bold text-primary">{careerStats.assists}</p><p className="text-sm text-gray-600">Assists</p></div>
                        </div>
                    </CardContent>
                </Card>

                 <Card className="shadow-lg animate-fade-in" style={{animationDelay: '300ms'}}>
                    <CardContent className="p-6">
                        <h2 className="text-xl font-bold font-display mb-4">Transfer History</h2>
                        <div className="overflow-x-auto">
                            {player.transferHistory.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead className="text-left text-gray-500"><tr><th className="p-2">Year</th><th className="p-2">From</th><th className="p-2">To</th></tr></thead>
                                    <tbody>
                                        {player.transferHistory.map((transfer, idx) => (
                                            <tr key={idx} className="border-t">
                                                <td className="p-2 font-semibold">{transfer.year}</td>
                                                <td className="p-2">{transfer.from}</td>
                                                <td className="p-2">{transfer.to}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : <p className="text-sm text-gray-500">No transfer history available.</p>}
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
