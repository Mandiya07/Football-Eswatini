
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import ShareIcon from './icons/ShareIcon';
import { NewsItem } from '../data/news';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import { fetchNews } from '../services/api';
import MegaphoneIcon from './icons/MegaphoneIcon';

export const NewsCard: React.FC<{ item: NewsItem; variant?: 'default' | 'compact' }> = React.memo(({ item, variant = 'default' }) => {
    const [copied, setCopied] = useState(false);
    
    // Helper to get categories as array
    const categories = Array.isArray(item.category) ? item.category : [item.category];
    const mainCategory = categories[0];
    
    // Detect if this is a sponsored article
    const isSponsored = categories.some(c => c === 'Sponsored' || c === 'Partner Feature');

    let categoryColor = 'bg-green-100 text-green-800';
    if (isSponsored) {
        categoryColor = 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    } else if (mainCategory === 'National') {
        categoryColor = 'bg-blue-100 text-blue-800';
    } else if (mainCategory === 'Womens') {
        categoryColor = 'bg-pink-100 text-pink-800';
    } else if (mainCategory === 'International') {
        categoryColor = 'bg-purple-100 text-purple-800';
    } else if (mainCategory === 'Schools') {
        categoryColor = 'bg-orange-100 text-orange-800';
    }

    const isCompact = variant === 'compact';

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Use current page base + hash path to ensure valid absolute URL
        const baseUrl = window.location.href.split('#')[0];
        const articleUrl = `${baseUrl}#${item.url}`;

        const shareData = {
          title: item.title,
          text: `Check out this article from Football Eswatini: ${item.title}`,
          url: articleUrl,
        };
    
        if (navigator.share) {
          try {
            await navigator.share(shareData);
          } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                 console.error('Error sharing:', err);
            }
          }
        } else {
          try {
            await navigator.clipboard.writeText(shareData.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); 
          } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            alert('Could not copy link to clipboard.');
          }
        }
    };

    if (isCompact) {
        return (
            <Link to={item.url} className="group block h-full">
                <Card className={`transition-shadow duration-300 hover:shadow-lg flex flex-row h-24 overflow-hidden ${isSponsored ? 'border-l-4 border-yellow-400 bg-yellow-50/30' : ''}`}>
                    {/* Image on the left */}
                    <div className="relative w-24 flex-shrink-0">
                        <img src={item.image} alt={item.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    </div>
                    {/* Content on the right */}
                    <CardContent className="flex flex-col flex-grow p-3">
                         <h3 className="font-bold font-display text-sm text-gray-900 group-hover:text-primary transition-colors duration-300 line-clamp-2 leading-tight flex-grow">
                            {item.title}
                        </h3>
                        <div className="flex justify-between items-center mt-1">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${categoryColor} w-fit flex items-center gap-1`}>
                                {isSponsored && <MegaphoneIcon className="w-2.5 h-2.5" />}
                                {mainCategory}
                            </span>
                            <p className="text-gray-500 text-xs">{item.date}</p>
                        </div>
                    </CardContent>
                </Card>
            </Link>
        );
    }

    // Default Card Layout
    return (
        <Link to={item.url} className="group block h-full">
            <Card className={`transition-all duration-300 hover:shadow-xl flex flex-col relative h-full ${isSponsored ? 'border-2 border-yellow-400 ring-4 ring-yellow-50' : ''}`}>
                <div className="relative overflow-hidden">
                    <img src={item.image} alt={item.title} loading="lazy" className="w-full object-cover group-hover:scale-105 transition-transform duration-300 h-48" />
                     <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        {categories.map(cat => {
                            const isCatSponsored = cat === 'Sponsored' || cat === 'Partner Feature';
                            return (
                                <span key={cat} className={`text-xs font-bold px-2 py-1 rounded-full bg-opacity-90 flex items-center gap-1 ${
                                    isCatSponsored ? 'bg-yellow-400 text-yellow-900 shadow-sm' :
                                    cat === 'National' ? 'bg-blue-100 text-blue-800' : 
                                    cat === 'International' ? 'bg-purple-100 text-purple-800' : 
                                    'bg-green-100 text-green-800'
                                }`}>
                                    {isCatSponsored && <MegaphoneIcon className="w-3 h-3" />}
                                    {cat}
                                </span>
                            );
                        })}
                     </div>
                </div>
                <CardContent className={`flex flex-col flex-grow p-4 ${isSponsored ? 'bg-yellow-50/20' : ''}`}>
                    <div className="flex-grow">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-sm text-gray-500">{item.date}</p>
                            <div className="relative z-10 -mt-1">
                                <button
                                    onClick={handleShare}
                                    className="text-gray-400 hover:text-blue-600 p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    aria-label={`Share article: ${item.title}`}
                                >
                                    <ShareIcon className="w-5 h-5" />
                                </button>
                                {copied && (
                                     <span className="absolute bottom-full mb-2 -right-2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10 animate-fade-in-tooltip">
                                        Link Copied!
                                        <div className="absolute top-full right-3 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                                    </span>
                                )}
                            </div>
                        </div>
                        <h3 className="font-bold font-display mb-2 text-gray-900 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2 text-lg">
                            {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                            {item.summary}
                        </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <span
                            className={`text-sm font-semibold transition-colors flex items-center gap-1 ${isSponsored ? 'text-yellow-700 group-hover:text-yellow-900' : 'text-blue-600 group-hover:text-blue-800'}`}
                        >
                            {isSponsored ? 'Read Feature' : 'Read More'}
                            <ArrowRightIcon className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </span>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
});

const NewsSection: React.FC<{ category?: string }> = ({ category }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [allNews, setAllNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadNews = async () => {
            setLoading(true);
            const data = await fetchNews();
            setAllNews(data);
            setLoading(false);
        };
        loadNews();
    }, []);

    const newsItems = category 
        ? allNews.filter(item => {
            const cats = Array.isArray(item.category) ? item.category : [item.category];
            return cats.includes(category);
        })
        : allNews.filter(item => {
            const cats = Array.isArray(item.category) ? item.category : [item.category];
            const isCommunityExclusive = cats.includes('Community Football Hub') && cats.length === 1;
            return !isCommunityExclusive;
        });


    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    const renderSkeletons = () => (
        <div className="flex -mx-4 px-4 gap-6 pb-4">
             {[...Array(3)].map((_, index) => (
                <div key={index} className="snap-center sm:snap-start flex-shrink-0 w-[85%] sm:w-[45%] lg:w-[31%]">
                    <Card className="animate-pulse">
                        <div className="h-48 bg-gray-200"></div>
                        <CardContent className="p-4 space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-6 bg-gray-200 rounded w-full"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ))}
        </div>
    );

    return (
        <section>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-display font-bold">{category ? `${category === 'Schools' ? 'Schools Tournament' : category}'s News` : 'Latest News'}</h2>
                <div className="hidden sm:flex items-center gap-2">
                    <button onClick={() => scroll('left')} className="p-2 rounded-full bg-white hover:bg-gray-100 transition-colors border border-gray-200" aria-label="Previous news item">
                        <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                    </button>
                    <button onClick={() => scroll('right')} className="p-2 rounded-full bg-white hover:bg-gray-100 transition-colors border border-gray-200" aria-label="Next news item">
                        <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>
            {loading ? renderSkeletons() : (
                <div
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth -mx-4 px-4 gap-6 pb-4 scrollbar-hide"
                >
                    {newsItems.length > 0 ? newsItems.map(item => (
                        <div key={item.id} className="snap-center sm:snap-start flex-shrink-0 w-[85%] sm:w-[45%] lg:w-[31%]">
                            <NewsCard item={item} />
                        </div>
                    )) : (
                        <div className="w-full text-center py-8 text-gray-500">
                            No news available in this category yet.
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default NewsSection;
