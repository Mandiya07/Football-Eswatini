
import React, { useState, useEffect, useMemo } from 'react';
import { YouthLeague } from '../data/youth';
import { fetchYouthData } from '../services/api';
import YouthSection from './YouthSection';
import SectionLoader from './SectionLoader';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import TrophyIcon from './icons/TrophyIcon';
import SchoolIcon from './icons/SchoolIcon';
import GlobeIcon from './icons/GlobeIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import Spinner from './ui/Spinner';
import ShieldIcon from './icons/ShieldIcon';

const YouthPage: React.FC = () => {
  const [youthData, setYouthData] = useState<YouthLeague[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
          const data = await fetchYouthData();
          setYouthData(data);
      } catch (e) {
          console.error("Error loading youth data", e);
      } finally {
          setLoading(false);
      }
    };
    loadData();
  }, []);

  // Helper to get specific config for core legacy competitions
  const getLeagueConfig = (leagueId: string) => {
    switch (leagueId) {
        case 'u20-elite-league':
            return {
                path: '/youth/u20',
                Icon: TrophyIcon,
                color: 'bg-gradient-to-br from-blue-900 to-blue-700 text-white',
                iconColor: 'text-yellow-400',
                iconBg: 'bg-white/20'
            };
        case 'schools':
            return {
                path: '/schools',
                Icon: SchoolIcon,
                color: 'bg-white border-l-8 border-orange-500',
                iconColor: 'text-orange-600',
                iconBg: 'bg-orange-100'
            };
        case 'hub-hardware-u17':
            return {
                path: '/youth/hub-u17',
                Icon: TrophyIcon,
                color: 'bg-white border-l-8 border-yellow-500',
                iconColor: 'text-yellow-600',
                iconBg: 'bg-yellow-100'
            };
        case 'build-it-u13':
            return {
                path: '/youth/build-it-u13',
                Icon: GlobeIcon,
                color: 'bg-white border-l-8 border-red-500',
                iconColor: 'text-red-600',
                iconBg: 'bg-red-100'
            };
        default:
            return {
                path: `/youth/competition/${leagueId}`,
                Icon: ShieldIcon,
                color: 'bg-white border border-gray-100 hover:border-blue-200',
                iconColor: 'text-blue-600',
                iconBg: 'bg-blue-50'
            };
    }
  };

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
            Youth Football Hub
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Developing the next generation of Eswatini talent. Explore our youth leagues and development programs.
          </p>
        </div>

        {loading ? (
            <div className="flex justify-center py-20"><Spinner /></div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                {youthData.map((league) => {
                    const config = getLeagueConfig(league.id);
                    const Icon = config.Icon;

                    return (
                        <Link key={league.id} to={config.path} className="group block h-full">
                            <Card className={`h-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden ${config.color}`}>
                                <CardContent className="p-8 flex flex-col h-full justify-between">
                                    <div>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className={`p-3 rounded-full ${config.iconBg} flex-shrink-0`}>
                                                {league.logoUrl ? (
                                                    <img src={league.logoUrl} alt="" className="w-8 h-8 object-contain" />
                                                ) : (
                                                    <Icon className={`w-8 h-8 ${config.iconColor}`} />
                                                )}
                                            </div>
                                            <h2 className="text-2xl font-bold font-display leading-tight">{league.name}</h2>
                                        </div>
                                        <p className={`line-clamp-3 ${config.path === '/youth/u20' ? 'text-blue-100' : 'text-gray-600'}`}>
                                            {league.description}
                                        </p>
                                    </div>
                                    <div className={`flex items-center font-bold mt-6 group-hover:gap-2 transition-all ${config.path === '/youth/u20' ? 'text-yellow-400' : 'text-blue-600'}`}>
                                        View Hub <ArrowRightIcon className="w-5 h-5 ml-2" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
                
                {youthData.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-500 italic">No youth competitions found in the database.</p>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default YouthPage;
