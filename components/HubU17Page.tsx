
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import TrophyIcon from './icons/TrophyIcon';
import MapPinIcon from './icons/MapPinIcon';
import StarIcon from './icons/StarIcon';
import { fetchYouthData } from '../services/api';
import { YouthLeague } from '../data/youth';
import Spinner from './ui/Spinner';
import RisingStars from './RisingStars';
import Fixtures from './Fixtures';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { Link } from 'react-router-dom';
import YouthArticleSection from './YouthArticleSection';

const HubU17Page: React.FC = () => {
  const [data, setData] = useState<YouthLeague | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const youthLeagues = await fetchYouthData();
        
        let league = youthLeagues.find(l => l.id === 'hub-hardware-u17');
        
        if (!league) {
            league = youthLeagues.find(l => l.id.includes('hub') || l.id.includes('u17'));
        }
        
        if (!league) {
             const searchTerms = ['hub hardware', 'under 17', 'u17', 'under-17'];
             league = youthLeagues.find(l => {
                const nameLower = l.name.toLowerCase();
                return searchTerms.some(term => nameLower.includes(term));
            });
        }

        setData(league || null);
      } catch (error) {
        console.error("Failed to load Hub U17 data", error);
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
          <div className="inline-block p-4 bg-yellow-100 rounded-full mb-4">
            <TrophyIcon className="w-12 h-12 text-yellow-600" />
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-extrabold text-blue-900 mb-4">
            {data?.name || "The Hub Hardware Under-17 Tournament"}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {data?.description || "Organized under the Hhohho Regional Football Association, this tournament serves as a vital grassroots platform for identifying and nurturing the stars of tomorrow."}
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="shadow-lg border-t-4 border-blue-500">
                <CardContent className="p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <MapPinIcon className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold font-display mb-3">Hhohho Region</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        Hosted primarily within the Hhohho region, connecting community teams and academies in high-intensity localized competition.
                    </p>
                </CardContent>
            </Card>

            <Card className="shadow-lg border-t-4 border-orange-500">
                <CardContent className="p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <StarIcon className="w-10 h-10 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-bold font-display mb-3">Talent ID</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        The primary scouting ground for regional select squads and a stepping stone to the national U-17 setup.
                    </p>
                </CardContent>
            </Card>

            <Card className="shadow-lg border-t-4 border-yellow-500">
                <CardContent className="p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <TrophyIcon className="w-10 h-10 text-yellow-600" />
                    </div>
                    <h3 className="text-xl font-bold font-display mb-3">Grassroots Growth</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        Sponsored by Hub Hardware to empower youth development through sport, providing kits and equipment to participants.
                    </p>
                </CardContent>
            </Card>
        </div>

        {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
            <div className="space-y-16">
                <YouthArticleSection articles={data?.articles || []} />

                {/* Latest Updates Section */}
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-display font-bold text-center mb-8 text-gray-800">Latest Fixtures & Results</h2>
                    <Fixtures 
                        showSelector={false} 
                        defaultCompetition="hub-hardware-u17" 
                        maxHeight="max-h-[600px]" 
                    />
                </div>

                {/* Rising Stars */}
                {data?.risingStars && data.risingStars.length > 0 && (
                    <section>
                        <h2 className="text-3xl font-display font-bold mb-8 border-b pb-4">Top Performers</h2>
                        <RisingStars players={data.risingStars} />
                    </section>
                )}

                {/* Participating Teams List */}
                {data?.teams && data.teams.length > 0 && (
                    <section>
                        <h2 className="text-3xl font-display font-bold mb-8 border-b pb-4">Participating Teams</h2>
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

export default HubU17Page;
