
import React, { useState, useEffect } from 'react';
import { NewsItem } from '../data/news';
import { NewsCard } from './News';
// FIX: Import 'fetchNews' which is now correctly exported from the API service.
import { fetchNews } from '../services/api';
import Spinner from './ui/Spinner';
import AdBanner from './AdBanner';

const NewsPage: React.FC = () => {
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNews = async () => {
        setLoading(true);
        const data = await fetchNews();
        setNewsData(data);
        setLoading(false);
    };
    loadNews();
  }, []);

  return (
    <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
                    Latest News
                </h1>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Stay up-to-date with the latest happenings in Eswatini and international football.
                </p>
            </div>

            <div className="mb-12">
                <AdBanner placement="news-listing-top-banner" />
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Spinner />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
                    {newsData.map(item => (
                        <NewsCard key={item.id} item={item} />
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

export default NewsPage;