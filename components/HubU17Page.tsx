
import React, { useState, useEffect, useMemo } from 'react';
import TrophyIcon from './icons/TrophyIcon';
import { fetchYouthData, fetchHybridTournaments, fetchNews } from '../services/api';
import { YouthLeague, YouthArticle } from '../data/youth';
import { NewsItem } from '../data/news';
import { HybridTournament } from '../data/international';
import Spinner from './ui/Spinner';
import RisingStars from './RisingStars';
import TournamentView from './TournamentView';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { Link } from 'react-router-dom';
import YouthArticleSection from './YouthArticleSection';
import RegionalLeagueHub from './ui/RegionalLeagueHub';
import Fixtures from './Fixtures';
import Logs from './Logs';

const HubU17Page: React.FC = () => {
  const [data, setData] = useState<YouthLeague | null>(null);
  const [hybridTournament, setHybridTournament] = useState<HybridTournament | null>(null);
  const [globalNews, setGlobalNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const COMPETITION_ID = 'hub-hardware-u17-competition';

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [youthLeagues, allHybrids, newsData] = await Promise.all([
             fetchYouthData(),
             fetchHybridTournaments(),
             fetchNews()
        ]);

        const league = youthLeagues.find(l => l.id === COMPETITION_ID);
        setData(league || null);
        setGlobalNews(newsData);
        setHybridTournament(allHybrids.find(h => h.id === COMPETITION_ID) || null);

      } catch (error) {
        console.error("Failed to load Hub U-17 data", error);
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
              title.includes('hub hardware') || 
              title.includes('u17') || 
              title.includes('u-17')
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
          <div className="inline-block p-4 bg-yellow-100 rounded-full mb-4 shadow-sm">
            <TrophyIcon className="w-12 h-12 text-yellow-600" />
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-black text-blue-900 mb-4 uppercase tracking-tight">
            Hub Hardware U-17 Tournament
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            The national identification tier. Follow official Hub Hardware qualifiers or establish a digital hub for your regional Under-17 competition.
          </p>
        </div>

        {/* 1. News Updates & Media */}
        <div className="mb-20 border-t pt-8">
            <h2 className="text-2xl font-display font-black mb-8 border-b pb-4 text-gray-900 uppercase">Competition Pulse</h2>
            {combinedArticles.length > 0 ? (
                <YouthArticleSection articles={combinedArticles} />
            ) : (
                <div className="text-center py-10 bg-white rounded-2xl border border-dashed text-gray-400">
                    No recent news found for Hub Hardware U-17.
                </div>
            )}
        </div>

        {/* 2. Hybrid Tournament Hub */}
        {hybridTournament && (
            <div className="mb-20">
                <h2 className="text-2xl font-display font-black mb-8 border-b pb-4 text-gray-900 uppercase text-center">National Finals Hub</h2>
                <TournamentView tournament={hybridTournament} />
            </div>
        )}

        {/* 3. Regional Hub */}
        <div className="mb-20">
            <RegionalLeagueHub 
                categoryId={COMPETITION_ID} 
                hubType="Hub Hardware U-17" 
                description="Manage a regional Hub Hardware division. Register your hub to manage scores, team rosters, and verified data for national selection."
            />
        </div>

        {/* 4. Match Center */}
        <div className="space-y-16 mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <div className="space-y-6">
                    <h2 className="text-2xl font-display font-black text-gray-800 uppercase tracking-tight border-b-4 border-yellow-500 pb-2">Regional Fixtures</h2>
                    <Fixtures showSelector={false} defaultCompetition={COMPETITION_ID} maxHeight="max-h-[600px]" />
                </div>
                <div className="space-y-6">
                    <h2 className="text-2xl font-display font-black text-gray-800 uppercase tracking-tight border-b-4 border-yellow-500 pb-2">Regional Standings</h2>
                    <Logs showSelector={false} defaultLeague={COMPETITION_ID} maxHeight="max-h-[600px]" />
                </div>
            </div>
        </div>

        {/* 5. Rising Stars */}
        {data?.risingStars && data.risingStars.length > 0 && (
            <section className="border-t pt-16">
                <h2 className="text-3xl font-display font-black mb-8 border-b pb-4 text-gray-900 uppercase">Top Talents (U-17)</h2>
                <RisingStars players={data.risingStars} />
            </section>
        )}
      </div>
    </div>
  );
};

export default HubU17Page;
