
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
import Spinner from './ui/Spinner';

const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return dateStr;
}

export const NewsCard: React.FC<{ item: NewsItem; variant?: 'default' | 'compact' | 'featured' }> = React.memo(({ item, variant = 'default' }) => {
    const [copied, setCopied] = useState(false);
    
    const categories = Array.isArray(item.category) ? item.category : [item.category];
    const mainCategory = categories[0];
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
    }

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const baseUrl = window.location.href.split('#')[0];
        const articleUrl = `${baseUrl}#${item.url}`;
        const shareData = { title: item.title, text: item.summary, url: articleUrl };
    
        if (navigator.share) {
          try { await navigator.share(shareData); } catch (err) {}
        } else {
          try {
            await navigator.clipboard.writeText(shareData.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); 
          } catch (err) {}
        }
    };

    if (variant === 'featured') {
        return (
            <Link to={item.url} className="group relative block h-[450px] overflow-hidden rounded-2xl shadow-2xl">
                <img src={item.image} alt={item.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8 w-full">
                    <span className={`inline-block mb-4 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${categoryColor}`}>
                        {mainCategory}
                    </span>
                    <h2 className="text-3xl md:text-5xl font-display font-black text-white leading-tight mb-4 group-hover:text-[#FDB913] transition-colors">
                        {item.title}
                    </h2>
                    <p className="text-slate-200 line-clamp-2 max-w-2xl mb-6">{item.summary}</p>
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                        READ ARTICLE <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                    </div>
                </div>
            </Link>
        );
    }

    if (variant === 'compact') {
        return (
            <Link to={item.url} className="group flex gap-4 items-center bg-white p-3 rounded-xl border border-slate-100 hover:border-[#002B7F]/20 hover:shadow-md transition-all">
                <div className="w-24 h-20 flex-shrink-0 overflow-hidden rounded-lg">
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
                </div>
                <div className="min-w-0 flex-grow">
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-tight mb-1 group-hover:text-[#002B7F] transition-colors">{item.title}</h4>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-400">{formatDate(item.date)}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${categoryColor}`}>{mainCategory}</span>
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link to={item.url} className="group block h-full">
            <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden border-0 bg-white">
                <div className="relative h-56 overflow-hidden">
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute top-4 left-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-lg ${categoryColor}`}>
                            {mainCategory}
                        </span>
                    </div>
                </div>
                <CardContent className="p-6">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{formatDate(item.date)}</p>
                    <h3 className="text-xl font-display font-black text-slate-900 mb-3 group-hover:text-[#002B7F] transition-colors line-clamp-2">
                        {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-3 mb-6 leading-relaxed">{item.summary}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <span className="text-xs font-black text-[#002B7F] flex items-center gap-1 group-hover:gap-2 transition-all">
                            EXPLORE <ArrowRightIcon className="w-4 h-4" />
                        </span>
                        <button onClick={handleShare} className="text-slate-300 hover:text-[#002B7F] transition-colors">
                            <ShareIcon className="w-5 h-5" />
                        </button>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
});

const NewsSection: React.FC<{ category?: string, limit?: number }> = ({ category, limit }) => {
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

    const filteredNews = category 
        ? allNews.filter(item => {
            const cats = Array.isArray(item.category) ? item.category : [item.category];
            return cats.includes(category);
        })
        : allNews.filter(item => {
            const cats = Array.isArray(item.category) ? item.category : [item.category];
            return !cats.includes('Community Football Hub') || cats.length > 1;
        });

    if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
    if (filteredNews.length === 0) return null;

    // Home page simple layout (3 cards)
    if (limit === 3) {
        return (
            <section className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-display font-black text-slate-900 tracking-tighter">
                        LATEST STORIES
                    </h2>
                    <Link to="/news" className="text-[#002B7F] font-bold text-sm hover:underline">View All</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {filteredNews.slice(0, 3).map(item => (
                        <NewsCard key={item.id} item={item} />
                    ))}
                </div>
            </section>
        );
    }

    const featuredItem = filteredNews[0];
    const gridItems = filteredNews.slice(1, 4);
    const compactItems = filteredNews.slice(4, 10);

    return (
        <section className="space-y-12">
            <div className="flex items-center justify-between">
                <h2 className="text-4xl font-display font-black text-slate-900 tracking-tighter">
                    {category || 'LATEST STORIES'}
                </h2>
                <Link to="/news" className="text-[#002B7F] font-bold text-sm hover:underline">See All Stories</Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8">
                    <NewsCard item={featuredItem} variant="featured" />
                </div>
                <div className="lg:col-span-4 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Trending Now</h3>
                    <div className="space-y-4">
                        {compactItems.map(item => (
                            <NewsCard key={item.id} item={item} variant="compact" />
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {gridItems.map(item => (
                    <NewsCard key={item.id} item={item} />
                ))}
            </div>
        </section>
    );
};

export default NewsSection;
