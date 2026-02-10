import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import NationalTeamIcon from './icons/NationalTeamIcon';
import TrophyIcon from './icons/TrophyIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import NewsSection from './News';
import { fetchAllCompetitions, Competition, fetchCategories, fetchCups } from '../services/api';
import Spinner from './ui/Spinner';

interface NationalTeamSummary extends Partial<Competition> {
  id: string;
  name: string;
  isCup?: boolean;
}

const NationalTeamLandingPage: React.FC = () => {
  const [teams, setTeams] = useState<NationalTeamSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeams = async () => {
      setLoading(true);
      try {
        const [allCompetitions, allCategories, allCups] = await Promise.all([
            fetchAllCompetitions(),
            fetchCategories(),
            fetchCups()
        ]);

        const nationalCat = allCategories.find(c => 
            c.id === 'national-teams' || 
            c.name.trim().toLowerCase() === 'national teams' || 
            c.name.trim().toLowerCase() === 'national team'
        );
        const targetCatId = nationalCat ? nationalCat.id : 'national-teams';

        const nationalTeams = Object.entries(allCompetitions)
          .map(([id, comp]) => ({ id, ...comp }))
          .filter(comp => comp.categoryId === targetCatId || comp.categoryId === 'national-teams');
        
        const nationalCups = allCups
          .filter(cup => cup.categoryId === targetCatId || cup.categoryId === 'national-teams')
          .map(cup => ({
              id: cup.id,
              name: cup.name,
              description: 'Official Knockout Tournament structure and results.',
              isCup: true,
              logoUrl: (cup as any).logoUrl
          }));

        setTeams([...nationalTeams, ...nationalCups].sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
          console.error("Failed to load national teams:", error);
      } finally {
        setLoading(false);
      }
    };
    loadTeams();
  }, []);


  return (
    <div className="bg-eswatini-pattern py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="text-center mb-16">
          <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
            <NationalTeamIcon className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black text-primary mb-2 uppercase tracking-tighter">
            National Teams Hub
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto font-medium">
            The pride of the Kingdom. Explore all national squads from senior teams to youth development pipelines.
          </p>
        </div>

        <div className="space-y-20">
            <NewsSection 
              category="National" 
              layout="hero-split" 
              title="National Intel"
              limit={8}
            />
            
            <div>
                <h2 className="text-3xl font-display font-black text-center mb-12 uppercase tracking-tighter text-slate-800">Competitions & Squads</h2>
                {loading ? (
                    <div className="flex justify-center"><Spinner /></div>
                ) : teams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {teams.map((team) => (
                      <Link key={team.id} to={team.isCup ? `/cups?id=${team.id}` : `/national-team/${team.id}`} className="group block h-full">
                        <Card className="shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 h-full border-0 overflow-hidden rounded-3xl bg-white">
                          <div className="h-2 bg-primary"></div>
                          <CardContent className="p-8 flex flex-col items-center text-center h-full">
                            {team.logoUrl ? (
                                <img src={team.logoUrl} alt={team.name} className="w-24 h-24 object-contain mb-6 drop-shadow-xl" />
                            ) : (
                                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-primary shadow-inner">
                                    {team.isCup ? <TrophyIcon className="w-10 h-10" /> : <NationalTeamIcon className="w-10 h-10" />}
                                </div>
                            )}
                            <h2 className="text-2xl font-display font-black flex-grow text-slate-900 leading-tight">{team.displayName || team.name}</h2>
                            <p className="text-sm text-slate-500 mt-3 line-clamp-2 font-medium">{team.description || 'Official fixtures, results, and current squad details.'}</p>
                            <div className="mt-8 text-primary font-black text-xs uppercase tracking-[0.2em] inline-flex items-center gap-2 group-hover:gap-4 transition-all">
                              {team.isCup ? 'Enter Bracket' : 'Enter Match Center'} <ArrowRightIcon className="w-4 h-4" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">No national teams found.</p>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default NationalTeamLandingPage;