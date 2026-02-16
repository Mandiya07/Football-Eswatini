
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
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import SchoolIcon from './icons/SchoolIcon';
import YouthIcon from './icons/YouthIcon';
import UsersIcon from './icons/UsersIcon';

interface CategorizedLeagues {
    elite: (Competition & { id: string, isCup?: boolean })[];
    grassroots: (Competition & { id: string, isCup?: boolean })[];
    juniors: (Competition & { id: string, isCup?: boolean })[];
    scholastic: (Competition & { id: string, isCup?: boolean })[];
    uncategorized: (Competition & { id: string, isCup?: boolean })[];
}

const RegionDetailPage: React.FC = () => {
  const { regionId } = useParams<{ regionId: string }>();
  const [loading, setLoading] = useState(true);
  const [leagues, setLeagues] = useState<(Competition & { id: string, isCup?: boolean })[]>([]);

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
              const idNorm = superNormalize(id);
              const nameNorm = superNormalize(comp.name);
              const regionNorm = comp.region ? superNormalize(comp.region) : '';
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
        
        setLeagues([...matchedComps, ...matchedCups]);
      } catch (error) {
        console.error("Failed to load regional leagues", error);
      } finally {
        setLoading(false);
      }
    };
    loadLeagues();
  }, [regionId]);

  const categorized = useMemo(() => {
      const groups: CategorizedLeagues = { elite: [], grassroots: [], juniors: [], scholastic: [], uncategorized: [] };
      
      leagues.forEach(l => {
          const name = (l.name || '').toLowerCase();
          const cid = (l.categoryId || '').toLowerCase();
          
          if (name.includes('super league') || name.includes('premier') || l.isCup) {
              groups.elite.push(l);
          } else if (name.includes('school') || cid.includes('school')) {
              groups.scholastic.push(l);
          } else if (name.includes('u1') || name.includes('u2') || name.includes('juniors') || cid.includes('youth') || cid.includes('development')) {
              groups.juniors.push(l);
          } else if (name.includes('promotion') || name.includes('b division') || name.includes('division 1') || cid.includes('promotion')) {
              groups.grassroots.push(l);
          } else {
              groups.uncategorized.push(l);
          }
      });
      return groups;
  }, [leagues]);

  const regionName = regionId ? regionId.charAt(0).toUpperCase() + regionId.slice(1) : 'Region';

  const LeagueGrid = ({ title, items, icon: Icon, color }: { title: string, items: any[], icon: any, color: string }) => {
      if (items.length === 0) return null;
      return (
          <section className="space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-gray-100 pb-3">
                  <div className={`p-2 rounded-lg ${color} bg-opacity-10`}><Icon className={`w-5 h-5 ${color}`} /></div>
                  <h2 className="text-xl font-black font-display uppercase tracking-tight text-slate-800">{title}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((league) => (
                    <Link key={league.id} to={league.isCup ? `/cups?id=${league.id}` : `/region-hub/${league.id}`} className="group">
                        <Card className="h-full hover:shadow-2xl transition-all duration-300 border border-gray-100 bg-white rounded-3xl overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-white shadow-inner">
                                        {league.logoUrl ? <img src={league.logoUrl} className="max-h-full max-w-full object-contain p-1" /> : <TrophyIcon className="w-7 h-7" />}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors truncate leading-tight">{league.name}</h3>
                                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1">Official Hub</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-500 mt-6 pt-4 border-t border-gray-50">
                                    <span className="font-black text-[10px] uppercase tracking-widest opacity-60">Open Match Center</span>
                                    <ArrowRightIcon className="w-5 h-5 text-primary transform group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                  ))}
              </div>
          </section>
      );
  };

  if (loading) return <div className="flex justify-center py-20 min-h-screen"><Spinner /></div>;

  return (
    <div className="bg-gray-50 py-12 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="mb-8">
            <button onClick={() => window.history.back()} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeftIcon className="w-4 h-4" /> Back
            </button>
        </div>
        
        <div className="mb-16 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-display font-black text-blue-900 mb-4 uppercase tracking-tighter">
                {regionName} Hub
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl leading-relaxed font-medium">
                Official match centers, live standings, and developmental updates for the {regionName} region.
            </p>
        </div>

        {leagues.length > 0 ? (
            <div className="space-y-16 pb-20">
                <LeagueGrid title="Elite & Tournament" items={categorized.elite} icon={ShieldCheckIcon} color="text-blue-600" />
                <LeagueGrid title="Juniors & Development" items={categorized.juniors} icon={YouthIcon} color="text-indigo-600" />
                <LeagueGrid title="Grassroots & Community" items={categorized.grassroots} icon={UsersIcon} color="text-green-600" />
                <LeagueGrid title="Schools & Scholastic" items={categorized.scholastic} icon={SchoolIcon} color="text-orange-600" />
                <LeagueGrid title="Other Competitions" items={categorized.uncategorized} icon={TrophyIcon} color="text-slate-400" />
            </div>
        ) : (
            <div className="col-span-full py-24 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200">
                <TrophyIcon className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                <p className="text-gray-500 font-bold italic">No active leagues initialized in this region yet.</p>
                <Link to="/league-registration" className="text-primary font-black uppercase text-xs mt-4 inline-block hover:underline">Start a Region Hub &rarr;</Link>
            </div>
        )}
      </div>
    </div>
  );
};

export default RegionDetailPage;
