
import React from 'react';
import NewsSection from './News';
import Logs from './Logs';
import Fixtures from './Fixtures';
import { Link } from 'react-router-dom';
import SparklesIcon from './icons/SparklesIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';

const WomensPage: React.FC = () => {
  // Explicitly set the competition ID to 'eswatini-women-football-league' to ensure all data
  // for fixtures, results, and logs on this page is sourced from the Eswatini Women Football League.
  const WOMENS_LEAGUE_ID = 'eswatini-women-football-league';

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        
        {/* Partnership Proposal Banner */}
        <Link to="/partnerships" className="block mb-10 group">
            <div className="bg-gradient-to-r from-pink-600 to-rose-700 p-4 rounded-2xl shadow-lg text-white flex flex-col md:flex-row items-center justify-between gap-4 border border-white/10 group-hover:scale-[1.01] transition-all">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                        <SparklesIcon className="w-6 h-6 text-yellow-300" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg leading-tight">EWFA Strategic Partnership</h4>
                        <p className="text-pink-100 text-sm">Grow with us. Learn how we are digitizing and elevating Eswatini Women's Football.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest bg-white/10 px-4 py-2 rounded-xl group-hover:bg-white/20 transition-all">
                    Partner with Us <ArrowRightIcon className="w-4 h-4" />
                </div>
            </div>
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
            Women's Football
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            The central hub for all news, fixtures, and league standings in women's football in Eswatini.
          </p>
        </div>

        <div className="space-y-16">
          {/* Ensure the full Trending layout is shown by NOT passing limit=3 */}
          <NewsSection category="Womens" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="w-full">
                 <h2 className="text-2xl font-display font-bold mb-4 text-center lg:text-left">Fixtures & Results</h2>
                 <Fixtures showSelector={false} defaultCompetition={WOMENS_LEAGUE_ID} maxHeight="max-h-[800px]" />
            </div>
            <div className="w-full">
                 <h2 className="text-2xl font-display font-bold mb-4 text-center lg:text-left">League Standings</h2>
                 <Logs showSelector={false} defaultLeague={WOMENS_LEAGUE_ID} maxHeight="max-h-[800px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WomensPage;
