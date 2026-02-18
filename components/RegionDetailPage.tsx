
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAllCompetitions, fetchCups } from '../services/api';
import { Competition } from '../data/teams';
import Spinner from './ui/Spinner';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { Card, CardContent } from './ui/Card';
import TrophyIcon from './icons/TrophyIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import { superNormalize } from '../services/utils';

interface CategorizedLeagues {
    [key: string]: (Competition & { id: string, isCup?: boolean })[];
}

const RegionDetailPage: React.FC = () => {
  const { regionId } = useParams<{ regionId: string }>();
  const [loading, setLoading] = useState(true);
  const [allLeagues, setAllLeagues] = useState<(Competition & { id: string, isCup?: boolean })[]>([]);

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
        
        const matchedComps = Object.entries(allComps)
          .filter(([id, comp]) => {
              const nameNorm = superNormalize(comp.name);
              const regionNorm = comp.region ? superNormalize(comp.region) : '';
              const idNorm = superNormalize(id);
              // Matches if the name contains the region or the official region property is set
              return idNorm.includes(targetNorm) || nameNorm.includes(targetNorm) || regionNorm === targetNorm;
          })
          .map(([id, comp]) => ({ ...comp, id }));

        const matchedCups = allCups
          .filter(cup => {
              const nameLower = (cup.name || '').toLowerCase();
              const regionNorm = (cup as any).region ? superNormalize((cup as any).region) : '';
              return nameLower.includes(target) || regionNorm === targetNorm;
          })
          .map(cup => ({ ...cup, id: cup.id, isCup: true } as any));
        
        setAllLeagues([...matchedComps, ...matchedCups]);
      } catch (error) {
        console.error("Failed to load regional leagues", error);
      } finally {
        setLoading(false);
      }
    };
    loadLeagues();
  }, [regionId]);

  const categorizedData = useMemo(() => {
    const groups: CategorizedLeagues = {
        'Super League': [],
        'Promotion': [],
        'B Division': [],
        'Youth and Development': [],
        'Schools Football': [],
        'Cups & Tournaments': []
    };

    allLeagues.forEach(league => {
        const name = league.name.toLowerCase();
        const catId = (league.categoryId || '').toLowerCase();

        // 1. Cups Priority
        if (league.isCup) {
            groups['Cups & Tournaments'].push(league);
            return;
        }

        // 2. Schools Football (Strict Mapping)
        if (catId === 'schools' || name.includes('school') || name.includes('scholastic')) {
            groups['Schools Football'].push(league);
            return;
        }

        // 3. Youth and Development (Aggressive Detection for Juniors/Age-Tiers)
        if (
            catId === 'development' ||
            catId.startsWith('u') || 
            catId.includes('grassroots') || 
            catId.includes('hardware') || 
            catId.includes('build-it') ||
            name.includes('juniors') ||
            name.includes('youth') ||
            name.includes('under-') ||
            name.includes('under ') ||
            /\bu\d{2}\b/.test(name) || // Matches "U13", "U15", "U17", "U19" etc.
            name.includes('development')
        ) {
            groups['Youth and Development'].push(league);
            return;
        }

        // 4. B Division
        if (catId === 'b-division' || name.includes('b division') || name.includes('b-division')) {
            groups['B Division'].push(league);
            return;
        }

        // 5. Promotion
        if (catId === 'promotion-league' || name.includes('promotion')) {
            groups['Promotion'].push(league);
            return;
        }

        // 6. Super League (Regional Top Tier)
        if (catId === 'regional-leagues' || name.includes('super league') || name.includes('superleague')) {
            groups['Super League'].push(league);
            return;
        }

        // Fallback for everything else
        groups['Super League'].push(league);
    });

    return groups;
  }, [allLeagues]);

  const regionName = regionId ? regionId.charAt(0).toUpperCase() + regionId.slice(1) : 'Region';

  if (loading) return <div className="flex justify-center py-20 min-h-screen"><Spinner /></div>;

  return (
    <div className="bg-gray-50 py-12 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="mb-8">
            <button onClick={() => window.history.back()} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeftIcon className="w-4 h-4" /> Back to Regions
            </button>
        </div>
        
        <div className="mb-12 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-display font-black text-blue-900 mb-4 uppercase tracking-tighter">
                {regionName} Region Hub
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl leading-relaxed font-medium">
                Official match centers, live standings, and development pathways for the {regionName} region.
            </p>
        </div>

        <div className="space-y-16 pb-20">
            {(Object.entries(categorizedData) as [string, (Competition & { id: string, isCup?: boolean })[]][]).map(([groupName, items]) => (
                items.length > 0 && (
                    <section key={groupName} className="animate-fade-in">
                        <div className="flex items-center gap-4 mb-6">
                            <h2 className="text-2xl font-display font-black text-slate-800 uppercase tracking-tight">{groupName}</h2>
                            <div className="h-px bg-gray-200 flex-grow"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {items.map((league) => (
                                <Link key={league.id} to={league.isCup ? `/cups?id=${league.id}` : `/region-hub/${league.id}`} className="group">
                                    <Card className="h-full hover:shadow-2xl transition-all duration-300 border border-gray-100 bg-white rounded-3xl overflow-hidden">
                                        <CardContent className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-white shadow-inner overflow-hidden">
                                                    {league.logoUrl ? (
                                                        <img src={league.logoUrl} className="max-h-full max-w-full object-contain p-1" alt="" />
                                                    ) : (
                                                        <TrophyIcon className="w-7 h-7" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors truncate leading-tight">{league.name}</h3>
                                                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1">Official Match Center</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-sm text-gray-500 mt-6 pt-4 border-t border-gray-50">
                                                <span className="font-black text-[10px] uppercase tracking-widest opacity-60">Open Hub</span>
                                                <ArrowRightIcon className="w-5 h-5 text-primary transform group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </section>
                )
            ))}

            {allLeagues.length === 0 && (
                <div className="py-24 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200">
                    <TrophyIcon className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-500 font-bold italic">No active leagues initialized in this region yet.</p>
                    <Link to="/league-registration" className="text-primary font-black uppercase text-xs mt-4 inline-block hover:underline">Start a Region Hub &rarr;</Link>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default RegionDetailPage;
