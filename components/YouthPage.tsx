
import React, { useState, useEffect } from 'react';
import { YouthLeague } from '../data/youth';
import { fetchYouthData } from '../services/api';
import YouthSection from './YouthSection';
import SectionLoader from './SectionLoader';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import TrophyIcon from './icons/TrophyIcon';
import SchoolIcon from './icons/SchoolIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';

const YouthPage: React.FC = () => {
  const [youthData, setYouthData] = useState<YouthLeague[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
          const data = await fetchYouthData();
          // Only show U17 and U13 as generic sections now, as Schools has its own page
          const order = ['u17', 'u13']; 
          const sortedData = [...data].filter(l => order.includes(l.id)).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
          setYouthData(sortedData);
      } catch (e) {
          console.error("Error loading youth data", e);
      } finally {
          setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
            Youth Football Spotlight
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Developing the next generation of Eswatini talent. Explore our youth leagues and development programs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* U-20 ELITE LEAGUE LINK */}
            <Link to="/youth/u20" className="group block">
                <Card className="h-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-900 to-blue-700 text-white">
                    <CardContent className="p-8 flex flex-col h-full justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                    <TrophyIcon className="w-8 h-8 text-yellow-400" />
                                </div>
                                <h2 className="text-3xl font-bold font-display">U-20 Elite League</h2>
                            </div>
                            <p className="text-blue-100 mb-6">
                                The premier development league featuring the U-20 squads of all MTN Premier League clubs. Follow the future stars in a full competitive season.
                            </p>
                        </div>
                        <div className="flex items-center text-yellow-400 font-bold group-hover:gap-2 transition-all">
                            View League Hub <ArrowRightIcon className="w-5 h-5 ml-2" />
                        </div>
                    </CardContent>
                </Card>
            </Link>

            {/* SCHOOLS FOOTBALL LINK */}
            <Link to="/schools" className="group block">
                 <Card className="h-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white border-l-8 border-orange-500">
                    <CardContent className="p-8 flex flex-col h-full justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-orange-100 rounded-full">
                                    <SchoolIcon className="w-8 h-8 text-orange-600" />
                                </div>
                                <h2 className="text-3xl font-bold font-display text-gray-800">Instacash Schools Tournament</h2>
                            </div>
                            <p className="text-gray-600 mb-6">
                                The national school football competition developing young talent across all four regions. Featuring top schools like St. Marks and Salesian High.
                            </p>
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 group-hover:bg-orange-100 transition-colors">
                                <h4 className="font-bold text-orange-800 text-sm uppercase mb-2">Highlights</h4>
                                <ul className="space-y-1 text-sm text-gray-700">
                                    <li>• Regional Qualifiers & Top 16 Draw</li>
                                    <li>• National Knockout Stages</li>
                                    <li>• Full Kit Sponsorship & Prizes</li>
                                </ul>
                            </div>
                        </div>
                        <div className="flex items-center text-orange-600 font-bold mt-6 group-hover:gap-2 transition-all">
                            View Tournament <ArrowRightIcon className="w-5 h-5 ml-2" />
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </div>

        {loading ? (
          <SectionLoader />
        ) : (
          <div className="space-y-16">
            {youthData.map(league => (
              <YouthSection key={league.id} league={league} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default YouthPage;