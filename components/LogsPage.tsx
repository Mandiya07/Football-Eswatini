
import React, { useState, useEffect } from 'react';
import Logs from './Logs';
import { NewsItem } from '../data/news';
import { fetchNews } from '../services/api';
import { NewsCard } from './News';
import Spinner from './ui/Spinner';
import { Card, CardContent } from './ui/Card';
import { featuresData, FeatureCard } from './Features';
import TopScorers from './TopScorers';

const LogsPage: React.FC = () => {
  const [latestArticles, setLatestArticles] = useState<NewsItem[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  useEffect(() => {
    const findLatestArticles = async () => {
      setLoadingArticles(true);
      try {
        const allNews = await fetchNews();
        setLatestArticles(allNews.slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch latest news:", error);
      } finally {
        setLoadingArticles(false);
      }
    };

    findLatestArticles();
  }, []);

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="text-center md:text-left mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
            League Standings
          </h1>
          <p className="text-lg text-gray-600">
            View the current league tables for all available competitions.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <Logs showSelector={true} />
          </div>
          <div className="lg:col-span-1 sticky top-20 h-fit space-y-8">
            <TopScorers />
            
            <div>
              <h2 className="text-2xl font-display font-bold mb-4">Latest News</h2>
              {loadingArticles ? (
                <Card><CardContent className="flex justify-center items-center h-48"><Spinner /></CardContent></Card>
              ) : latestArticles.length > 0 ? (
                <div className="space-y-4">
                  {latestArticles.map(article => (
                    <NewsCard key={article.id} item={article} variant="compact" />
                  ))}
                </div>
              ) : (
                <Card><CardContent><p className="text-center text-gray-500 py-8">No news found.</p></CardContent></Card>
              )}
            </div>
            
            <div>
              <h2 className="text-2xl font-display font-bold mb-4">Explore Features</h2>
              <div className="space-y-4">
                {featuresData.map((feature) => (
                  <FeatureCard key={feature.title} feature={feature} variant="compact" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogsPage;
