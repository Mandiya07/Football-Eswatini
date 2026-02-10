
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { NewsItem } from '../data/news';
import { NewsCard } from './News';
import { fetchNews } from '../services/api';
import Spinner from './ui/Spinner';
import AdBanner from './AdBanner';
import Button from './ui/Button';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import SearchIcon from './icons/SearchIcon';
import CommunityHub from './CommunityHub';

const ITEMS_PER_PAGE = 9;

const NewsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hash } = useLocation();
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [displayedNews, setDisplayedNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Initialize search term from URL or default to empty
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  useEffect(() => {
    const loadNews = async () => {
        setLoading(true);
        const data = await fetchNews();
        setAllNews(data);
        setLoading(false);
    };
    loadNews();
  }, []);

  // Handle Search and Pagination
  useEffect(() => {
    // 1. Filter based on search term AND category exclusivity
    const filtered = allNews.filter(item => {
        // Category Logic: Handle array or string
        const cats = Array.isArray(item.category) ? item.category : [item.category];
        
        // Exclude items that are ONLY for Community Football Hub
        const isCommunityExclusive = cats.includes('Community Football Hub') && cats.length === 1;
        if (isCommunityExclusive) return false;

        const term = searchTerm.toLowerCase();
        return (
            item.title.toLowerCase().includes(term) ||
            item.summary.toLowerCase().includes(term) ||
            cats.join(' ').toLowerCase().includes(term)
        );
    });

    // 2. Calculate Pages
    const pages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    setTotalPages(pages);

    // 3. Handle Page Reset if search changes results significantly
    let page = currentPage;
    if (page > pages && pages > 0) {
        page = 1;
        setCurrentPage(1);
    }

    // 4. Slice for current page
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setDisplayedNews(filtered.slice(startIndex, endIndex));

  }, [currentPage, allNews, searchTerm]);

  // Handle Scroll to Hash after loading
  useEffect(() => {
      if (!loading && hash) {
          const id = hash.replace('#', '');
          const element = document.getElementById(id);
          if (element) {
              setTimeout(() => {
                  element.scrollIntoView({ behavior: 'smooth' });
              }, 100);
          }
      }
  }, [loading, hash]);

  // Update URL when search term changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target;
      setSearchTerm(val.value);
      setCurrentPage(1); // Reset to page 1 on new search
      
      if (val.value) {
          setSearchParams({ q: val.value });
      } else {
          setSearchParams({});
      }
  };

  const goToPage = (page: number) => {
      if (page >= 1 && page <= totalPages) {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  }

  return (
    <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
            <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
                    Latest Headlines
                </h1>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Stay up-to-date with the latest football news from Eswatini and around the world.
                </p>
            </div>

            <div className="mb-8">
                <AdBanner placement="news-listing-top-banner" />
            </div>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto mb-10 relative">
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </span>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search news by title, summary, or category..."
                        className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm shadow-sm transition-shadow hover:shadow-md"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Spinner />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start min-h-[400px]">
                        {displayedNews.length > 0 ? displayedNews.map(item => (
                            <NewsCard key={item.id} item={item} />
                        )) : (
                            <div className="col-span-full text-center py-12">
                                <p className="text-gray-500 text-lg">No news found matching "{searchTerm}".</p>
                                <Button onClick={() => setSearchTerm('')} className="mt-4 bg-gray-200 text-gray-800 hover:bg-gray-300">
                                    Clear Search
                                </Button>
                            </div>
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
                                <span className="text-sm text-gray-600 font-medium">
                                    Page {currentPage} of {totalPages}
                                </span>
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
            
            {/* Community Football Hub Section */}
            <div id="community-hub">
                <CommunityHub />
            </div>
        </div>
    </div>
  );
};

export default NewsPage;