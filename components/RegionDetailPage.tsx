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
        
        // 1. Matches standard leagues (By ID, Name, or Explicit Region Field)
        const matchedComps = Object.entries(allComps)
          .filter(([id, comp]) => {
              const idNorm = superNormalize(id);
              const nameNorm = superNormalize(comp.name);
              const regionNorm = comp.region ? superNormalize(comp.region) : '';
              
              // NEW: Explicitly check the region field to capture leagues created via Manager Portal
              return idNorm.includes(targetNorm) || 
                     nameNorm.includes(targetNorm) || 
                     regionNorm === targetNorm;
          })
          .map(([id, comp]) => ({ ...comp, id })) as any[];

        // 2. Matches brackets (Cups) from the tournament builder
        const matchedCups = allCups
          .filter(cup => {
              const nameRaw = (cup.name || '');
              const nameLower = nameRaw.toLowerCase();
              const regionNorm = (cup as any).region ? superNormalize((cup as any).region) : '';
              
              return nameLower.includes(target) || 
                     regionNorm === targetNorm;
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
            <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-900 mb-4 uppercase tracking-tighter">
                {regionName} Hub
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl leading-relaxed font-medium">
                Official match centers, live standings, and developmental updates for the {regionName} region.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regionLeagues.length > 0 ? regionLeagues.map((league) => (
                <Link key={league.id} to={league.isCup ? `/cups?id=${league.id}` : `/region-hub/${league.id}`} className="group">
                    <Card className="h-full hover:shadow-2xl transition-all duration-300 border border-gray-100 bg-white rounded-3xl overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-white shadow-inner">
                                    <TrophyIcon className="w-7 h-7" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-xl text-gray-900 group-hover:text-primary transition-colors truncate">{league.name}</h3>
                                    {league.isCup ? (
                                        <span className="text-[10px] font-black text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded uppercase tracking-widest mt-1 inline-block">Official Bracket</span>
                                    ) : (league.name || '').toLowerCase().includes('super league') ? (
                                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest mt-1 inline-block">Elite Regional Hub</span>
                                    ) : (
                                        <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase tracking-widest mt-1 inline-block">Community League</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-500 mt-6 pt-4 border-t border-gray-50">
                                <span className="font-black text-[10px] uppercase tracking-widest opacity-60">Open Match Center</span>
                                <div className="flex items-center gap-1 text-primary font-bold transition-all transform group-hover:translate-x-1">
                                    <ArrowRightIcon className="w-5 h-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            )) : (
                <div className="col-span-full py-24 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200">
                    <TrophyIcon className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-500 font-bold italic">No active leagues initialized in this region yet.</p>
                    <p className="text-sm text-gray-400 mt-2">Become a Manager and start a hub today!</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default RegionDetailPage;