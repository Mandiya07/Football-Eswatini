
import React, { useState, useEffect, useMemo } from 'react';
import SchoolIcon from './icons/SchoolIcon';
import { fetchYouthData, fetchHybridTournaments, fetchNews, fetchAllCompetitions, Competition } from '../services/api';
import { YouthLeague, YouthArticle } from '../data/youth';
import { NewsItem } from '../data/news';
import { HybridTournament, youthHybridData } from '../data/international';
import Spinner from './ui/Spinner';
import TournamentView from './TournamentView';
import RisingStars from './RisingStars';
import YouthArticleSection from './YouthArticleSection';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import TrophyIcon from './icons/TrophyIcon';

const SchoolsPage: React.FC = () => {
  const { isLoggedIn, openAuthModal } = useAuth();
  const [schoolsData, setSchoolsData] = useState<YouthLeague | null>(null);
  const [hybridTournament, setHybridTournament] = useState<HybridTournament | null>(null);
  const [globalNews, setGlobalNews] = useState<NewsItem[]>([]);
  const [otherLeagues, setOtherLeagues] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [youthLeagues, allHybrids, newsData, allComps] = await Promise.all([
            fetchYouthData(),
            fetchHybridTournaments(),
            fetchNews(),
            fetchAllCompetitions()
        ]);
        
        const schoolsLeague = youthLeagues.find(l => 
            l.id === 'schools' || 
            l.name.toLowerCase().includes('schools') ||
            l.name.toLowerCase().includes('instacash')
        );
        setSchoolsData(schoolsLeague || null);
        setGlobalNews(newsData);

        // Find the hybrid structure from DB or use local fallback
        let foundHybrid = allHybrids.find(h => h.id === 'instacash-schools-tournament');
        if (!foundHybrid) {
            foundHybrid = youthHybridData.find(h => h.id === 'instacash-schools-tournament') || null;
        }
        setHybridTournament(foundHybrid);

        // Filter other school leagues (categories that are 'Schools' or contain 'School')
        const filtered = Object.entries(allComps)
            .filter(([id, comp]) => {
                const isSchoolCat = comp.categoryId === 'schools' || comp.categoryId === 'development';
                const hasSchoolName = comp.name.toLowerCase().includes('school');
                const isNotMain = id !== 'instacash-schools-tournament';
                return (isSchoolCat || hasSchoolName) && isNotMain;
            })
            .map(([id, comp]) => ({ ...comp, id }))
            .sort((a, b) => a.name.localeCompare(b.name));
        
        setOtherLeagues(filtered as any);

      } catch (error) {
        console.error("Failed to load schools data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const combinedArticles = useMemo(() => {
      const specificArticles = schoolsData?.articles || [];
      const relevantGlobalNews = globalNews.filter(n => {
          const cats = Array.isArray(n.category) ? n.category : [n.category];
          return cats.includes('Schools');
      }).map(n => ({
          id: n.id,
          title: n.title,
          summary: n.summary,
          content: n.content,
          imageUrl: n.image,
          date: n.date
      } as YouthArticle));

      return [...specificArticles, ...relevantGlobalNews].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  }, [schoolsData, globalNews]);

  const handleCreateLeague = (e: React.MouseEvent) => {
      if (!isLoggedIn) {
          e.preventDefault();
          openAuthModal();
      }
  };

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
          <div className="inline-block p-4 bg-orange-100 rounded-full mb-4">
            <SchoolIcon className="w-12 h-12 text-orange-600" />
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-black text-blue-900 mb-4 uppercase tracking-tight">
            Schools Football
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            The foundation of future legends. Track every inter-school knockout, regional championship, and the prestigious national finals.
          </p>
        </div>

        {/* Featured National Tournament */}
        <div className="mb-20 max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8 border-b-2 border-orange-500 pb-2">
                <TrophyIcon className="w-8 h-8 text-orange-600" />
                <h2 className="text-2xl font-display font-black text-gray-900 uppercase">National Championship Hub</h2>
            </div>
            {hybridTournament ? (
                <TournamentView tournament={hybridTournament} />
            ) : (
                <div className="p-12 text-center bg-white rounded-xl border border-dashed">
                    <p className="text-gray-500">Main tournament structure not initialized. Use Admin Panel > Seed Database.</p>
                </div>
            )}
        </div>

        {/* Other Active School Leagues */}
        {otherLeagues.length > 0 && (
            <div className="mb-20">
                 <div className="flex items-center gap-3 mb-8 border-b-2 border-blue-500 pb-2">
                    <SchoolIcon className="w-8 h-8 text-blue-600" />
                    <h2 className="text-2xl font-display font-black text-gray-900 uppercase">Regional School Leagues</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {otherLeagues.map((league: any) => (
                        <Link key={league.id} to={`/region-hub/${league.id}`} className="group">
                            <Card className="h-full hover:shadow-xl transition-all duration-300 border border-gray-100 bg-white">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 group-hover:border-blue-500 transition-colors">
                                            {league.logoUrl ? (
                                                <img src={league.logoUrl} className="max-h-full max-w-full object-contain" alt="" />
                                            ) : (
                                                <SchoolIcon className="w-8 h-8 text-gray-300" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">{league.name}</h3>
                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Active Competition</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-gray-500 mt-6 pt-4 border-t border-gray-50">
                                        <span className="font-bold text-xs">View Scores & Logs</span>
                                        <ArrowRightIcon className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        )}

        <div className="mb-16 border-t pt-8">
            <h2 className="text-2xl font-display font-bold mb-6 text-gray-800">Schools Updates & Media</h2>
            {combinedArticles.length > 0 ? (
                <YouthArticleSection articles={combinedArticles} />
            ) : (
                <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200 shadow-sm">
                    No recent news articles found for Schools Football.
                </div>
            )}
        </div>

        {/* Rising Stars */}
        {schoolsData?.risingStars && schoolsData.risingStars.length > 0 && (
            <section className="mb-20">
                <h2 className="text-2xl font-display font-black mb-8 border-b pb-4 text-gray-900 uppercase">Scholastic Stars</h2>
                <RisingStars players={schoolsData.risingStars} />
            </section>
        )}

        {/* Dynamic Onboarding CTA - Matching Regional Page */}
        <div className="mt-20 max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-orange-600 to-red-800 text-white shadow-2xl border-0 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <SchoolIcon className="w-48 h-48" />
                </div>
                <CardContent className="p-10 text-center md:text-left md:flex items-center justify-between gap-8 relative z-10">
                    <div className="flex-1">
                        <h2 className="text-3xl font-display font-black mb-4 uppercase tracking-tight">Manage a School League?</h2>
                        <p className="text-orange-50 mb-6 md:mb-0 leading-relaxed">
                            Bring your inter-school competition to the digital age. Create a dedicated space for results, upload team crests, and track the progress of your student-athletes.
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <Link to={isLoggedIn ? "/league-registration" : "#"} onClick={handleCreateLeague}>
                            <Button className="bg-yellow-400 text-red-900 font-black px-8 py-4 rounded-xl hover:bg-yellow-300 transition-all hover:scale-105 shadow-xl border-0 uppercase tracking-widest text-xs">
                                Create School League
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
};

export default SchoolsPage;
