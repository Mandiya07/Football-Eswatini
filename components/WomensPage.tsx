import React from 'react';
import NewsSection from './News';
import Logs from './Logs';
import Fixtures from './Fixtures';
import { Link } from 'react-router-dom';
import SparklesIcon from './icons/SparklesIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import WomanIcon from './icons/WomanIcon';

const WomensPage: React.FC = () => {
  const WOMENS_LEAGUE_ID = 'eswatini-women-football-league';

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        
        <Link to="/partnerships" className="block mb-10 group no-print">
            <div className="bg-gradient-to-r from-pink-600 to-rose-700 p-4 rounded-3xl shadow-lg text-white flex flex-col md:flex-row items-center justify-between gap-4 border border-white/10 group-hover:scale-[1.01] transition-all">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-md">
                        <SparklesIcon className="w-6 h-6 text-yellow-300" />
                    </div>
                    <div>
                        <h4 className="font-black text-lg leading-tight uppercase tracking-tight">EWFA Strategic Partnership</h4>
                        <p className="text-pink-100 text-sm">Grow with us. Learn how we are digitizing and elevating Eswatini Women's Football.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest bg-white/10 px-6 py-3 rounded-xl group-hover:bg-white/20 transition-all border border-white/5">
                    View Proposal <ArrowRightIcon className="w-4 h-4" />
                </div>
            </div>
        </Link>

        <div className="text-center mb-16">
          <div className="inline-block p-4 bg-pink-100 rounded-full mb-4">
            <WomanIcon className="w-12 h-12 text-pink-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
            Women's Football
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto font-medium leading-relaxed">
            The central hub for news, fixtures, and elite competition coverage for Women's Football in the Kingdom of Eswatini.
          </p>
        </div>

        <div className="space-y-20">
          <NewsSection 
            category="Womens" 
            layout="hero-split" 
            title="Women's Game Today"
            limit={8}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="w-full space-y-6">
                 <h2 className="text-2xl font-display font-black text-gray-800 uppercase tracking-tight border-b-4 border-pink-500/20 pb-2">Fixtures & Results</h2>
                 <Fixtures showSelector={false} defaultCompetition={WOMENS_LEAGUE_ID} maxHeight="max-h-[800px]" />
            </div>
            <div className="w-full space-y-6">
                 <h2 className="text-2xl font-display font-black text-gray-800 uppercase tracking-tight border-b-4 border-pink-500/20 pb-2">League Standings</h2>
                 <Logs showSelector={false} defaultLeague={WOMENS_LEAGUE_ID} maxHeight="max-h-[800px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WomensPage;