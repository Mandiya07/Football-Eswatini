
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import TrophyIcon from './icons/TrophyIcon';
import UsersIcon from './icons/UsersIcon';
import { fetchYouthData, fetchAllCompetitions } from '../services/api';
import { YouthLeague } from '../data/youth';
import Spinner from './ui/Spinner';
import Fixtures from './Fixtures';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { Link } from 'react-router-dom';
import YouthArticleSection from './YouthArticleSection';
import RisingStars from './RisingStars';
import NewsSection from './News';

const BuildItU13Page: React.FC = () => {
  const [data, setData] = useState<YouthLeague | null>(null);
  const [competitionId, setCompetitionId] = useState<string>('build-it-u13');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [youthLeagues, allCompetitions] = await Promise.all([
             fetchYouthData(),
             fetchAllCompetitions()
        ]);
        
        const league = youthLeagues.find(l => l.id === 'build-it-u13');
        setData(league || null);

        // Resolve ID dynamically
        const compList = Object.entries(allCompetitions).map(([id, c]) => ({ id, name: c.name }));
        const match = compList.find(c => 
            c.id === 'build-it-u13' || 
            c.name.toLowerCase().includes('build it') ||
            c.name.toLowerCase().includes('u-13 national')
        );

        if (match) {
            setCompetitionId(match.id);
        }
      } catch (error) {
        console.error("Failed to load Build It U13 data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
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

        <div className="text-center mb-16">
          <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
            <TrophyIcon className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-extrabold text-blue-900 mb-4">
            {data?.name || "Build It Under-13 National Final"}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {data?.description || "A nationwide football festival for the youngest talents."}
          </p>
        </div>

        <div className="space-y-16">
            {/* 1. League-Specific Articles (Direct from Youth Document) */}
            <div className="border-t pt-8">
                <h2 className="text-2xl font-display font-bold mb-6 text-gray-800">Tournament Highlights</h2>
                {data?.articles && data.articles.length > 0 ? (
                    <YouthArticleSection articles={data.articles} />
                ) : (
                    <NewsSection category="National" />
                )}
            </div>
            
            <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl font-display font-bold text-center mb-8 text-gray-800">Tournament Schedule</h2>
                <Fixtures showSelector={false} defaultCompetition={competitionId} maxHeight="max-h-[600px]" />
            </div>

            {/* Rising Stars */}
            {data?.risingStars && data.risingStars.length > 0 && (
                <section>
                    <h2 className="text-3xl font-display font-bold mb-8 border-b pb-4">Promising Talents</h2>
                    <RisingStars players={data.risingStars} />
                </section>
            )}

            {/* Participating Teams */}
            {data?.teams && data.teams.length > 0 && (
                <section>
                    <Card className="bg-red-50/50 border border-red-100">
                        <CardContent className="p-8">
                            <h3 className="text-2xl font-bold font-display text-gray-800 mb-6 flex items-center gap-2">
                                <UsersIcon className="w-6 h-6 text-red-600" /> Participating Teams & Academies
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

export default BuildItU13Page;
