
import React, { useState, useEffect, useMemo } from 'react';
import { YouthArticle } from '../data/youth';
import { Card, CardContent } from './ui/Card';
import FileTextIcon from './icons/FileTextIcon';
import MessageSquareIcon from './icons/MessageSquareIcon';
import { useAuth } from '../contexts/AuthContext';
import { addYouthArticleComment, listenToYouthArticleComments, YouthArticleComment } from '../services/api';
import Button from './ui/Button';
import Spinner from './ui/Spinner';

interface YouthArticleSectionProps {
    articles?: YouthArticle[];
}

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

const CommentSection: React.FC<{ articleId: string }> = ({ articleId }) => {
    const { user, isLoggedIn, openAuthModal } = useAuth();
    const [comments, setComments] = useState<YouthArticleComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!articleId) return;
        const unsubscribe = listenToYouthArticleComments(articleId, setComments);
        return () => unsubscribe();
    }, [articleId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;
        setIsSubmitting(true);
        try {
            await addYouthArticleComment(articleId, newComment.trim(), user);
            setNewComment('');
        } catch (error) {
            console.error("Failed to post comment", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-6 pt-4 border-t border-gray-100">
            <h5 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
                <MessageSquareIcon className="w-4 h-4 text-gray-500" />
                Comments ({comments.length})
            </h5>
            
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-2">
                {comments.length > 0 ? comments.map(comment => (
                    <div key={comment.id} className="flex items-start gap-2 text-sm">
                        <img src={comment.userAvatar} alt={comment.userName} className="w-6 h-6 rounded-full mt-1" />
                        <div className="flex-1 bg-gray-50 p-2 rounded-lg">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="font-semibold text-xs">{comment.userName}</span>
                                <span className="text-[10px] text-gray-400">{formatTimeAgo(comment.timestamp)}</span>
                            </div>
                            <p className="text-gray-700 text-xs">{comment.text}</p>
                        </div>
                    </div>
                )) : (
                    <p className="text-xs text-gray-400 italic">No comments yet.</p>
                )}
            </div>

            {isLoggedIn && user ? (
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input 
                        type="text" 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-grow text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2"
                    />
                    <Button type="submit" disabled={isSubmitting || !newComment.trim()} className="bg-blue-600 text-white text-xs px-3 py-2 h-auto">
                        {isSubmitting ? <Spinner className="w-3 h-3 border-2" /> : 'Post'}
                    </Button>
                </form>
            ) : (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">Log in to join the conversation.</p>
                    <Button onClick={openAuthModal} className="bg-white border border-gray-300 text-gray-700 text-xs px-3 py-1 hover:bg-gray-100">Log In</Button>
                </div>
            )}
        </div>
    );
};

const ArticleCard: React.FC<{ article: YouthArticle }> = ({ article }) => {
    return (
        <Card className="flex flex-col h-full transition-shadow hover:shadow-lg">
            {article.imageUrl && (
                <div className="h-48 overflow-hidden">
                    <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                </div>
            )}
            <CardContent className="p-6 flex flex-col flex-grow">
                <div className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{article.date}</div>
                <h4 className="text-xl font-bold font-display mb-3 text-gray-800">{article.title}</h4>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{article.summary}</p>
                
                <details className="mt-auto pt-4 border-t border-gray-100 group">
                    <summary className="text-blue-600 font-semibold text-sm cursor-pointer hover:underline list-none flex items-center justify-between">
                        <span>Read Full Story</span>
                        <span className="text-xs text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="mt-4 animate-fade-in">
                        <div className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                            {article.content}
                        </div>
                        {/* Comments Section integrated directly into the article view */}
                        <CommentSection articleId={article.id} />
                    </div>
                </details>
            </CardContent>
        </Card>
    );
};

const YouthArticleSection: React.FC<YouthArticleSectionProps> = ({ articles }) => {
    // Safety check: ensure articles exists and has items
    if (!articles || articles.length === 0) return null;

    // Sort articles by date descending (newest first)
    const sortedArticles = useMemo(() => {
        return [...articles].sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            // Handle invalid dates by treating them as older (0)
            const valA = isNaN(dateA) ? 0 : dateA;
            const valB = isNaN(dateB) ? 0 : dateB;
            return valB - valA;
        });
    }, [articles]);

    return (
        <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
                <FileTextIcon className="w-7 h-7 text-blue-600" />
                <h3 className="text-2xl font-bold font-display text-blue-900">Latest News & Updates</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {sortedArticles.map(article => (
                    <ArticleCard key={article.id} article={article} />
                ))}
            </div>
        </section>
    );
};

export default YouthArticleSection;
