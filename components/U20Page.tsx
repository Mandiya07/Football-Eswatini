
import React, { useState, useEffect, useMemo } from 'react';
import Logs from './Logs';
import Fixtures from './Fixtures';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { Link } from 'react-router-dom';
import { fetchYouthData, fetchAllCompetitions, fetchNews } from '../services/api';
import { YouthLeague, YouthArticle } from '../data/youth';
import { NewsItem } from '../data/news';
import YouthArticleSection from './YouthArticleSection';
import Spinner from './ui/Spinner';
import RisingStars from './RisingStars';

const U20Page: React.FC = () => {
  const [leagueData, setLeagueData] = useState<YouthLeague | null>(null);
  const [globalNews, setGlobalNews] = useState<NewsItem[]>([]);
  const [competitionId, setCompetitionId] = useState<string>('u20-elite-league'); // Default fallback
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
        setLoading(true);
        try {
            const [youthData, newsData, allCompetitions] = await Promise.all([
                fetchYouthData(),
                fetchNews(),
                fetchAllCompetitions()
            ]);

            let target = youthData.find(l => l.id === 'u20-elite-league');
            if (!target) {
                target = youthData.find(l => l.name.includes('U-20') || l.name.includes('Elite'));
            }
            setLeagueData(target || null);
            setGlobalNews(newsData);

            const compList = Object.entries(allCompetitions).map(([id, c]) => ({ id, name: c.name }));
            const match = compList.find(c => 
                c.id === 'u20-elite-league' || 
                c.name.toLowerCase().trim() === 'u-20 elite league' ||
                c.name.toLowerCase().includes('u-20 elite')
            );

            if (match) {
                setCompetitionId(match.id);
            }
        } catch (e) {
            console.error("Failed to load U20 data", e);
        } finally {
            setLoading(false);
        }
    };
    load();
  }, []);

  const combinedArticles = useMemo(() => {
      const specificArticles = leagueData?.articles || [];
      const relevantGlobalNews = globalNews.filter(n => {
          const title = n.title.toLowerCase();
          const summary = n.summary.toLowerCase();
          const cats = Array.isArray(n.category) ? n.category : [n.category];
          
          return (
              cats.includes('Youth') ||
              title.includes('u20') || title.includes('u-20') || title.includes('elite league') ||
              summary.includes('u20') || summary.includes('u-20')
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
  }, [leagueData, globalNews]);

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

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
            {leagueData?.name || "U-20 Elite League"}
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {leagueData?.description || "The premier youth competition where the future stars of the MTN Premier League earn their stripes."}
          </p>
        </div>

        <div className="space-y-16">
          <div className="border-t pt-8">
             <h2 className="text-2xl font-display font-bold mb-6 text-gray-800">League News</h2>
             {combinedArticles.length > 0 ? (
                <YouthArticleSection articles={combinedArticles} />
             ) : (
                <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
                    No recent news articles found for U-20 League.
                </div>
             )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="w-full">
                 <h2 className="text-2xl font-display font-bold mb-4 text-center lg:text-left">Fixtures & Results</h2>
                 <Fixtures showSelector={false} defaultCompetition={competitionId} maxHeight="max-h-[800px]" />
            </div>
            <div className="w-full">
                 <h2 className="text-2xl font-display font-bold mb-4 text-center lg:text-left">League Standings</h2>
                 <Logs showSelector={false} defaultLeague={competitionId} maxHeight="max-h-[800px]" />
            </div>
          </div>

          {leagueData?.risingStars && leagueData.risingStars.length > 0 && (
                <section>
                    <h2 className="text-3xl font-display font-bold mb-8 border-b pb-4">Players to Watch</h2>
                    <RisingStars players={leagueData.risingStars} />
                </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default U20Page;
