
import React, { useState, useEffect, useMemo } from 'react';
import SchoolIcon from './icons/SchoolIcon';
import { fetchYouthData, fetchHybridTournaments, fetchNews } from '../services/api';
import { YouthLeague, YouthArticle } from '../data/youth';
import { NewsItem } from '../data/news';
import { HybridTournament, youthHybridData } from '../data/international';
import Spinner from './ui/Spinner';
import TournamentView from './TournamentView';
import RisingStars from './RisingStars';
import YouthArticleSection from './YouthArticleSection';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { Link } from 'react-router-dom';

const SchoolsPage: React.FC = () => {
  const [schoolsData, setSchoolsData] = useState<YouthLeague | null>(null);
  const [hybridTournament, setHybridTournament] = useState<HybridTournament | null>(null);
  const [globalNews, setGlobalNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [youthLeagues, allHybrids, newsData] = await Promise.all([
            fetchYouthData(),
            fetchHybridTournaments(),
            fetchNews()
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
          <h1 className="text-4xl md:text-6xl font-display font-extrabold text-blue-900 mb-4">
            {schoolsData?.name || "Instacash Schools Tournament"}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {schoolsData?.description || "A national school football competition run in partnership with the Eswatini Schools Sports Association."}
          </p>
        </div>

        <div className="mb-16 border-t pt-8">
            <h2 className="text-2xl font-display font-bold mb-6 text-gray-800">Tournament Updates</h2>
            {combinedArticles.length > 0 ? (
                <YouthArticleSection articles={combinedArticles} />
            ) : (
                <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
                    No recent news articles found for Schools Football.
                </div>
            )}
        </div>

        <div className="mb-16 max-w-6xl mx-auto">
            <h2 className="text-3xl font-display font-bold text-center mb-8 text-gray-800">Tournament Center</h2>
            {hybridTournament ? (
                <TournamentView tournament={hybridTournament} />
            ) : (
                <div className="p-12 text-center bg-white rounded-xl border border-dashed">
                    <p className="text-gray-500">Hybrid tournament structure not initialized. Use Admin Panel > Seed Database.</p>
                </div>
            )}
        </div>

        <div className="space-y-16">
            {schoolsData?.risingStars && schoolsData.risingStars.length > 0 && (
                <section>
                    <h2 className="text-3xl font-display font-bold mb-8 border-b pb-4">Players to Watch</h2>
                    <RisingStars players={schoolsData.risingStars} />
                </section>
            )}
        </div>
      </div>
    </div>
  );
};

export default SchoolsPage;