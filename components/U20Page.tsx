
import React, { useState, useEffect } from 'react';
import NewsSection from './News';
import Logs from './Logs';
import Fixtures from './Fixtures';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { Link } from 'react-router-dom';
import { fetchYouthData } from '../services/api';
import { YouthLeague } from '../data/youth';
import YouthArticleSection from './YouthArticleSection';

const U20Page: React.FC = () => {
  const U20_LEAGUE_ID = 'u20-elite-league';
  const [leagueData, setLeagueData] = useState<YouthLeague | null>(null);

  useEffect(() => {
    const load = async () => {
        const data = await fetchYouthData();
        
        let league = data.find(l => l.id === U20_LEAGUE_ID);
        
        if (!league) {
            league = data.find(l => l.id.includes('u20') || l.id.includes('elite'));
        }
        
        if (!league) {
             const searchTerms = ['u20', 'elite league', 'under 20', 'under-20'];
             league = data.find(l => {
                const nameLower = l.name.toLowerCase();
                return searchTerms.some(term => nameLower.includes(term));
            });
        }

        setLeagueData(league || null);
    };
    load();
  }, []);

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="mb-6">
            <Link to="/youth" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Youth Hub
            </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
            {leagueData?.name || "U-20 Elite League"}
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {leagueData?.description || "The premier youth competition where the future stars of the MTN Premier League earn their stripes."}
          </p>
        </div>

        <div className="space-y-16">
          <YouthArticleSection articles={leagueData?.articles || []} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="w-full">
                 <h2 className="text-2xl font-display font-bold mb-4 text-center lg:text-left">Fixtures & Results</h2>
                 <Fixtures showSelector={false} defaultCompetition={U20_LEAGUE_ID} maxHeight="max-h-[800px]" />
            </div>
            <div className="w-full">
                 <h2 className="text-2xl font-display font-bold mb-4 text-center lg:text-left">League Standings</h2>
                 <Logs showSelector={false} defaultLeague={U20_LEAGUE_ID} maxHeight="max-h-[800px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default U20Page;
