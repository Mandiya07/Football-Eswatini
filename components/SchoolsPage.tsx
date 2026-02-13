
import React, { useState, useEffect, useMemo } from 'react';
import SchoolIcon from './icons/SchoolIcon';
import { fetchYouthData, fetchNews } from '../services/api';
import { YouthLeague, YouthArticle } from '../data/youth';
import { NewsItem } from '../data/news';
import Spinner from './ui/Spinner';
import RisingStars from './RisingStars';
import YouthArticleSection from './YouthArticleSection';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { Link } from 'react-router-dom';
import RegionalLeagueHub from './ui/RegionalLeagueHub';

const SchoolsPage: React.FC = () => {
  const [schoolsData, setSchoolsData] = useState<YouthLeague | null>(null);
  const [globalNews, setGlobalNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [youthLeagues, newsData] = await Promise.all([
            fetchYouthData(),
            fetchNews()
        ]);
        
        const schoolsLeague = youthLeagues.find(l => 
            l.id === 'schools' || 
            l.name.toLowerCase().includes('schools')
        );
        setSchoolsData(schoolsLeague || null);
        setGlobalNews(newsData);
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
          <h1 className="text-4xl md:text-6xl font-display font-black text-blue-900 mb-4 uppercase tracking-tight">
            Schools Football
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover scholastic talent across the Kingdom. Explore regional school leagues or register your official inter-school competition.
          </p>
        </div>

        {/* 1. News Updates & Media - Moved to top as requested */}
        <div className="mb-16 border-t pt-8">
            <h2 className="text-2xl font-display font-bold mb-6 text-gray-800">Schools Updates & Media</h2>
            {combinedArticles.length > 0 ? (
                <YouthArticleSection articles={combinedArticles} />
            ) : (
                <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
                    No recent news articles found for Schools Football.
                </div>
            )}
        </div>

        {/* 2. Schools Regional & Creation Hub */}
        <div className="mb-20">
            <RegionalLeagueHub 
                categoryId="schools" 
                hubType="Schools" 
                description="Manage your school's football competition. Track fixtures, standings, and results for primary or high school leagues in your region."
            />
        </div>

        {/* 3. Rising Stars */}
        {schoolsData?.risingStars && schoolsData.risingStars.length > 0 && (
            <section className="mb-20">
                <h2 className="text-2xl font-display font-black mb-8 border-b pb-4 text-gray-900 uppercase">Scholastic Stars</h2>
                <RisingStars players={schoolsData.risingStars} />
            </section>
        )}
      </div>
    </div>
  );
};

export default SchoolsPage;
