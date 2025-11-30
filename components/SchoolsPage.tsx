
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import SchoolIcon from './icons/SchoolIcon';
import UsersIcon from './icons/UsersIcon';
import { fetchYouthData, fetchCups } from '../services/api';
import { YouthLeague } from '../data/youth';
import { Tournament, cupData as localCupData } from '../data/cups';
import Spinner from './ui/Spinner';
import TournamentBracketDisplay from './TournamentBracketDisplay';
import RisingStars from './RisingStars';
import Fixtures from './Fixtures';
import YouthArticleSection from './YouthArticleSection';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { Link } from 'react-router-dom';

const SchoolsPage: React.FC = () => {
  const [schoolsData, setSchoolsData] = useState<YouthLeague | null>(null);
  const [instacashBracket, setInstacashBracket] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const youthLeagues = await fetchYouthData();
        const schoolsLeague = youthLeagues.find(l => {
            const name = l.name.toLowerCase();
            const id = l.id.toLowerCase();
            return (
                id === 'schools' || 
                name.includes('schools') ||
                name.includes('instacash')
            );
        });
        setSchoolsData(schoolsLeague || null);

        const allCups = await fetchCups();
        let foundBracket = allCups.find(c => c.id === 'instacash-schools-tournament');
        if (!foundBracket) {
            foundBracket = localCupData.find(c => c.id === 'instacash-schools-tournament');
        }
        setInstacashBracket(foundBracket || null);
      } catch (error) {
        console.error("Failed to load schools data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  const competitionId = schoolsData?.id || "instacash-schools-tournament";

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
          <div className="inline-block p-4 bg-orange-100 rounded-full mb-4">
            <SchoolIcon className="w-12 h-12 text-orange-600" />
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-extrabold text-blue-900 mb-4">
            {schoolsData?.name || "Instacash Schools Tournament"}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {schoolsData?.description || "A national school football competition run in partnership with the Eswatini Schools Sports Association."}
          </p>
        </div>

        {schoolsData?.articles && schoolsData.articles.length > 0 && (
            <div className="mb-16 border-t pt-8">
                <h2 className="text-2xl font-display font-bold mb-6 text-gray-800">Tournament Updates</h2>
                <YouthArticleSection articles={schoolsData.articles} />
            </div>
        )}

        <div className="mb-16 max-w-5xl mx-auto">
            <h2 className="text-3xl font-display font-bold text-center mb-8 text-gray-800">Tournament Progress</h2>
            <Fixtures showSelector={false} defaultCompetition={competitionId} maxHeight="max-h-[600px]" />
        </div>

        <div className="space-y-16">
            {instacashBracket && (
                <section>
                    <h2 className="text-3xl font-display font-bold text-center mb-8 text-gray-800">Knockout Stage</h2>
                    <div className="animate-slide-up">
                        <TournamentBracketDisplay tournament={instacashBracket} />
                    </div>
                </section>
            )}

            {schoolsData?.risingStars && schoolsData.risingStars.length > 0 && (
                <section>
                    <h2 className="text-3xl font-display font-bold mb-8 border-b pb-4">Players to Watch</h2>
                    <RisingStars players={schoolsData.risingStars} />
                </section>
            )}

            {/* Participating Schools */}
            {schoolsData?.teams && schoolsData.teams.length > 0 && (
                <section>
                    <Card className="bg-orange-50/50 border border-orange-100">
                        <CardContent className="p-8">
                            <h3 className="text-2xl font-bold font-display text-gray-800 mb-6 flex items-center gap-2">
                                <UsersIcon className="w-6 h-6 text-orange-600" /> Participating Schools
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {schoolsData.teams.map(team => (
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

export default SchoolsPage;
