import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import ShareIcon from './icons/ShareIcon';
import { NewsItem } from '../data/news';
import ArrowRightIcon from './icons/ArrowRightIcon';
import { fetchNews } from '../services/api';
import Spinner from './ui/Spinner';

const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const NewsCard: React.FC<{ item: NewsItem; variant?: 'default' | 'compact' | 'hero' }> = React.memo(({ item, variant = 'default' }) => {
    const categories = Array.isArray(item.category) ? item.category : [item.category];
    const mainCategory = categories[0];

    if (variant === 'compact') {
        return (
            <Link to={item.url} className="group flex gap-4 items-center bg-white/50 p-3 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all">
                <div className="w-20 h-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 shadow-inner">
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="min-w-0 flex-grow">
                    <h4 className="text-xs font-black text-gray-900 line-clamp-2 leading-tight group-hover:text-primary transition-colors">{item.title}</h4>
                    <p className="text-[9px] text-primary font-black mt-1 uppercase tracking-widest opacity-60">{formatDate(item.date)}</p>
                </div>
            </Link>
        );
    }

    if (variant === 'hero') {
        return (
            <Link to={item.url} className="group block relative rounded-[2.5rem] overflow-hidden shadow-2xl h-full min-h-[400px]">
                <img src={item.image} alt={item.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="bg-primary text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg">
                            {mainCategory}
                        </span>
                        <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{formatDate(item.date)}</span>
                    </div>
                    <h2 className="text-2xl md:text-4xl font-display font-black text-white leading-tight tracking-tight group-hover:text-accent transition-colors">
                        {item.title}
                    </h2>
                    <p className="text-white/70 text-sm max-w-xl line-clamp-2 font-medium hidden md:block">
                        {item.summary}
                    </p>
                    <div className="pt-2">
                        <span className="inline-flex items-center gap-2 text-accent font-black text-[10px] uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                            READ FEATURE <ArrowRightIcon className="w-4 h-4" />
                        </span>
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link to={item.url} className="group block h-full">
            <Card className="h-full border-0 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden rounded-[2rem]">
                <div className="relative h-52 overflow-hidden">
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute top-4 left-4">
                        <span className="bg-white/90 backdrop-blur-md text-primary text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-lg">
                            {mainCategory}
                        </span>
                    </div>
                </div>
                <CardContent className="p-6">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{formatDate(item.date)}</p>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors leading-tight line-clamp-2">
                        {item.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">{item.summary}</p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest group-hover:underline">Explore &rarr;</span>
                        <ShareIcon className="w-3.5 h-3.5 text-gray-300 hover:text-primary transition-colors" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
});

const NewsSection: React.FC<{ 
    category?: string, 
    limit?: number, 
    layout?: 'grid' | 'hero-split',
    title?: string 
}> = ({ category, limit, layout = 'grid', title }) => {
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
        : allNews;

    if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
    if (filteredNews.length === 0) return null;

    const displayNews = limit ? filteredNews.slice(0, limit) : filteredNews;

    if (layout === 'hero-split') {
        const hero = displayNews[0];
        // Display 4 articles in Trending section (Right) - Updated from 1-4 to 1-5
        const trending = displayNews.slice(1, 5);
        // Display next 3 articles in Grid section (Below) - Updated from 4-7 to 5-8
        const gridItems = displayNews.slice(5, 8);
        
        return (
            <section className="space-y-12">
                <div className="flex items-center gap-4 mb-2">
                    <h2 className="text-3xl font-black font-display text-gray-900 uppercase tracking-tighter">
                        {title || 'Latest Headlines'}
                    </h2>
                    <div className="h-1 bg-primary flex-grow rounded-full opacity-10"></div>
                </div>
                
                <div className="space-y-12">
                    {/* Top Section: Hero + Trending */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <NewsCard item={hero} variant="hero" />
                        </div>
                        <div className="lg:col-span-1 flex flex-col gap-4">
                            <div className="flex items-center gap-3 mb-2 pl-2 border-l-4 border-accent">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Trending Now</h3>
                            </div>
                            <div className="space-y-3">
                                {trending.map(item => (
                                    <NewsCard key={item.id} item={item} variant="compact" />
                                ))}
                                {trending.length === 0 && (
                                    <p className="text-xs text-gray-400 italic px-2">No trending news available.</p>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Bottom Section: 3 Recent Articles Grid */}
                    {gridItems.length > 0 && (
                        <div className="space-y-6">
                             <div className="flex items-center gap-3 mb-2 pl-2 border-l-4 border-primary">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Recent Coverage</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {gridItems.map(item => (
                                    <NewsCard key={item.id} item={item} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        );
    }

    return (
        <section className="space-y-8">
            <div className="flex items-center justify-between border-b-2 border-gray-100 pb-3">
                <h2 className="text-2xl font-bold font-display text-gray-900">
                    {title || (category ? `${category} News` : 'Latest Headlines')}
                </h2>
                {!limit && (
                    <Link to="/news" className="text-primary font-bold text-sm hover:underline">View All &rarr;</Link>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayNews.map(item => (
                    <NewsCard key={item.id} item={item} />
                ))}
            </div>
        </section>
    );
};

export default NewsSection;