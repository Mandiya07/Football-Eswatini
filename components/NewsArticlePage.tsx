

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { NewsItem } from '../data/news';
import { fetchNewsArticleByUrl } from '../services/api';
import { Card, CardContent } from './ui/Card';
import Spinner from './ui/Spinner';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import AdBanner from './AdBanner';

const NewsArticlePage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [article, setArticle] = useState<NewsItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadArticle = async () => {
            if (!slug) return;
            setLoading(true);
            const articleUrl = `/news/${slug}`;
            const data = await fetchNewsArticleByUrl(articleUrl);
            setArticle(data);
            setLoading(false);
        };
        loadArticle();
    }, [slug]);

    const safeRenderDate = (date: any): string => {
        if (!date) return "Unknown Date";
        if (typeof date === 'string') return date;
        // Check for Firestore Timestamp which has a toDate() method
        if (date && typeof date.toDate === 'function') {
            return date.toDate().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        }
        // Fallback for raw objects like { seconds: ..., nanoseconds: ... }
        if (date.seconds && typeof date.seconds === 'number') {
            return new Date(date.seconds * 1000).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        }
        return 'Invalid Date';
    };


    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
    }

    if (!article) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
                <h1 className="text-2xl font-bold">Article not found.</h1>
                <Link to="/news" className="text-blue-600 hover:underline mt-4 inline-block">
                    Back to News
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
                <div className="mb-6">
                    <Link to="/news" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to All News
                    </Link>
                </div>

                <div className="mb-8">
                    <AdBanner placement="news-article-top-banner" />
                </div>
                
                <Card className="shadow-lg animate-fade-in">
                    <img src={article.image} alt={article.title} className="w-full h-64 md:h-96 object-cover rounded-t-2xl" />
                    <CardContent className="p-8 md:p-12">
                        <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
                             <span className="font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
                                {article.category}
                            </span>
                            <span>{safeRenderDate(article.date)}</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-display font-extrabold text-blue-800 mb-6">
                            {article.title}
                        </h1>
                        <div className="prose max-w-none text-gray-700 leading-relaxed space-y-4">
                            <p className="font-semibold text-lg">{article.summary}</p>
                            {article.content && article.content.split('\n').map((paragraph, index) => (
                                paragraph.trim() && <p key={index}>{paragraph}</p>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default NewsArticlePage;