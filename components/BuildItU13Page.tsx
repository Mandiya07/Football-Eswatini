
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import TrophyIcon from './icons/TrophyIcon';
import GlobeIcon from './icons/GlobeIcon';
import UsersIcon from './icons/UsersIcon';
import { fetchYouthData } from '../services/api';
import { YouthLeague } from '../data/youth';
import Spinner from './ui/Spinner';
import Fixtures from './Fixtures';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { Link } from 'react-router-dom';
import YouthArticleSection from './YouthArticleSection';

const BuildItU13Page: React.FC = () => {
  const [data, setData] = useState<YouthLeague | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const youthLeagues = await fetchYouthData();
        const league = youthLeagues.find(l => l.id === 'build-it-u13');
        setData(league || null);
      } catch (error) {
        console.error("Failed to load Build It U13 data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
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

        <div className="text-center mb-16">
          <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
            <TrophyIcon className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-extrabold text-blue-900 mb-4">
            Build It Under-13 National Final
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            A nationwide football festival that brings together regional champions to compete for national glory. Developing fundamentals, friendship, and the future of Eswatini football.
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="shadow-lg border-t-4 border-red-500">
                <CardContent className="p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <GlobeIcon className="w-10 h-10 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold font-display mb-3">National Coverage</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                       Covering the entire country, akin to the schools tournament, bringing together the best U-13 teams from every region.
                    </p>
                </CardContent>
            </Card>

            <Card className="shadow-lg border-t-4 border-blue-500">
                <CardContent className="p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <UsersIcon className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold font-display mb-3">Player Development</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        Focusing on core skills, teamwork, and fair play. This is where professional habits are formed for the next generation.
                    </p>
                </CardContent>
            </Card>

            <Card className="shadow-lg border-t-4 border-green-500">
                <CardContent className="p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <TrophyIcon className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold font-display mb-3">Grand Finals</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        Culminates in a prestigious final event where regional winners face off to become the undisputed national U-13 champions.
                    </p>
                </CardContent>
            </Card>
        </div>

        {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
            <div className="space-y-16">
                {data?.articles && <YouthArticleSection articles={data.articles} />}
                
                {/* Latest Updates Section */}
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-display font-bold text-center mb-8 text-gray-800">Tournament Schedule</h2>
                    <Fixtures 
                        showSelector={false} 
                        defaultCompetition="build-it-u13" 
                        maxHeight="max-h-[600px]" 
                    />
                </div>

                {/* Participating Teams List */}
                {data?.teams && data.teams.length > 0 && (
                    <section>
                        <h2 className="text-3xl font-display font-bold mb-8 border-b pb-4">Regional Finalists</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                            {data.teams.map(team => (
                                <Card key={team.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4 flex flex-col items-center text-center">
                                        <img src={team.crestUrl} alt={team.name} className="w-16 h-16 object-contain mb-3" />
                                        <span className="font-semibold text-sm text-gray-800">{team.name}</span>
                                    </CardContent>
                                </Card>
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

export default BuildItU13Page;
