
import React, { useState, useEffect } from 'react';
import Logs from './Logs';
import Fixtures from './Fixtures';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import UsersIcon from './icons/UsersIcon';
import { Link } from 'react-router-dom';
import { fetchYouthData } from '../services/api';
import { YouthLeague } from '../data/youth';
import YouthArticleSection from './YouthArticleSection';
import Spinner from './ui/Spinner';
import RisingStars from './RisingStars';
import { Card, CardContent } from './ui/Card';

const U20Page: React.FC = () => {
  const U20_LEAGUE_ID = 'u20-elite-league';
  const [leagueData, setLeagueData] = useState<YouthLeague | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
        setLoading(true);
        try {
            const data = await fetchYouthData();
            const target = data.find(l => {
                const name = l.name.toLowerCase();
                const id = l.id.toLowerCase();
                return (
                    id === U20_LEAGUE_ID || 
                    name.includes('u-20') || 
                    name.includes('u20') ||
                    name.includes('under 20') ||
                    name.includes('under-20') ||
                    name.includes('elite')
                );
            });
            setLeagueData(target || null);
        } catch (e) {
            console.error("Failed to load U20 data", e);
        } finally {
            setLoading(false);
        }
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="mb-6">
            <Link to="/youth" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Youth Hub
            </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
            {leagueData?.name || "U-20 Elite League"}
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {leagueData?.description || "The premier youth competition where the future stars of the MTN Premier League earn their stripes."}
          </p>
        </div>

        <div className="space-y-16">
          {leagueData?.articles && leagueData.articles.length > 0 && (
             <div className="border-t pt-8">
                <h2 className="text-2xl font-display font-bold mb-6 text-gray-800">League News</h2>
                <YouthArticleSection articles={leagueData.articles} />
             </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="w-full">
                 <h2 className="text-2xl font-display font-bold mb-4 text-center lg:text-left">Fixtures & Results</h2>
                 <Fixtures showSelector={false} defaultCompetition={U20_LEAGUE_ID} maxHeight="max-h-[800px]" />
            </div>
            <div className="w-full">
                 <h2 className="text-2xl font-display font-bold mb-4 text-center lg:text-left">League Standings</h2>
                 <Logs showSelector={false} defaultLeague={U20_LEAGUE_ID} maxHeight="max-h-[800px]" />
            </div>
          </div>

          {/* Rising Stars Section */}
          {leagueData?.risingStars && leagueData.risingStars.length > 0 && (
                <section>
                    <h2 className="text-3xl font-display font-bold mb-8 border-b pb-4">Players to Watch</h2>
                    <RisingStars players={leagueData.risingStars} />
                </section>
          )}

          {/* Participating Teams */}
          {leagueData?.teams && leagueData.teams.length > 0 && (
                <section>
                    <Card className="bg-blue-50/50 border border-blue-100">
                        <CardContent className="p-8">
                            <h3 className="text-2xl font-bold font-display text-gray-800 mb-6 flex items-center gap-2">
                                <UsersIcon className="w-6 h-6 text-blue-600" /> Participating Clubs
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {leagueData.teams.map(team => (
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

export default U20Page;
