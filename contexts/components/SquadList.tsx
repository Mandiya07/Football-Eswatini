
import React from 'react';
import { Link } from 'react-router-dom';
import { Player } from '../data/teams';
import { Card, CardContent } from './ui/Card';
import UserIcon from './icons/UserIcon';

interface SquadListProps {
    players: Player[];
}

const SquadList: React.FC<SquadListProps> = ({ players }) => {
    
    // Safely handle undefined/null props and filter out any invalid entries within the array.
    const validPlayers = (players || []).filter((p): p is Player => !!p);

    const sortedPlayers = [...validPlayers].sort((a, b) => {
        const positionOrder: Record<Player['position'], number> = {
            'Goalkeeper': 1, 'Defender': 2, 'Midfielder': 3, 'Forward': 4,
        };
        // Handle cases where a player might have an unexpected position value
        const posA = positionOrder[a.position] || 99;
        const posB = positionOrder[b.position] || 99;

        if (posA !== posB) {
            return posA - posB;
        }
        
        // Treat 0 as "no number" and put at end
        const numA = a.number === 0 ? 999 : a.number;
        const numB = b.number === 0 ? 999 : b.number;
        
        return numA - numB;
    });
    
    if (sortedPlayers.length === 0) {
        return (
            <Card>
                <CardContent>
                    <p className="text-gray-500 text-center py-4">No players listed for this squad.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {sortedPlayers.map(player => (
                <Link key={player.id} to={`/players/${player.id}`} className="group block text-center">
                    <Card className="overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                        <div className="relative bg-gray-100">
                            {player.photoUrl ? (
                                <img src={player.photoUrl} alt={player.name} className="w-full h-auto aspect-square object-cover" />
                            ) : (
                                <div className="w-full h-auto aspect-square flex items-center justify-center bg-gray-200 text-gray-400">
                                    <UserIcon className="w-16 h-16" />
                                </div>
                            )}
                            {player.number > 0 && (
                                <div className="absolute top-2 right-2 bg-black/50 text-white font-bold text-lg w-8 h-8 flex items-center justify-center rounded-full ring-2 ring-white/50">{player.number}</div>
                            )}
                        </div>
                        <CardContent className="p-3">
                            <p className="font-semibold text-sm truncate group-hover:text-blue-600">{player.name}</p>
                            <p className="text-xs text-gray-500">{player.position}</p>
                            <p className="text-xs text-gray-500 font-medium">{player.club}</p>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
};

export default SquadList;
