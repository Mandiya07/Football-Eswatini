
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import TrophyIcon from './icons/TrophyIcon';
import UsersIcon from './icons/UsersIcon';
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
        const league = youthLeagues.find(l => {
            const name = l.name.toLowerCase();
            const id = l.id.toLowerCase();
            return (
                id === 'hub-hardware-u17' || 
                id === 'u17' ||
                id === 'under-17' ||
                name.includes('hub') ||
                name.includes('u17') ||
                name.includes('u-17') ||
                name.includes('under-17') ||
                name.includes('under 17')
            );
        });
        setData(league || null);
      } catch (error) {
        console.error("Failed to load Hub U17 data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  // Use the ID of the found document, or fallback to the default if not found
  const competitionId = data?.id || "hub-hardware-u17";

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
            {data?.description || "Organized under the Hhohho Regional Football Association, this tournament serves as a vital grassroots platform."}
          </p>
        </div>

        <div className="space-y-16">
            {data?.articles && data.articles.length > 0 && (
                <div className="border-t pt-8">
                    <h2 className="text-2xl font-display font-bold mb-6 text-gray-800">Latest Updates</h2>
                    <YouthArticleSection articles={data.articles} />
                </div>
            )}

            <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl font-display font-bold text-center mb-8 text-gray-800">Latest Fixtures & Results</h2>
                {/* Dynamically use the ID from the youth document to find fixtures */}
                <Fixtures showSelector={false} defaultCompetition={competitionId} maxHeight="max-h-[600px]" />
            </div>

            {data?.risingStars && data.risingStars.length > 0 && (
                <section>
                    <h2 className="text-3xl font-display font-bold mb-8 border-b pb-4">Top Performers</h2>
                    <RisingStars players={data.risingStars} />
                </section>
            )}

            {/* Participating Teams */}
            {data?.teams && data.teams.length > 0 && (
                <section>
                    <Card className="bg-yellow-50/50 border border-yellow-100">
                        <CardContent className="p-8">
                            <h3 className="text-2xl font-bold font-display text-gray-800 mb-6 flex items-center gap-2">
                                <UsersIcon className="w-6 h-6 text-yellow-600" /> Participating Teams
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {data.teams.map(team => (
                                    <div key={team.id} className="flex items-center gap-3 bg-white py-3 px-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                                        <img src={team.crestUrl} alt={team.name} className="w-10 h-10 object-contain" />
                                        <span className="text-sm font-bold text-gray-800">{team.name}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </section>
            )}
        </div>
      </div>
    </div>
  );
};

export default HubU17Page;
