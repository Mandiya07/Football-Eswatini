
import React, { useState, useEffect } from 'react';
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

const YouthPage: React.FC = () => {
  const [youthData, setYouthData] = useState<YouthLeague[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
          const data = await fetchYouthData();
          // Keep generic sections if any remain, but most are now pages.
          // Sorting to ensure consistent render if we map them
          const order = ['u20-elite-league', 'hub-hardware-u17', 'schools', 'build-it-u13']; 
          const sortedData = [...data].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
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
                                <h2 className="text-3xl font-bold font-display text-gray-800">Instacash Schools</h2>
                            </div>
                            <p className="text-gray-600 mb-6">
                                The national school football competition developing young talent across all four regions. Featuring top schools like St. Marks and Salesian High.
                            </p>
                        </div>
                        <div className="flex items-center text-orange-600 font-bold mt-6 group-hover:gap-2 transition-all">
                            View Tournament <ArrowRightIcon className="w-5 h-5 ml-2" />
                        </div>
                    </CardContent>
                </Card>
            </Link>

            {/* HUB HARDWARE U17 LINK */}
            <Link to="/youth/hub-u17" className="group block">
                 <Card className="h-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white border-l-8 border-yellow-500">
                    <CardContent className="p-8 flex flex-col h-full justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-yellow-100 rounded-full">
                                    <TrophyIcon className="w-8 h-8 text-yellow-600" />
                                </div>
                                <h2 className="text-3xl font-bold font-display text-gray-800">Hub Hardware U-17</h2>
                            </div>
                            <p className="text-gray-600 mb-6">
                                The Hub Utility Stores U-17 competition. A key grassroots event organized under the Hhohho Regional Football Association.
                            </p>
                        </div>
                        <div className="flex items-center text-yellow-600 font-bold mt-6 group-hover:gap-2 transition-all">
                            View Tournament <ArrowRightIcon className="w-5 h-5 ml-2" />
                        </div>
                    </CardContent>
                </Card>
            </Link>

            {/* BUILD IT U13 LINK */}
            <Link to="/youth/build-it-u13" className="group block">
                 <Card className="h-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white border-l-8 border-red-500">
                    <CardContent className="p-8 flex flex-col h-full justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-red-100 rounded-full">
                                    <GlobeIcon className="w-8 h-8 text-red-600" />
                                </div>
                                <h2 className="text-3xl font-bold font-display text-gray-800">Build It U-13 National</h2>
                            </div>
                            <p className="text-gray-600 mb-6">
                                The Build It Under-13 National Final Competition. Covering the whole country to find the best young talent at the grassroots level.
                            </p>
                        </div>
                        <div className="flex items-center text-red-600 font-bold mt-6 group-hover:gap-2 transition-all">
                            View Competition <ArrowRightIcon className="w-5 h-5 ml-2" />
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </div>
      </div>
    </div>
  );
};

export default YouthPage;
