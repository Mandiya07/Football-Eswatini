
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAllCompetitions, fetchCups } from '../services/api';
import { Competition } from '../data/teams';
import Spinner from './ui/Spinner';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { Card, CardContent } from './ui/Card';
import TrophyIcon from './icons/TrophyIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import { superNormalize } from '../services/utils';

const RegionDetailPage: React.FC = () => {
  const { regionId } = useParams<{ regionId: string }>();
  const [regionLeagues, setRegionLeagues] = useState<(Competition & { id: string, isCup?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeagues = async () => {
      if (!regionId) return;
      setLoading(true);
      try {
        const [allComps, allCups] = await Promise.all([
            fetchAllCompetitions(),
            fetchCups()
        ]);
        const target = regionId.toLowerCase().trim();
        const targetNorm = superNormalize(target);
        
        // 1. Matches standard leagues (ID or Name)
        const matchedComps = Object.entries(allComps)
          .filter(([id, comp]) => {
              const idNorm = superNormalize(id);
              const nameNorm = superNormalize(comp.name);
              return idNorm.includes(targetNorm) || nameNorm.includes(targetNorm);
          })
          .map(([id, comp]) => ({ ...comp, id })) as any[];

        // 2. Matches brackets (Cups) from the tournament builder
        const matchedCups = allCups
          .filter(cup => {
              const nameRaw = (cup.name || '');
              const nameLower = nameRaw.toLowerCase();
              
              // STATED REQUIREMENT: Match the user-built brackets for the region
              // We check for exact region name and 'ingwenyama' to find your built data
              return nameLower.includes(target) && (nameLower.includes('ingwenyama') || nameLower.includes('cup'));
          })
          .map(cup => ({ ...cup, isCup: true })) as any[];
        
        const combined = [...matchedComps, ...matchedCups].sort((a, b) => {
            // Sort Super Leagues and Cups to the top
            const aIsSuper = (a.name || '').toLowerCase().includes('super league');
            const bIsSuper = (b.name || '').toLowerCase().includes('super league');
            if (aIsSuper && !bIsSuper) return -1;
            if (!aIsSuper && bIsSuper) return 1;
            return (a.name || '').localeCompare(b.name || '');
        });
        
        setRegionLeagues(combined);
      } catch (error) {
        console.error("Failed to load regional leagues", error);
      } finally {
        setLoading(false);
      }
    };
    loadLeagues();
  }, [regionId]);

  const regionName = regionId ? regionId.charAt(0).toUpperCase() + regionId.slice(1) : 'Region';

  if (loading) return <div className="flex justify-center py-20 min-h-screen"><Spinner /></div>;

  return (
    <div className="bg-gray-50 py-12 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="mb-8">
            <button 
                onClick={() => window.history.back()} 
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
                <ArrowLeftIcon className="w-4 h-4" />
                Back
            </button>
        </div>
        
        <div className="mb-12 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-900 mb-4">
                {regionName} Region
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
                Official regional leagues and development tournaments in the {regionName} region.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regionLeagues.length > 0 ? regionLeagues.map((league) => (
                <Link key={league.id} to={league.isCup ? `/cups?id=${league.id}` : `/region-hub/${league.id}`} className="group">
                    <Card className="h-full hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                                    <TrophyIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-gray-900 group-hover:text-primary transition-colors">{league.name}</h3>
                                    {league.isCup ? (
                                        <span className="text-[10px] font-black text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded uppercase tracking-widest mt-1 inline-block">Official Tournament Bracket</span>
                                    ) : (league.name || '').toLowerCase().includes('super league') && (
                                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest mt-1 inline-block">Elite Regional Hub</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-500 mt-6 pt-4 border-t border-gray-50">
                                <span>{league.isCup ? 'View Results & Brackets' : 'View Scores & Logs'}</span>
                                <div className="flex items-center gap-1 text-primary font-bold opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
                                    Open Center <ArrowRightIcon className="w-4 h-4" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            )) : (
                <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                    <p className="text-gray-500 italic">No leagues or tournaments found for this region.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default RegionDetailPage;
