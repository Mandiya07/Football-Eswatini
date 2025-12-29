
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAllCompetitions } from '../services/api';
import { Competition } from '../data/teams';
import Spinner from './ui/Spinner';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { Card, CardContent } from './ui/Card';
import TrophyIcon from './icons/TrophyIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import { superNormalize } from '../services/utils';

const RegionDetailPage: React.FC = () => {
  const { regionId } = useParams<{ regionId: string }>();
  const [regionLeagues, setRegionLeagues] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeagues = async () => {
      if (!regionId) return;
      setLoading(true);
      try {
        const allComps = await fetchAllCompetitions();
        const target = regionId.toLowerCase().trim();
        
        const matched = Object.entries(allComps)
          .filter(([id, comp]) => {
              const idNorm = superNormalize(id);
              const nameNorm = superNormalize(comp.name);
              const targetNorm = superNormalize(target);
              
              // Match if the ID or Name contains the region name (e.g. "hhohho")
              return idNorm.includes(targetNorm) || nameNorm.includes(targetNorm);
          })
          .map(([id, comp]) => ({ ...comp, id }))
          .sort((a, b) => a.name.localeCompare(b.name));
        
        setRegionLeagues(matched);
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
            <Link to="/regional" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeftIcon className="w-4 h-4" />
                Back to All Regions
            </Link>
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
            {regionLeagues.length > 0 ? regionLeagues.map((league: any) => (
                <Link key={league.id} to={`/region-hub/${league.id}`} className="group">
                    <Card className="h-full hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                                    <TrophyIcon className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-xl text-gray-900 group-hover:text-primary transition-colors">{league.name}</h3>
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-500 mt-6 pt-4 border-t border-gray-50">
                                <span>Official League</span>
                                <div className="flex items-center gap-1 text-primary font-bold opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
                                    View Hub <ArrowRightIcon className="w-4 h-4" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            )) : (
                <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                    <p className="text-gray-500 italic">No leagues found in the database for this region.</p>
                    <p className="text-sm text-gray-400 mt-2">Go to Admin Panel > Seed Database and click "Initialize Leagues" to create them.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default RegionDetailPage;
