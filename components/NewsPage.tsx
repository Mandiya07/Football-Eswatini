
import React, { useState, useEffect } from 'react';
import { NewsItem } from '../data/news';
import { NewsCard } from './News';
import { fetchNews } from '../services/api';
import Spinner from './ui/Spinner';
import AdBanner from './AdBanner';
import Button from './ui/Button';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

const ITEMS_PER_PAGE = 12;

const NewsPage: React.FC = () => {
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [displayedNews, setDisplayedNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const loadNews = async () => {
        setLoading(true);
        const data = await fetchNews();
        
        // Filter strictly for National or International news for the main news page
        const filteredData = data.filter(item => {
            const categories = Array.isArray(item.category) ? item.category : [item.category];
            return categories.includes('National') || categories.includes('International');
        });

        setAllNews(filteredData);
        setTotalPages(Math.ceil(filteredData.length / ITEMS_PER_PAGE));
        setLoading(false);
    };
    loadNews();
  }, []);

  useEffect(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setDisplayedNews(allNews.slice(startIndex, endIndex));
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, allNews]);

  const goToPage = (page: number) => {
      if (page >= 1 && page <= totalPages) {
          setCurrentPage(page);
      }
  }

  return (
    <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
                    Latest Headlines
                </h1>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Stay up-to-date with the latest national and international football news.
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
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start min-h-[600px]">
                        {displayedNews.length > 0 ? displayedNews.map(item => (
                            <NewsCard key={item.id} item={item} />
                        )) : (
                            <p className="col-span-full text-center text-gray-500 py-12">No headlines found.</p>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-12">
                            <Button 
                                onClick={() => goToPage(currentPage - 1)} 
                                disabled={currentPage === 1}
                                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                                <ChevronLeftIcon className="w-4 h-4" /> Previous
                            </Button>
                            
                            <div className="flex items-center gap-2">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => goToPage(page)}
                                        className={`w-8 h-8 rounded-full text-sm font-bold transition-colors ${
                                            currentPage === page 
                                            ? 'bg-primary text-white' 
                                            : 'text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>

                            <Button 
                                onClick={() => goToPage(currentPage + 1)} 
                                disabled={currentPage === totalPages}
                                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                                Next <ChevronRightIcon className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    </div>
  );
};

export default NewsPage;
