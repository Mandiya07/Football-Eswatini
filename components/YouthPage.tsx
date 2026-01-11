
import React, { useState, useEffect } from 'react';
import { YouthLeague } from '../data/youth';
import { fetchYouthData } from '../services/api';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import TrophyIcon from './icons/TrophyIcon';
import SchoolIcon from './icons/SchoolIcon';
import GlobeIcon from './icons/GlobeIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import Spinner from './ui/Spinner';

const YouthPage: React.FC = () => {
  const [leagues, setLeagues] = useState<YouthLeague[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
          const data = await fetchYouthData();
          // Sort to put known hubs at the top if they exist
          const order = ['u20-elite-league', 'hub-hardware-u17', 'schools', 'build-it-u13']; 
          const sortedData = [...data].sort((a, b) => {
              const idxA = order.indexOf(a.id);
              const idxB = order.indexOf(b.id);
              if (idxA !== -1 && idxB !== -1) return idxA - idxB;
              if (idxA !== -1) return -1;
              if (idxB !== -1) return 1;
              return a.name.localeCompare(b.name);
          });
          setLeagues(sortedData);
      } catch (e) {
          console.error("Error loading youth data", e);
      } finally {
          setLoading(false);
      }
    };
    loadData();
  }, []);

  const getIconForLeague = (id: string) => {
      if (id.includes('u20')) return <TrophyIcon className="w-8 h-8 text-yellow-400" />;
      if (id.includes('school')) return <SchoolIcon className="w-8 h-8 text-orange-600" />;
      if (id.includes('u17')) return <TrophyIcon className="w-8 h-8 text-yellow-600" />;
      return <GlobeIcon className="w-8 h-8 text-blue-600" />;
  };

  const getStyleForLeague = (id: string) => {
      if (id === 'u20-elite-league') return "bg-gradient-to-br from-blue-900 to-blue-700 text-white";
      if (id === 'schools') return "bg-white border-l-8 border-orange-500";
      if (id === 'hub-hardware-u17') return "bg-white border-l-8 border-yellow-500";
      if (id === 'build-it-u13') return "bg-white border-l-8 border-red-500";
      return "bg-white border-l-8 border-blue-500";
  };
  
  const getPathForLeague = (id: string) => {
      if (id === 'u20-elite-league') return "/youth/u20";
      if (id === 'schools') return "/schools";
      if (id === 'hub-hardware-u17') return "/youth/hub-u17";
      if (id === 'build-it-u13') return "/youth/build-it-u13";
      // Generic hubs can link to a list or similar if needed, 
      // for now we link them back to youth to avoid 404s for unconfigured routes
      return "/youth"; 
  };

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
            Youth Football Hub
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Developing the next generation of Eswatini talent. Explore active youth leagues, tournaments, and elite development programs.
          </p>
        </div>

        {loading ? (
            <div className="flex justify-center py-20"><Spinner /></div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                {leagues.map((league) => (
                    <Link key={league.id} to={getPathForLeague(league.id)} className="group block">
                        <Card className={`h-full shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 ${getStyleForLeague(league.id)}`}>
                            <CardContent className="p-8 flex flex-col h-full justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm shadow-inner">
                                            {getIconForLeague(league.id)}
                                        </div>
                                        <h2 className={`text-2xl font-black font-display ${league.id === 'u20-elite-league' ? 'text-white' : 'text-gray-900'}`}>{league.name}</h2>
                                    </div>
                                    <p className={`${league.id === 'u20-elite-league' ? 'text-blue-100' : 'text-gray-600'} mb-6 line-clamp-3 text-sm leading-relaxed`}>
                                        {league.description}
                                    </p>
                                </div>
                                <div className={`flex items-center font-black text-xs uppercase tracking-widest ${league.id === 'u20-elite-league' ? 'text-yellow-400' : 'text-primary'} group-hover:gap-2 transition-all`}>
                                    View Competition <ArrowRightIcon className="w-5 h-5 ml-2" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
                {leagues.length === 0 && (
                    <div className="col-span-full text-center py-20 border-2 border-dashed rounded-3xl bg-white">
                        <p className="text-gray-400 font-bold">No active youth competitions found.</p>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default YouthPage;
