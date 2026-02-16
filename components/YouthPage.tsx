
import React, { useState, useEffect } from 'react';
import { YouthLeague, youthData as mockYouthData } from '../data/youth';
import { fetchYouthData, fetchAllCompetitions } from '../services/api';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import TrophyIcon from './icons/TrophyIcon';
import SchoolIcon from './icons/SchoolIcon';
import GlobeIcon from './icons/GlobeIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import Spinner from './ui/Spinner';
import { superNormalize } from '../services/utils';

const YouthPage: React.FC = () => {
  const [leagues, setLeagues] = useState<YouthLeague[]>([]);
  const [regionalYouthLeagues, setRegionalYouthLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const ALLOWED_IDS = [
    'u20-elite-league', 
    'schools', 
    'build-it-u13-national', 
    'hub-hardware-u17-competition', 
    'u13-grassroots-national-football', 
    'u15-national-football',
    'u17-national-football', 
    'u19-national-football'
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
          const [data, allComps] = await Promise.all([
              fetchYouthData(),
              fetchAllCompetitions()
          ]);
          
          let filteredData = data.filter(l => ALLOWED_IDS.includes(l.id));
          
          if (filteredData.length < ALLOWED_IDS.length) {
              const missingIds = ALLOWED_IDS.filter(id => !filteredData.find(f => f.id === id));
              const extras = mockYouthData.filter(m => missingIds.includes(m.id));
              filteredData = [...filteredData, ...extras];
          }

          const sortedData = [...filteredData].sort((a, b) => ALLOWED_IDS.indexOf(a.id) - ALLOWED_IDS.indexOf(b.id));
          setLeagues(sortedData);

          // Find regional youth leagues
          const regionalYouth = Object.entries(allComps)
            .filter(([id, comp]) => {
                const catId = comp.categoryId || '';
                const name = comp.name.toLowerCase();
                return (
                    (catId.startsWith('u') || catId.includes('development') || catId.includes('grassroots')) &&
                    !ALLOWED_IDS.includes(id) // Don't duplicate the main ones
                );
            })
            .map(([id, comp]) => ({ ...comp, id }));
          setRegionalYouthLeagues(regionalYouth);

      } catch (e) {
          console.error("Error loading youth data", e);
          setLeagues(mockYouthData.filter(l => ALLOWED_IDS.includes(l.id)));
      } finally {
          setLoading(false);
      }
    };
    loadData();
  }, []);

  const getIconForLeague = (id: string) => {
      if (id.includes('u20')) return <TrophyIcon className="w-8 h-8 text-yellow-400" />;
      if (id.includes('u19')) return <TrophyIcon className="w-8 h-8 text-indigo-400" />;
      if (id.includes('u17')) return <TrophyIcon className="w-8 h-8 text-blue-400" />;
      if (id.includes('u15')) return <TrophyIcon className="w-8 h-8 text-teal-400" />;
      if (id === 'schools') return <SchoolIcon className="w-8 h-8 text-orange-600" />;
      return <GlobeIcon className="w-8 h-8 text-blue-600" />;
  };

  const getStyleForLeague = (id: string) => {
      if (id === 'u20-elite-league') return "bg-gradient-to-br from-blue-900 to-blue-700 text-white shadow-lg";
      if (id.includes('national-football')) return "bg-white border-l-8 border-primary shadow-md hover:border-l-accent";
      if (id === 'schools') return "bg-white border-l-8 border-orange-500 shadow-md";
      return "bg-white border-l-8 border-slate-200 shadow-md";
  };
  
  const getPathForLeague = (id: string) => {
      switch(id) {
          case 'u20-elite-league': return "/youth/u20";
          case 'schools': return "/schools";
          case 'build-it-u13-national': return "/youth/build-it-u13";
          case 'hub-hardware-u17-competition': return "/youth/hub-u17";
          case 'u13-grassroots-national-football': return "/youth/grassroots-u13";
          case 'u15-national-football': return "/youth/national-u15";
          case 'u17-national-football': return "/youth/national-u17";
          case 'u19-national-football': return "/youth/u19";
          default: return "/youth";
      }
  };

  return (
    <div className="bg-gray-50 py-12 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-display font-black text-blue-800 mb-4 uppercase tracking-tighter">
            Youth Football Hub
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto font-medium">
            Explore the official developmental pathways of Eswatini. From grassroots festivals to the elite U-20 professional pipeline.
          </p>
        </div>

        {loading ? (
            <div className="flex justify-center py-20"><Spinner /></div>
        ) : (
            <div className="space-y-20">
                <section>
                    <h2 className="text-2xl font-display font-black text-slate-800 mb-8 uppercase tracking-tight border-b pb-2">National Development Hubs</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                        {leagues.map((league) => (
                            <Link key={league.id} to={getPathForLeague(league.id)} className="group block">
                                <Card className={`h-full hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${getStyleForLeague(league.id)}`}>
                                    <CardContent className="p-8 flex flex-col h-full justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-3 bg-slate-900/5 rounded-2xl backdrop-blur-sm shadow-inner group-hover:scale-110 transition-transform">
                                                    {getIconForLeague(league.id)}
                                                </div>
                                                <h2 className={`text-xl font-black font-display uppercase tracking-tight ${league.id === 'u20-elite-league' ? 'text-white' : 'text-gray-900'}`}>{league.name}</h2>
                                            </div>
                                            <p className={`${league.id === 'u20-elite-league' ? 'text-blue-100' : 'text-gray-600'} mb-8 line-clamp-3 text-sm leading-relaxed`}>
                                                {league.description}
                                            </p>
                                        </div>
                                        <div className={`flex items-center font-black text-[10px] uppercase tracking-[0.2em] ${league.id === 'u20-elite-league' ? 'text-yellow-400' : 'text-primary'} group-hover:gap-2 transition-all`}>
                                            Open Competition Center <ArrowRightIcon className="w-5 h-5 ml-2" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>

                {regionalYouthLeagues.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-display font-black text-slate-800 mb-8 uppercase tracking-tight border-b pb-2">Live Regional Competitions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {regionalYouthLeagues.map(league => (
                                <Link key={league.id} to={`/region-hub/${league.id}`} className="group">
                                    <Card className="hover:shadow-lg transition-all rounded-2xl border border-gray-100 overflow-hidden">
                                        <CardContent className="p-5">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center p-1 border border-gray-100 group-hover:bg-primary transition-colors">
                                                    {league.logoUrl ? <img src={league.logoUrl} className="max-h-full max-w-full object-contain" /> : <TrophyIcon className="w-5 h-5 text-gray-300 group-hover:text-white"/>}
                                                </div>
                                                <h3 className="font-bold text-sm text-gray-900 group-hover:text-primary truncate">{league.name}</h3>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-gray-400">
                                                <GlobeIcon className="w-3 h-3"/> {league.region || 'National'}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default YouthPage;
