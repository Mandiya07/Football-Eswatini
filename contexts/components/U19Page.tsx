
import React, { useState, useEffect, useMemo } from 'react';
import TrophyIcon from './icons/TrophyIcon';
import { fetchYouthData, fetchHybridTournaments, fetchNews } from '../services/api';
import { YouthLeague, YouthArticle } from '../data/youth';
import { NewsItem } from '../data/news';
import Spinner from './ui/Spinner';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { Link } from 'react-router-dom';
import YouthArticleSection from './YouthArticleSection';
import RisingStars from './RisingStars';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Fixtures from './Fixtures';
import Logs from './Logs';

const U19Page: React.FC = () => {
  const { isLoggedIn, openAuthModal } = useAuth();
  const [data, setData] = useState<YouthLeague | null>(null);
  const [globalNews, setGlobalNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const COMPETITION_ID = 'u19-national-football';

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [youthLeagues, newsData] = await Promise.all([
             fetchYouthData(),
             fetchNews()
        ]);
        
        const league = youthLeagues.find(l => l.id === COMPETITION_ID);
        setData(league || null);
        setGlobalNews(newsData);
      } catch (error) {
        console.error("Failed to load U19 data", error);
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
          return cats.includes('Youth') && (n.title.toLowerCase().includes('u19') || n.title.toLowerCase().includes('u-19'));
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
          <div className="inline-block p-4 bg-indigo-100 rounded-full mb-4 shadow-sm">
            <TrophyIcon className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-black text-blue-900 mb-4 uppercase tracking-tight">
            {data?.name || "U-19 National Football"}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            The bridge between youth development and elite professional football. Track every tactical battle or organize your own U-19 hub.
          </p>
        </div>

        {/* Create New League CTA */}
        <div className="mb-16 max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-2xl border-0 overflow-hidden relative group">
                <CardContent className="p-10 text-center md:text-left md:flex items-center justify-between gap-8 relative z-10">
                    <div className="flex-1">
                        <h2 className="text-3xl font-display font-black mb-4 uppercase tracking-tight">Manage an U-19 Juniors League</h2>
                        <p className="text-indigo-50 mb-6 md:mb-0 leading-relaxed opacity-90">
                            Take control of your regional juniors competition. Track every tackle, goal, and league position through our professional digital hub.
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <Link to={isLoggedIn ? "/league-registration" : "#"} onClick={handleCreateLeague}>
                            <Button className="bg-yellow-400 text-indigo-900 font-black px-8 py-4 rounded-xl hover:bg-yellow-300 transition-all hover:scale-105 shadow-xl border-0 uppercase tracking-widest text-xs">
                                Create New League
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <div className="space-y-6">
                    <h2 className="text-2xl font-display font-black text-gray-800 uppercase tracking-tight border-b-4 border-indigo-500 pb-2">National Fixtures</h2>
                    <Fixtures showSelector={false} defaultCompetition={COMPETITION_ID} maxHeight="max-h-[600px]" />
                </div>
                <div className="space-y-6">
                    <h2 className="text-2xl font-display font-black text-gray-800 uppercase tracking-tight border-b-4 border-indigo-500 pb-2">National Standings</h2>
                    <Logs showSelector={false} defaultLeague={COMPETITION_ID} maxHeight="max-h-[600px]" />
                </div>
            </div>

            {combinedArticles.length > 0 && (
                <div className="border-t pt-12">
                    <YouthArticleSection articles={combinedArticles} />
                </div>
            )}
            
            {data?.risingStars && data.risingStars.length > 0 && (
                <section>
                    <h2 className="text-3xl font-display font-bold mb-8 border-b pb-4">Rising Stars</h2>
                    <RisingStars players={data.risingStars} />
                </section>
            )}
        </div>
      </div>
    </div>
  );
};

export default U19Page;
