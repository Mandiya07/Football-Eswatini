
import React from 'react';
import NewsSection from './News';
import Logs from './Logs';
import Fixtures from './Fixtures';
import MedalIcon from './icons/MedalIcon';

const NationalFirstDivisionPage: React.FC = () => {
  const NFD_LEAGUE_ID = 'national-first-division';

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="text-center mb-12">
           <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
            <MedalIcon className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-900 mb-2">
            National First Division
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            The gateway to the elite. Follow the intense battle for promotion to the Premier League.
          </p>
        </div>

        <div className="space-y-16">
          <NewsSection /> {/* Defaults to latest headlines */}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="w-full">
                 <h2 className="text-2xl font-display font-bold mb-4 text-center lg:text-left text-gray-800">Fixtures & Results</h2>
                 <Fixtures showSelector={false} defaultCompetition={NFD_LEAGUE_ID} maxHeight="max-h-[800px]" />
            </div>
            <div className="w-full">
                 <h2 className="text-2xl font-display font-bold mb-4 text-center lg:text-left text-gray-800">League Standings</h2>
                 <Logs showSelector={false} defaultLeague={NFD_LEAGUE_ID} maxHeight="max-h-[800px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NationalFirstDivisionPage;
