
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { NewsItem } from '../data/news';
import { fetchNewsArticleByUrl, addNewsComment, listenToNewsComments, NewsComment } from '../services/api';
import { Card, CardContent } from './ui/Card';
import Spinner from './ui/Spinner';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import AdBanner from './AdBanner';
import MessageSquareIcon from './icons/MessageSquareIcon';
import Button from './ui/Button';
import { useAuth } from '../contexts/AuthContext';

function formatTimeAgo(timestamp: { seconds: number } | null): string {
  if (!timestamp) return '';
  const now = new Date();
  const commentDate = new Date(timestamp.seconds * 1000);
  const seconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000);

  if (seconds < 0) return 'just now'; 

  let interval = seconds / 31536000;
  if (interval > 1) {
    const years = Math.floor(interval);
    return years + (years === 1 ? " year ago" : " years ago");
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    const months = Math.floor(interval);
    return months + (months === 1 ? " month ago" : " months ago");
  }
  interval = seconds / 86400;
  if (interval > 1) {
    const days = Math.floor(interval);
    return days + (days === 1 ? " day ago" : " days ago");
  }
  interval = seconds / 3600;
  if (interval > 1) {
    const hours = Math.floor(interval);
    return hours + (hours === 1 ? " hour ago" : " hours ago");
  }
  interval = seconds / 60;
  if (interval > 1) {
    const minutes = Math.floor(interval);
    return minutes + (minutes === 1 ? " minute ago" : " minutes ago");
  }
  if (seconds < 10) return "just now";
  return Math.floor(seconds) + " seconds ago";
}

const NewsCommentSection: React.FC<{ articleId: string }> = ({ articleId }) => {
    const { user, isLoggedIn, openAuthModal } = useAuth();
    const [comments, setComments] = useState<NewsComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!articleId) return;
        const unsubscribe = listenToNewsComments(articleId, setComments);
        return () => unsubscribe();
    }, [articleId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;
        setIsSubmitting(true);
        try {
            await addNewsComment(articleId, newComment.trim(), user);
            setNewComment('');
        } catch (error) {
            console.error("Failed to post comment", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                <MessageSquareIcon className="w-5 h-5 text-gray-500" />
                Comments ({comments.length})
            </h3>
            
            <div className="space-y-4 mb-6">
                {comments.length > 0 ? comments.map(comment => (
                    <div key={comment.id} className="flex items-start gap-3 text-sm">
                        <img src={comment.userAvatar} alt={comment.userName} className="w-8 h-8 rounded-full mt-1 border border-gray-200" />
                        <div className="flex-1 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="font-semibold text-gray-900">{comment.userName}</span>
                                <span className="text-xs text-gray-400">{formatTimeAgo(comment.timestamp)}</span>
                            </div>
                            <p className="text-gray-700 leading-relaxed">{comment.text}</p>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 italic">No comments yet. Be the first to share your thoughts!</p>
                    </div>
                )}
            </div>

            {isLoggedIn && user ? (
                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                    <div className="flex gap-3">
                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-gray-200" />
                        <textarea 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add to the discussion..."
                            className="flex-grow text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary px-3 py-2 min-h-[80px]"
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting || !newComment.trim()} className="bg-primary text-white text-sm px-4 py-2">
                            {isSubmitting ? <Spinner className="w-4 h-4 border-2" /> : 'Post Comment'}
                        </Button>
                    </div>
                </form>
            ) : (
                <div className="text-center p-6 bg-gray-100 rounded-lg border border-gray-200">
                    <p className="text-gray-600 mb-3">Join the conversation. Log in to post a comment.</p>
                    <Button onClick={openAuthModal} className="bg-primary text-white text-sm px-6 py-2">Log In</Button>
                </div>
            )}
        </div>
    );
};

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
        
        // Handle Firestore Timestamp or ISO string conversion
        let d: Date | null = null;

        if (typeof date === 'string') {
            d = new Date(date);
        } else if (date && typeof date.toDate === 'function') {
            d = date.toDate();
        } else if (date.seconds && typeof date.seconds === 'number') {
            d = new Date(date.seconds * 1000);
        }

        // If we have a valid date object
        if (d && !isNaN(d.getTime())) {
            return d.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        }
        
        // Fallback for non-standard strings
        return typeof date === 'string' ? date : 'Invalid Date';
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
                        
                        <NewsCommentSection articleId={article.id} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default NewsArticlePage;