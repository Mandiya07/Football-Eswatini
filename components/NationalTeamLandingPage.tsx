
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import NationalTeamIcon from './icons/NationalTeamIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import NewsSection from './News';
import { fetchAllCompetitions, Competition } from '../services/api';
import Spinner from './ui/Spinner';

interface NationalTeamSummary extends Competition {
  id: string;
}

const NationalTeamLandingPage: React.FC = () => {
  const [teams, setTeams] = useState<NationalTeamSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeams = async () => {
      setLoading(true);
      try {
        const allCompetitions = await fetchAllCompetitions();
        const nationalTeams = Object.entries(allCompetitions)
          .map(([id, comp]) => ({ id, ...comp }))
          .filter(comp => comp.categoryId === 'national-teams')
        setTeams(nationalTeams);
      } catch (error) {
          console.error("Failed to load national teams:", error);
      } finally {
        setLoading(false);
      }
    };
    loadTeams();
  }, []);


  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="text-center mb-12">
          <NationalTeamIcon className="w-12 h-12 mx-auto text-primary mb-2" />
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
            National Teams
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            The pride of the Kingdom. Explore all national squads from senior teams to youth development.
          </p>
        </div>

        <div className="space-y-16">
            <NewsSection category="National" />
            
            <div>
                <h2 className="text-3xl font-display font-bold text-center mb-8">Our Squads</h2>
                {loading ? (
                    <div className="flex justify-center"><Spinner /></div>
                ) : teams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {teams.map((team) => (
                      <Link key={team.id} to={`/national-team/${team.id}`} className="group block h-full">
                        <Card className="shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-2 h-full">
                          <CardContent className="p-6 flex flex-col items-center text-center h-full">
                            <img src={team.logoUrl} alt={team.name} className="w-24 h-24 object-contain mb-4" />
                            <h2 className="text-xl font-bold font-display flex-grow">{team.displayName || team.name}</h2>
                            <p className="text-sm text-gray-600 mt-2">{team.description}</p>
                            <div className="mt-4 text-primary font-semibold text-sm inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                              View Hub <ArrowRightIcon className="w-4 h-4" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">No national teams found. Please ensure the database has been seeded correctly.</p>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default NationalTeamLandingPage;
