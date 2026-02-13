
import React, { useState, useEffect, useMemo } from 'react';
import TrophyIcon from './icons/TrophyIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { Link } from 'react-router-dom';
import Fixtures from './Fixtures';
import Logs from './Logs';
import { fetchYouthData, fetchNews, fetchHybridTournaments } from '../services/api';
import { YouthLeague, YouthArticle } from '../data/youth';
import { NewsItem } from '../data/news';
import { HybridTournament } from '../data/international';
import Spinner from './ui/Spinner';
import RegionalLeagueHub from './ui/RegionalLeagueHub';
import YouthArticleSection from './YouthArticleSection';
import TournamentView from './TournamentView';

const BuildItU13Page: React.FC = () => {
  const [data, setData] = useState<YouthLeague | null>(null);
  const [globalNews, setGlobalNews] = useState<NewsItem[]>([]);
  const [hybridTournament, setHybridTournament] = useState<HybridTournament | null>(null);
  const [loading, setLoading] = useState(true);
  
  const COMPETITION_ID = 'build-it-u13-national';

  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        try {
            const [youth, newsData, allHybrids] = await Promise.all([
                fetchYouthData(),
                fetchNews(),
                fetchHybridTournaments()
            ]);
            setData(youth.find(l => l.id === COMPETITION_ID) || null);
            setGlobalNews(newsData);
            setHybridTournament(allHybrids.find(h => h.id === COMPETITION_ID) || null);
        } catch (e) {
            console.error("Failed to load Build It U-13 data", e);
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
              title.includes('build it') || 
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
          <div className="inline-block p-4 bg-red-100 rounded-full mb-4 shadow-sm">
            <TrophyIcon className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-black text-blue-900 mb-4 uppercase tracking-tight">
            Build It U-13 National
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            The prestigious national showcase for Under-13 talent. Review competition history or manage regional qualifiers in the hub.
          </p>
        </div>

        {/* 1. News Updates & Media */}
        <div className="mb-20 border-t pt-8">
            <h2 className="text-2xl font-display font-black mb-8 border-b pb-4 text-gray-900 uppercase">Competition News</h2>
            {combinedArticles.length > 0 ? (
                <YouthArticleSection articles={combinedArticles} />
            ) : (
                <div className="text-center py-10 bg-white rounded-2xl border border-dashed text-gray-400">
                    No recent news articles found for Build It U-13.
                </div>
            )}
        </div>

        {/* 2. Hybrid Tournament Hub (Groups & Brackets) */}
        {hybridTournament && (
            <div className="mb-20">
                <TournamentView tournament={hybridTournament} />
            </div>
        )}

        {/* 3. Regional Hub for Creation */}
        <div className="mb-20">
            <RegionalLeagueHub 
                categoryId={COMPETITION_ID} 
                hubType="Build It U-13" 
                description="Managing a regional Build It qualifier? Use this hub to track match scores, team rosters, and verified data for the national committee."
            />
        </div>

        {/* 4. Match Center */}
        <div className="space-y-16 mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <div className="space-y-6">
                    <h2 className="text-2xl font-display font-black text-gray-800 uppercase tracking-tight border-b-4 border-red-500 pb-2">Fixtures</h2>
                    <Fixtures showSelector={false} defaultCompetition={COMPETITION_ID} maxHeight="max-h-[600px]" />
                </div>
                <div className="space-y-6">
                    <h2 className="text-2xl font-display font-black text-gray-800 uppercase tracking-tight border-b-4 border-red-500 pb-2">Results</h2>
                    <Logs showSelector={false} defaultLeague={COMPETITION_ID} maxHeight="max-h-[600px]" />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BuildItU13Page;
