import React from 'react';
import NewsSection from './News';
import Logs from './Logs';
import Fixtures from './Fixtures';
import TrophyIcon from './icons/TrophyIcon';

const PremierLeaguePage: React.FC = () => {
  const PREMIER_LEAGUE_ID = 'mtn-premier-league';

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="text-center mb-12">
           <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
            <TrophyIcon className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-900 mb-2">
            MTN Premier League
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto font-medium">
            The pinnacle of Eswatini football. Follow the giants of the game as they battle for glory, continental qualification, and national pride.
          </p>
        </div>

        <div className="space-y-20">
          <NewsSection 
            layout="hero-split" 
            title="League Pulse" 
            limit={8} 
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="w-full space-y-6">
                 <h2 className="text-2xl font-display font-black text-gray-800 uppercase tracking-tight border-b-4 border-primary/20 pb-2">Fixtures & Results</h2>
                 <Fixtures showSelector={false} defaultCompetition={PREMIER_LEAGUE_ID} maxHeight="max-h-[800px]" />
            </div>
            <div className="w-full space-y-6">
                 <h2 className="text-2xl font-display font-black text-gray-800 uppercase tracking-tight border-b-4 border-primary/20 pb-2">League Standings</h2>
                 <Logs showSelector={false} defaultLeague={PREMIER_LEAGUE_ID} maxHeight="max-h-[800px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremierLeaguePage;