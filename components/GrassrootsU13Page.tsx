
import React, { useState, useEffect, useMemo } from 'react';
import GlobeIcon from './icons/GlobeIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { Link } from 'react-router-dom';
import Fixtures from './Fixtures';
import Logs from './Logs';
import { fetchYouthData, fetchNews } from '../services/api';
import { YouthLeague, YouthArticle } from '../data/youth';
import { NewsItem } from '../data/news';
import Spinner from './ui/Spinner';
import RegionalLeagueHub from './ui/RegionalLeagueHub';
import YouthArticleSection from './YouthArticleSection';
import RisingStars from './RisingStars';

const GrassrootsU13Page: React.FC = () => {
  const [data, setData] = useState<YouthLeague | null>(null);
  const [globalNews, setGlobalNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const COMPETITION_ID = 'u13-grassroots-national-football';

  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        try {
            const [youth, newsData] = await Promise.all([
                fetchYouthData(),
                fetchNews()
            ]);
            setData(youth.find(l => l.id === COMPETITION_ID) || null);
            setGlobalNews(newsData);
        } catch (e) {
            console.error("Failed to load U-13 Grassroots data", e);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, []);

  const combinedArticles = useMemo(() => {
      const specificArticles = data?.articles || [];
      const relevantGlobalNews = globalNews.filter(n => {
          const title = n.title.toLowerCase();
          const cats = Array.isArray(n.category) ? n.category : [n.category];
          return (
              cats.includes('Youth') || 
              title.includes('grassroots') || 
              title.includes('u13') || 
              title.includes('under-13')
          );
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
  }, [data, globalNews]);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

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
          <div className="inline-block p-4 bg-green-100 rounded-full mb-4 shadow-sm">
            <GlobeIcon className="w-12 h-12 text-green-700" />
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-black text-blue-900 mb-4 uppercase tracking-tight">
            Grassroots U-13 Football
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            The foundation of Eswatini's football pyramid. Track national developmental goals or register your own community grassroots hub.
          </p>
        </div>

        {/* 1. News Updates & Media */}
        <div className="mb-20 border-t pt-8">
            <h2 className="text-2xl font-display font-black mb-8 border-b pb-4 text-gray-900 uppercase">Grassroots Pulse</h2>
            {combinedArticles.length > 0 ? (
                <YouthArticleSection articles={combinedArticles} />
            ) : (
                <div className="text-center py-10 bg-white rounded-2xl border border-dashed text-gray-400">
                    No recent news articles found for Grassroots Football.
                </div>
            )}
        </div>

        {/* 2. Regional Hub */}
        <div className="mb-20">
            <RegionalLeagueHub 
                categoryId={COMPETITION_ID} 
                hubType="U-13 Grassroots" 
                description="Running a local Under-13 festival? Register your hub to manage scores, team rosters, and track the very start of the professional pipeline."
            />
        </div>

        {/* 3. National Match Center */}
        <div className="space-y-16 mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <div className="space-y-6">
                    <h2 className="text-2xl font-display font-black text-gray-800 uppercase tracking-tight border-b-4 border-green-600 pb-2">National Fixtures</h2>
                    <Fixtures showSelector={false} defaultCompetition={COMPETITION_ID} maxHeight="max-h-[600px]" />
                </div>
                <div className="space-y-6">
                    <h2 className="text-2xl font-display font-black text-gray-800 uppercase tracking-tight border-b-4 border-green-600 pb-2">National Standings</h2>
                    <Logs showSelector={false} defaultLeague={COMPETITION_ID} maxHeight="max-h-[600px]" />
                </div>
            </div>
        </div>

        {/* 4. Rising Stars */}
        {data?.risingStars && data.risingStars.length > 0 && (
            <section className="border-t pt-16">
                <h2 className="text-3xl font-display font-black mb-8 border-b pb-4 text-gray-900 uppercase">Early Stars (U-13)</h2>
                <RisingStars players={data.risingStars} />
            </section>
        )}
      </div>
    </div>
  );
};

export default GrassrootsU13Page;
