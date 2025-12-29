
import React, { useState, useEffect, useMemo } from 'react';
import TrophyIcon from './icons/TrophyIcon';
import { fetchYouthData, fetchHybridTournaments, fetchNews } from '../services/api';
import { YouthLeague, YouthArticle } from '../data/youth';
import { NewsItem } from '../data/news';
import { HybridTournament, youthHybridData } from '../data/international';
import Spinner from './ui/Spinner';
import RisingStars from './RisingStars';
import TournamentView from './TournamentView';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { Link } from 'react-router-dom';
import YouthArticleSection from './YouthArticleSection';

const HubU17Page: React.FC = () => {
  const [data, setData] = useState<YouthLeague | null>(null);
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

        const league = youthLeagues.find(l => l.id === 'hub-hardware-u17');
        setData(league || null);
        setGlobalNews(newsData);

        let foundHybrid = allHybrids.find(h => h.id === 'hub-hardware-u17-competition');
        if (!foundHybrid) {
            foundHybrid = youthHybridData.find(h => h.id === 'hub-hardware-u17-competition') || null;
        }
        setHybridTournament(foundHybrid);

      } catch (error) {
        console.error("Failed to load Hub U17 data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const combinedArticles = useMemo(() => {
      const specificArticles = data?.articles || [];
      const relevantGlobalNews = globalNews.filter(n => {
          const cats = Array.isArray(n.category) ? n.category : [n.category];
          return cats.includes('Youth') && n.title.toLowerCase().includes('hub');
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
          <div className="inline-block p-4 bg-yellow-100 rounded-full mb-4">
            <TrophyIcon className="w-12 h-12 text-yellow-600" />
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-extrabold text-blue-900 mb-4">
            {data?.name || "The Hub Hardware Under-17 Tournament"}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {data?.description || "Organized under the Hhohho Regional Football Association, this tournament serves as a vital grassroots platform."}
          </p>
        </div>

        <div className="space-y-16">
            <div className="border-t pt-8">
                <h2 className="text-2xl font-display font-bold mb-6 text-gray-800">Latest Updates</h2>
                {combinedArticles.length > 0 ? (
                    <YouthArticleSection articles={combinedArticles} />
                ) : (
                    <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
                        No recent news articles found for Hub U-17.
                    </div>
                )}
            </div>

            <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-display font-bold text-center mb-8 text-gray-800">Tournament Hub</h2>
                {hybridTournament ? (
                    <TournamentView tournament={hybridTournament} />
                ) : (
                    <div className="p-12 text-center bg-white rounded-xl border border-dashed">
                        <p className="text-gray-500">Zonal structure not initialized. Use Admin Panel > Seed Database.</p>
                    </div>
                )}
            </div>

            {data?.risingStars && data.risingStars.length > 0 && (
                <section>
                    <h2 className="text-3xl font-display font-bold mb-8 border-b pb-4">Top Performers</h2>
                    <RisingStars players={data.risingStars} />
                </section>
            )}
        </div>
      </div>
    </div>
  );
};

export default HubU17Page;