import React from 'react';
import { ScoutedPlayer } from '../data/scouting';
import { Card, CardContent } from './ui/Card';
import VideoPlayer from './VideoPlayer';
import Button from './ui/Button';
import MailIcon from './icons/MailIcon';

const PlayerDetailView: React.FC<{ player: ScoutedPlayer }> = ({ player }) => {
  return (
    <Card className="shadow-lg animate-fade-in sticky top-20">
        <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <img 
                    src={player.photoUrl} 
                    alt={player.name} 
                    className="w-full h-auto aspect-square object-cover rounded-lg shadow-md lg:col-span-1" 
                />
                <div className="lg:col-span-2">
                    <h2 className="text-3xl font-display font-bold text-gray-800">{player.name}</h2>
                    <p className="font-semibold text-gray-600">{player.position} &bull; {player.age} years old &bull; {player.region}</p>
                    <div className="mt-4">
                        <h4 className="font-bold text-sm mb-2 text-gray-700">Key Strengths</h4>
                        <div className="flex flex-wrap gap-2">
                            {player.strengths.map(strength => (
                                <span key={strength} className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">{strength}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <h4 className="text-xl font-bold font-display mb-2">Scouting Report</h4>
                <p className="text-gray-600 leading-relaxed text-sm">{player.bio}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <h4 className="text-xl font-bold font-display mb-2">Highlight Reel</h4>
                    <VideoPlayer src={player.videoUrl} title={`${player.name}'s Highlights`} />
                </div>
                 <div>
                    <h4 className="text-xl font-bold font-display mb-2">Performance Stats</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        {player.stats.map(stat => (
                            <div key={stat.label} className="flex justify-between items-center text-sm border-b border-gray-200 pb-2 last:border-b-0">
                                <span className="text-gray-600">{stat.label}</span>
                                <span className="font-bold text-gray-800">{stat.value}</span>
                            </div>
                        ))}
                    </div>
                     <a href={`mailto:${player.contactEmail}?subject=Scouting Inquiry: ${player.name}`} className="w-full">
                        <Button className="w-full mt-4 bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 inline-flex items-center justify-center gap-2">
                            <MailIcon className="w-5 h-5" />
                            Contact Agent/Club
                        </Button>
                    </a>
                </div>
            </div>
        </CardContent>
    </Card>
  );
};

export default PlayerDetailView;