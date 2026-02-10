
import React, { useState, useEffect, useMemo } from 'react';
import TrophyIcon from './icons/TrophyIcon';
import { fetchYouthData, fetchHybridTournaments, fetchNews } from '../services/api';
import { YouthLeague, YouthArticle } from '../data/youth';
import { NewsItem } from '../data/news';
import { HybridTournament, youthHybridData } from '../data/international';
import Spinner from './ui/Spinner';
import TournamentView from './TournamentView';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { Link } from 'react-router-dom';
import YouthArticleSection from './YouthArticleSection';
import RisingStars from './RisingStars';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Fixtures from './Fixtures';
import Logs from './Logs';

const BuildItU13Page: React.FC = () => {
  const { isLoggedIn, openAuthModal } = useAuth();
  const [data, setData] = useState<YouthLeague | null>(null);
  const [hybridTournament, setHybridTournament] = useState<HybridTournament | null>(null);
  const [globalNews, setGlobalNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const COMPETITION_ID = 'u13-grassroots-national-football';

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

        let foundHybrid = allHybrids.find(h => h.id === 'build-it-u13-national');
        if (!foundHybrid) {
            foundHybrid = youthHybridData.find(h => h.id === 'build-it-u13-national') || null;
        }
        setHybridTournament(foundHybrid);

      } catch (error) {
        console.error("Failed to load U13 data", error);
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
          return cats.includes('Youth') && (n.title.toLowerCase().includes('u13') || n.title.toLowerCase().includes('grassroots'));
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
          <div className="inline-block p-4 bg-red-100 rounded-full mb-4 shadow-sm">
            <TrophyIcon className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-black text-blue-900 mb-4 uppercase tracking-tight">
            {data?.name || "U-13 Grassroots National Football"}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Developing future Sihlangu stars from the earliest stages. Track national grassroots results or start a regional league.
          </p>
        </div>

        {/* Create New League CTA */}
        <div className="mb-16 max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-red-600 to-red-800 text-white shadow-2xl border-0 overflow-hidden relative group">
                <CardContent className="p-10 text-center md:text-left md:flex items-center justify-between gap-8 relative z-10">
                    <div className="flex-1">
                        <h2 className="text-3xl font-display font-black mb-4 uppercase tracking-tight">Launch a Regional League</h2>
                        <p className="text-red-50 mb-6 md:mb-0 leading-relaxed opacity-90">
                            Organizing an U-13 tournament in your region? Use our platform to track scores, rosters, and standings live. Empower your community digitally.
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <Link to={isLoggedIn ? "/league-registration" : "#"} onClick={handleCreateLeague}>
                            <Button className="bg-yellow-400 text-red-900 font-black px-8 py-4 rounded-xl hover:bg-yellow-300 transition-all hover:scale-105 shadow-xl border-0 uppercase tracking-widest text-xs">
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
                    <h2 className="text-2xl font-display font-black text-gray-800 uppercase tracking-tight border-b-4 border-red-500 pb-2">National Fixtures</h2>
                    <Fixtures showSelector={false} defaultCompetition={COMPETITION_ID} maxHeight="max-h-[600px]" />
                </div>
                <div className="space-y-6">
                    <h2 className="text-2xl font-display font-black text-gray-800 uppercase tracking-tight border-b-4 border-red-500 pb-2">National Standings</h2>
                    <Logs showSelector={false} defaultLeague={COMPETITION_ID} maxHeight="max-h-[600px]" />
                </div>
            </div>

            {combinedArticles.length > 0 && (
                <div className="border-t pt-12">
                    <YouthArticleSection articles={combinedArticles} />
                </div>
            )}
            
            {hybridTournament && (
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-display font-bold text-center mb-8 text-gray-800">Tournament Final Hub</h2>
                    <TournamentView tournament={hybridTournament} />
                </div>
            )}

            {data?.risingStars && data.risingStars.length > 0 && (
                <section>
                    <h2 className="text-3xl font-display font-bold mb-8 border-b pb-4">Early Talents</h2>
                    <RisingStars players={data.risingStars} />
                </section>
            )}
        </div>
      </div>
    </div>
  );
};

export default BuildItU13Page;
