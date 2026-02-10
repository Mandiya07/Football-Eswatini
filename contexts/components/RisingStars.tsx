import React from 'react';
import { Card, CardContent } from './ui/Card';
import { RisingStarPlayer } from '../data/youth';
import TrendingUpIcon from './icons/TrendingUpIcon';

interface RisingStarsProps {
  players: RisingStarPlayer[];
}

const RisingStars: React.FC<RisingStarsProps> = ({ players }) => {
  if (!players || players.length === 0) return null;

  return (
    <div>
        <div className="flex items-center gap-3 mb-6">
            <TrendingUpIcon className="w-7 h-7 text-green-600" />
            <h3 className="text-2xl font-bold font-display text-green-700">Rising Stars to Watch</h3>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {players.map(player => (
          <Card key={player.id} className="bg-gradient-to-br from-white to-green-50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 flex flex-col sm:flex-row group">
            <div className="sm:w-2/5 overflow-hidden">
                <img src={player.photoUrl} alt={player.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            </div>
            <div className="sm:w-3/5 p-5 flex flex-col">
                <div>
                    <p className="font-bold text-xl text-gray-900 font-display">{player.name}</p>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{player.position} &bull; Age {player.age}</p>
                    <p className="text-sm font-medium text-blue-600 mt-1">{player.team}</p>
                </div>
                <div className="mt-4 border-t pt-3 flex-grow">
                    <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Scouting Report</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{player.bio}</p>
                </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RisingStars;