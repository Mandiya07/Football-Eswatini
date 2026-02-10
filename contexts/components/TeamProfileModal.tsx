
import React, { useState } from 'react';
import { Team } from '../data/teams';
import { Card } from './ui/Card';
import XIcon from './icons/XIcon';
import ShareIcon from './icons/ShareIcon';

interface TeamProfileModalProps {
  team: Team;
  onClose: () => void;
}

const StatBox: React.FC<{label: string; value: string | number; color?: string;}> = ({ label, value, color = 'bg-gray-100 text-gray-800' }) => (
    <div className={`${color} p-3 rounded-lg`}>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs uppercase">{label}</p>
    </div>
);


const TeamProfileModal: React.FC<TeamProfileModalProps> = ({ team, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const shareData = {
      title: `Check out ${team.name} on Football Eswatini`,
      text: `View the profile for ${team.name} on the official Football Eswatini app.`,
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
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
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`team-profile-title-${team.id}`}
    >
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
      `}</style>
      <Card 
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors z-10"
          aria-label="Close team profile"
        >
          <XIcon className="w-6 h-6" />
        </button>
        
        <div className="p-6 sm:p-8">
            <header className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                <img src={team.crestUrl} alt={`${team.name} crest`} className="w-24 h-24 object-contain flex-shrink-0 bg-white/80 rounded-full p-2" />
                <div className="flex-grow text-center sm:text-left">
                    <h2 id={`team-profile-title-${team.id}`} className="text-3xl sm:text-4xl font-display font-bold">{team.name}</h2>
                </div>
                <div className="relative self-start sm:self-center">
                    <button
                        onClick={handleShare}
                        className="text-gray-500 hover:text-blue-600 p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        aria-label={`Share profile for ${team.name}`}
                    >
                        <ShareIcon className="w-6 h-6" />
                    </button>
                    {copied && (
                        <span className="absolute bottom-full mb-2 -right-2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10 animate-fade-in-tooltip">
                            Link Copied!
                            <div className="absolute top-full right-3 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                        </span>
                    )}
                </div>
            </header>
            
            <section className="mb-8">
                <h3 className="text-xl font-bold font-display mb-4 border-b pb-2">Season Stats</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <StatBox label="Played" value={team.stats.p} />
                    <StatBox label="Won" value={team.stats.w} color="bg-green-100 text-green-800" />
                    <StatBox label="Drawn" value={team.stats.d} color="bg-yellow-100 text-yellow-800" />
                    <StatBox label="Lost" value={team.stats.l} color="bg-red-100 text-red-800" />
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section>
                    <h3 className="text-xl font-bold font-display mb-4 border-b-2 border-yellow-500 pb-2">Upcoming Fixtures</h3>
                    <ul className="space-y-3 max-h-48 overflow-y-auto pr-2">
                        {team.fixtures.length > 0 ? team.fixtures.map((fixture, index) => (
                            <li key={index} className="text-sm bg-gray-100 p-2 rounded-md flex justify-between">
                                <span className="font-semibold">{fixture.opponent}</span>
                                <span className="text-gray-500">({fixture.date})</span>
                            </li>
                        )) : <p className="text-sm text-gray-500">No upcoming fixtures.</p>}
                    </ul>
                </section>

                <section>
                    <h3 className="text-xl font-bold font-display mb-4 border-b-2 border-green-500 pb-2">Recent Results</h3>
                     <ul className="space-y-3 max-h-48 overflow-y-auto pr-2">
                        {team.results.length > 0 ? team.results.map((result, index) => (
                            <li key={index} className="text-sm bg-gray-100 p-2 rounded-md flex justify-between">
                                <span className="font-semibold">{result.opponent}</span>
                                <span className={`font-bold ${result.score.startsWith('W') ? 'text-green-600' : result.score.startsWith('L') ? 'text-red-600' : 'text-gray-600'}`}>
                                    {result.score}
                                </span>
                            </li>
                        )) : <p className="text-sm text-gray-500">No recent results.</p>}
                    </ul>
                </section>
            </div>
        </div>
      </Card>
    </div>
  );
};

export default TeamProfileModal;