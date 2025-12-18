import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import TrophyIcon from './icons/TrophyIcon';
import UsersIcon from './icons/UsersIcon';
import CalendarIcon from './icons/CalendarIcon';
import MapPinIcon from './icons/MapPinIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import { 
    CommunityEvent, 
    fetchCommunityEvents, 
    submitCommunityEvent, 
    updateCommunityEvent,
    fetchNews, 
    submitCommunityResult,
    toggleCommunityEventLike,
    addCommunityEventComment,
    listenToCommunityEventComments,
    CommunityEventComment
} from '../services/api';
import StarIcon from './icons/StarIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';
import InfoIcon from './icons/InfoIcon';
import { NewsItem } from '../data/news';
import { NewsCard } from './News';
import NewspaperIcon from './icons/NewspaperIcon';
import AdBanner from './AdBanner';
import XIcon from './icons/XIcon';
import MessageSquareIcon from './icons/MessageSquareIcon';
import HeartIcon from './icons/HeartIcon';
import PencilIcon from './icons/PencilIcon';
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
      return years + (years === 1 ? "y ago" : "y ago");
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      const months = Math.floor(interval);
      return months + (months === 1 ? "mo ago" : "mo ago");
    }
    interval = seconds / 86400;
    if (interval > 1) {
      const days = Math.floor(interval);
      return days + (days === 1 ? "d ago" : "d ago");
    }
    interval = seconds / 3600;
    if (interval > 1) {
      const hours = Math.floor(interval);
      return hours + (hours === 1 ? "h ago" : "h ago");
    }
    interval = seconds / 60;
    if (interval > 1) {
      const minutes = Math.floor(interval);
      return minutes + (minutes === 1 ? "m ago" : "m ago");
    }
    if (seconds < 10) return "just now";
    return Math.floor(seconds) + "s ago";
}

const CommunityEventCard: React.FC<{ 
    event: CommunityEvent, 
    onClick: () => void,
    onEdit?: () => void 
}> = ({ event, onClick, onEdit }) => {
    const { user, isLoggedIn, openAuthModal } = useAuth();
    const [likes, setLikes] = useState(event.likes || 0);
    const [likedBy, setLikedBy] = useState<string[]>(event.likedBy || []);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<CommunityEventComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    const isLiked = user ? likedBy.includes(user.id) : false;
    const canEdit = onEdit && user && (user.role === 'super_admin' || user.id === event.userId);

    // Listen for comments when the section is expanded
    useEffect(() => {
        if (showComments) {
            const unsubscribe = listenToCommunityEventComments(event.id, setComments);
            return () => unsubscribe();
        }
    }, [showComments, event.id]);

    const handleToggleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isLoggedIn || !user) {
            openAuthModal();
            return;
        }

        // Optimistic Update
        const newIsLiked = !isLiked;
        setLikes(prev => newIsLiked ? prev + 1 : prev - 1);
        setLikedBy(prev => newIsLiked ? [...prev, user.id] : prev.filter(id => id !== user.id));

        try {
            await toggleCommunityEventLike(event.id, user.id, isLiked);
        } catch (error) {
            // Revert on error
            setLikes(prev => newIsLiked ? prev - 1 : prev + 1);
            setLikedBy(prev => newIsLiked ? prev.filter(id => id !== user.id) : [...prev, user.id]);
            console.error("Failed to toggle like", error);
        }
    };

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!newComment.trim() || !user) return;
        
        setIsSubmittingComment(true);
        try {
            await addCommunityEventComment(event.id, newComment.trim(), user);
            setNewComment('');
        } catch (error) {
            console.error("Failed to post comment", error);
            alert("Failed to post comment.");
        } finally {
            setIsSubmittingComment(false);
        }
    };

    return (
        <Card className="hover:shadow-md transition-all h-full flex flex-col cursor-pointer group" onClick={onClick}>
            <CardContent className="p-5 flex flex-col h-full relative">
                {canEdit && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm text-gray-500 hover:text-blue-600 border z-10"
                        title="Edit Event"
                    >
                        <PencilIcon className="w-4 h-4" />
                    </button>
                )}
                
                <div className="flex justify-between items-start mb-2">
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded uppercase">{event.eventType}</span>
                    <span className="text-xs text-gray-500">{event.date}</span>
                </div>
                <h4 className="font-bold text-lg mb-2 line-clamp-1 text-gray-900 group-hover:text-green-700 transition-colors">{event.title}</h4>
                <p className="text-sm text-gray-500 mb-3 flex items-center gap-1"><MapPinIcon className="w-3 h-3"/> {event.venue}</p>
                
                {/* Poster Thumbnail if available */}
                {event.posterUrl && (
                    <div className="mb-3 h-32 w-full overflow-hidden rounded-md bg-gray-100">
                         <img src={event.posterUrl} alt={event.title} className="w-full h-full object-cover" />
                    </div>
                )}
                
                <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-grow">{event.description}</p>

                {/* Interactions Bar */}
                <div className="flex items-center gap-4 mt-auto pt-2 border-t border-gray-100">
                    <button 
                        onClick={handleToggleLike}
                        className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'}`}
                    >
                        <HeartIcon className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                        <span>{likes}</span>
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
                        className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${showComments ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                    >
                        <MessageSquareIcon className="w-4 h-4" />
                        <span>{showComments ? 'Hide Comments' : 'Comments'}</span>
                    </button>
                </div>

                {/* Comments Section */}
                {showComments && (
                    <div className="mt-3 pt-3 border-t border-gray-100 animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="space-y-3 mb-3 max-h-40 overflow-y-auto pr-1">
                            {comments.length > 0 ? (
                                comments.map(comment => (
                                    <div key={comment.id} className="flex gap-2 text-xs">
                                        <img src={comment.userAvatar} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
                                        <div className="bg-gray-50 p-2 rounded-lg flex-grow">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <span className="font-bold text-gray-800">{comment.userName}</span>
                                                <span className="text-[10px] text-gray-400">{formatTimeAgo(comment.timestamp)}</span>
                                            </div>
                                            <p className="text-gray-700">{comment.text}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 italic text-center py-2">No comments yet.</p>
                            )}
                        </div>

                        {isLoggedIn ? (
                            <form onSubmit={handlePostComment} className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    placeholder="Write a comment..."
                                    className="flex-grow text-xs border border-gray-300 rounded-md px-2 py-1 focus:ring-green-500 focus:border-green-500"
                                />
                                <Button type="submit" disabled={isSubmittingComment || !newComment.trim()} className="bg-green-600 text-white text-xs px-2 py-1 h-auto">
                                    {isSubmittingComment ? <Spinner className="w-3 h-3 border-2" /> : 'Post'}
                                </Button>
                            </form>
                        ) : (
                            <button onClick={openAuthModal} className="w-full text-xs text-blue-600 hover:underline text-center">
                                Log in to comment
                            </button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const CommunityHub: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'news' | 'results' | 'submit'>('news');
    const [events, setEvents] = useState<CommunityEvent[]>([]);
    const [communityNews, setCommunityNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    
    // View Modal State
    const [viewEvent, setViewEvent] = useState<CommunityEvent | null>(null);

    // Create/Edit Event Form State
    const [formData, setFormData] = useState({
        title: '',
        eventType: 'Knockout' as CommunityEvent['eventType'],
        description: '',
        date: '',
        time: '',
        venue: '',
        organizer: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        prizes: '',
        fees: '',
        posterUrl: '' 
    });
    const [isEditingEvent, setIsEditingEvent] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Report Result Form State
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportForm, setReportForm] = useState({ eventId: '', resultsSummary: '' });
    const [isReporting, setIsReporting] = useState(false);

    const loadEvents = async () => {
        setLoading(true);
        try {
            const [eventsData, newsData] = await Promise.all([
                fetchCommunityEvents(),
                fetchNews()
            ]);
            setEvents(eventsData);

            // Filter news for Community Hub category and limit to 6
            const hubNews = newsData.filter(item => {
                const cats = Array.isArray(item.category) ? item.category : [item.category];
                return cats.includes('Community Football Hub');
            });
            setCommunityNews(hubNews.slice(0, 6));
        } catch (error) {
            console.error("Error loading community data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEvents();
    }, []);

    const upcomingEvents = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        // Strictly filter to only include future or current events that don't have results yet
        return events.filter(e => e.date >= today && !e.resultsSummary).sort((a,b) => a.date.localeCompare(b.date));
    }, [events]);

    const featuredEvent = useMemo(() => {
        // Featured event must be from the upcoming list only
        if (upcomingEvents.length === 0) return null;
        return upcomingEvents.find(e => e.isSpotlight) || upcomingEvents[0];
    }, [upcomingEvents]);

    const pastEvents = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        // Past events are either those with summaries or those whose dates have passed
        return events.filter(e => e.resultsSummary || e.date < today).sort((a,b) => b.date.localeCompare(a.date));
    }, [events]);
    
    const eventsPendingResults = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        // Allow reporting results for anything today or in the past that doesn't have a summary yet
        return events.filter(e => !e.resultsSummary && e.date <= today).sort((a, b) => b.date.localeCompare(a.date));
    }, [events]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setFormData(prev => ({ ...prev, posterUrl: reader.result as string }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEditClick = (event: CommunityEvent) => {
        setFormData({
            title: event.title,
            eventType: event.eventType,
            description: event.description,
            date: event.date,
            time: event.time,
            venue: event.venue,
            organizer: event.organizer,
            contactName: event.contactName || '',
            contactPhone: event.contactPhone || '',
            contactEmail: event.contactEmail || '',
            prizes: event.prizes || '',
            fees: event.fees || '',
            posterUrl: event.posterUrl || ''
        });
        setEditingId(event.id);
        setIsEditingEvent(true);
        setActiveTab('submit');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setFormData({
            title: '', eventType: 'Knockout', description: '', date: '', time: '', venue: '',
            organizer: '', contactName: '', contactPhone: '', contactEmail: '', prizes: '', fees: '', posterUrl: ''
        });
        setIsEditingEvent(false);
        setEditingId(null);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (isEditingEvent && editingId) {
                await updateCommunityEvent(editingId, formData);
                alert("Event updated successfully!");
                setIsEditingEvent(false);
                setEditingId(null);
            } else {
                await submitCommunityEvent({ ...formData, userId: user?.id });
                setSubmitSuccess(true);
                setTimeout(() => setSubmitSuccess(false), 5000);
            }
            resetForm();
            loadEvents(); // Refresh data
        } catch (error) {
            console.error(error);
            alert("Failed to save event. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleReportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reportForm.eventId || !reportForm.resultsSummary) return;
        
        setIsReporting(true);
        try {
            await submitCommunityResult(reportForm.eventId, reportForm.resultsSummary);
            alert("Results submitted successfully!");
            setShowReportModal(false);
            setReportForm({ eventId: '', resultsSummary: '' });
            loadEvents(); // Refresh list
        } catch (error) {
            console.error(error);
            alert("Failed to submit results.");
        } finally {
            setIsReporting(false);
        }
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-blue-500 sm:text-sm";

    return (
        <section className="mt-16 pt-12 border-t border-gray-200">
            <div className="text-center mb-10">
                <div className="inline-block p-3 bg-green-100 rounded-full mb-3">
                    <UsersIcon className="w-8 h-8 text-green-700" />
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-extrabold text-green-900 mb-2">
                    Community Football Hub
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Your Home for Local Tournaments, Knockouts, Festivals & Grassroots Football Activities Across Eswatini.
                </p>
            </div>

            <AdBanner placement="community-hub-banner" className="mb-8 max-w-6xl mx-auto" />

            {/* Navigation Tabs */}
            <div className="flex justify-center mb-8">
                <div className="bg-white p-1 rounded-lg shadow-sm border inline-flex">
                    <button onClick={() => setActiveTab('news')} className={`px-6 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'news' ? 'bg-green-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}>Latest News</button>
                    <button onClick={() => setActiveTab('results')} className={`px-6 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'results' ? 'bg-green-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}>Results & Scores</button>
                    <button onClick={() => setActiveTab('submit')} className={`px-6 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'submit' ? 'bg-green-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}>{isEditingEvent ? 'Edit Event' : 'Submit Event'}</button>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="max-w-6xl mx-auto">
                {activeTab === 'news' && (
                    <div className="space-y-12">
                        {/* Community News Articles */}
                        {communityNews.length > 0 && (
                            <div>
                                <h3 className="text-xl font-bold font-display mb-6 border-b pb-2 flex items-center gap-2">
                                    <NewspaperIcon className="w-5 h-5 text-green-600" /> Community Headlines
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {communityNews.map(item => (
                                        <NewsCard key={item.id} item={item} variant="compact" />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Featured Spotlight */}
                        {featuredEvent ? (
                            <Card className="shadow-lg border-l-4 border-green-500 overflow-hidden bg-gradient-to-r from-green-50 to-white cursor-pointer" onClick={() => setViewEvent(featuredEvent)}>
                                <CardContent className="p-0 flex flex-col md:flex-row">
                                    <div className="md:w-1/3 bg-gray-200 h-64 md:h-auto relative">
                                        {featuredEvent.posterUrl ? (
                                            <img src={featuredEvent.posterUrl} alt={featuredEvent.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <TrophyIcon className="w-16 h-16" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                                            <StarIcon className="w-3 h-3" /> SPOTLIGHT
                                        </div>
                                    </div>
                                    <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
                                        <div className="text-sm font-bold text-green-700 uppercase tracking-wide mb-1">{featuredEvent.eventType}</div>
                                        <h3 className="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-3">{featuredEvent.title}</h3>
                                        <p className="text-gray-600 mb-4 line-clamp-3">{featuredEvent.description}</p>
                                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 mb-6">
                                            <div className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-gray-400" /> {featuredEvent.date} @ {featuredEvent.time}</div>
                                            <div className="flex items-center gap-2"><MapPinIcon className="w-4 h-4 text-gray-400" /> {featuredEvent.venue}</div>
                                        </div>
                                        {featuredEvent.contactPhone && (
                                            <div className="text-sm font-semibold text-gray-800">
                                                Organizer: <span className="text-green-600">{featuredEvent.organizer}</span>
                                            </div>
                                        )}
                                        <p className="text-xs text-blue-600 mt-4 underline">Click for more details</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : !loading && communityNews.length === 0 && (
                            <div className="text-center py-12 bg-gray-50 rounded-lg">
                                <p className="text-gray-500 italic">No spotlight events at the moment.</p>
                            </div>
                        )}

                        {/* Upcoming Grid */}
                        <div>
                            <h3 className="text-xl font-bold font-display mb-6 border-b pb-2 flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-green-600" /> Upcoming Community Fixtures
                            </h3>
                            {loading ? <Spinner /> : upcomingEvents.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {upcomingEvents.map(event => (
                                        <CommunityEventCard 
                                            key={event.id} 
                                            event={event} 
                                            onClick={() => setViewEvent(event)}
                                            onEdit={() => handleEditClick(event)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">No upcoming events listed. Be the first to submit one!</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'results' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
                            <div className="text-center sm:text-left mb-4 sm:mb-0">
                                <h3 className="text-2xl font-bold font-display text-gray-800">Community Results</h3>
                                <p className="text-gray-600">Scores and winners from recent local tournaments.</p>
                            </div>
                            <Button onClick={() => setShowReportModal(true)} className="bg-green-600 text-white hover:bg-green-700 shadow-md">
                                Report Score / Outcome
                            </Button>
                        </div>
                        
                        {loading ? <Spinner /> : pastEvents.length > 0 ? (
                            <div className="space-y-4">
                                {pastEvents.map(event => (
                                    <Card key={event.id} className="border-l-4 border-green-600 cursor-pointer hover:shadow-md" onClick={() => setViewEvent(event)}>
                                        <CardContent className="p-5">
                                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                                <div>
                                                    <h4 className="font-bold text-lg text-gray-900">{event.title}</h4>
                                                    <div className="text-xs text-gray-500 mb-2">{event.date} &bull; {event.venue}</div>
                                                    <p className="text-gray-700 bg-gray-50 p-3 rounded text-sm">
                                                        {event.resultsSummary || "Results are still being verified for this event."}
                                                    </p>
                                                </div>
                                                <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded ${event.resultsSummary ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                        {event.resultsSummary ? 'COMPLETED' : 'PAST EVENT'}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <TrophyIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                <p className="text-gray-500">No recent results available.</p>
                                <Button onClick={() => setShowReportModal(true)} className="mt-4 text-sm bg-white border border-green-600 text-green-600 hover:bg-green-50">
                                    Be the first to submit a result
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'submit' && (
                    <Card className="shadow-xl bg-white max-w-3xl mx-auto">
                        <CardContent className="p-8">
                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-bold font-display text-green-800">
                                    {isEditingEvent ? 'Edit Event Details' : 'Submit Your Event'}
                                </h3>
                                <p className="text-gray-600">Give your tournament or activity national visibility.</p>
                            </div>

                            {submitSuccess ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center animate-fade-in">
                                    <CheckCircleIcon className="w-12 h-12 text-green-600 mx-auto mb-3" />
                                    <h4 className="text-lg font-bold text-green-800">Submission Received!</h4>
                                    <p className="text-green-700">Your event has been sent for review. Once approved, it will appear on the Community Hub.</p>
                                    <Button onClick={() => setSubmitSuccess(false)} className="mt-4 bg-green-600 text-white">Submit Another</Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {isEditingEvent && (
                                        <div className="bg-blue-50 text-blue-700 p-3 rounded flex justify-between items-center">
                                            <span>Editing event mode active</span>
                                            <button type="button" onClick={resetForm} className="text-sm font-bold hover:underline">Cancel Edit</button>
                                        </div>
                                    )}

                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <h4 className="font-bold text-sm text-gray-700 mb-3 uppercase tracking-wider">Event Details</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Event Name *</label>
                                                <input name="title" value={formData.title} onChange={handleInputChange} required className={inputClass} placeholder="e.g. Mhlume Youth Cup" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Event Type *</label>
                                                <select name="eventType" value={formData.eventType} onChange={handleInputChange} className={inputClass}>
                                                    <option>Knockout</option>
                                                    <option>League</option>
                                                    <option>Festival</option>
                                                    <option>Charity</option>
                                                    <option>Trial</option>
                                                    <option>Workshop</option>
                                                    <option>Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Date *</label>
                                                <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className={inputClass} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Time *</label>
                                                <input type="time" name="time" value={formData.time} onChange={handleInputChange} required className={inputClass} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Venue *</label>
                                                <input name="venue" value={formData.venue} onChange={handleInputChange} required className={inputClass} placeholder="e.g. Community Sports Ground" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Description *</label>
                                                <textarea name="description" value={formData.description} onChange={handleInputChange} required rows={3} className={inputClass} placeholder="Briefly describe the event format, teams involved, etc." />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <h4 className="font-bold text-sm text-gray-700 mb-3 uppercase tracking-wider">Organizer Contact</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Host Organization/Club</label>
                                                <input name="organizer" value={formData.organizer} onChange={handleInputChange} required className={inputClass} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Contact Person Name</label>
                                                <input name="contactName" value={formData.contactName} onChange={handleInputChange} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number</label>
                                                <input name="contactPhone" value={formData.contactPhone} onChange={handleInputChange} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Email (Optional)</label>
                                                <input name="contactEmail" type="email" value={formData.contactEmail} onChange={handleInputChange} className={inputClass} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <h4 className="font-bold text-sm text-gray-700 mb-3 uppercase tracking-wider">Extras</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Prizes / Awards</label>
                                                <input name="prizes" value={formData.prizes} onChange={handleInputChange} className={inputClass} placeholder="e.g. Trophy + E5000" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Registration Fee</label>
                                                <input name="fees" value={formData.fees} onChange={handleInputChange} className={inputClass} placeholder="e.g. E500 per team" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Poster / Image Upload</label>
                                                <div className="flex items-center gap-3">
                                                    <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
                                                    {formData.posterUrl && <img src={formData.posterUrl} alt="Preview" className="h-12 w-12 object-cover rounded border" />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right pt-2">
                                        <Button type="submit" disabled={isSubmitting} className="bg-green-600 text-white hover:bg-green-700 px-8 py-3 h-auto text-base shadow-md w-full sm:w-auto">
                                            {isSubmitting ? <Spinner className="w-5 h-5 border-2" /> : (isEditingEvent ? 'Save Changes' : 'Submit Event for Review')}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Report Result Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowReportModal(false)}>
                    <Card className="w-full max-w-md relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowReportModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"><XIcon className="w-6 h-6"/></button>
                        <CardContent className="p-8">
                            <h2 className="text-2xl font-bold font-display mb-4 text-green-900">Report Score / Result</h2>
                            <p className="text-sm text-gray-600 mb-6">Select a community event and tell us the outcome.</p>
                            
                            <form onSubmit={handleReportSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Select Active Event</label>
                                    <select 
                                        value={reportForm.eventId} 
                                        onChange={e => setReportForm({...reportForm, eventId: e.target.value})} 
                                        className={inputClass}
                                        required
                                    >
                                        <option value="" disabled>-- Choose Event --</option>
                                        {eventsPendingResults.map(e => (
                                            <option key={e.id} value={e.id}>{e.title} ({e.date})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Result Summary</label>
                                    <textarea 
                                        value={reportForm.resultsSummary} 
                                        onChange={e => setReportForm({...reportForm, resultsSummary: e.target.value})} 
                                        className={inputClass} 
                                        rows={4} 
                                        placeholder="e.g. Mhlume Youngsters won 2-1 against Vuvulane Stars. Goals by..."
                                        required
                                    />
                                </div>
                                <div className="text-right">
                                    <Button type="submit" disabled={isReporting} className="w-full bg-green-600 text-white hover:bg-green-700">
                                        {isReporting ? <Spinner className="w-4 h-4 border-2" /> : 'Submit Result'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Event Details View Modal */}
            {viewEvent && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewEvent(null)}>
                    <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden relative animate-slide-up flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setViewEvent(null)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 bg-white rounded-full p-1 z-20 shadow-sm"><XIcon className="w-6 h-6"/></button>
                        
                        {/* Image Side */}
                        <div className="w-full md:w-5/12 bg-gray-900 relative flex items-center justify-center min-h-[300px] md:min-h-full">
                             {viewEvent.posterUrl ? (
                                <img src={viewEvent.posterUrl} alt={viewEvent.title} className="w-full h-full object-contain max-h-[50vh] md:max-h-full" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                    <TrophyIcon className="w-24 h-24" />
                                </div>
                            )}
                             <div className="absolute top-4 left-4 bg-white/90 text-green-800 text-xs font-bold px-3 py-1 rounded shadow-sm uppercase tracking-wide z-10">
                                {viewEvent.eventType}
                            </div>
                        </div>

                        {/* Content Side */}
                        <div className="w-full md:w-7/12 overflow-y-auto max-h-[50vh] md:max-h-[90vh] bg-white">
                            <CardContent className="p-6 md:p-8">
                                <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">{viewEvent.title}</h2>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6 border-b pb-6">
                                    <span className="flex items-center gap-1"><CalendarIcon className="w-4 h-4 text-green-600"/> {viewEvent.date} @ {viewEvent.time}</span>
                                    <span className="flex items-center gap-1"><MapPinIcon className="w-4 h-4 text-green-600"/> {viewEvent.venue}</span>
                                    <span className="flex items-center gap-1"><UsersIcon className="w-4 h-4 text-green-600"/> {viewEvent.organizer}</span>
                                </div>
                                
                                <div className="prose text-gray-700 mb-6">
                                    <h4 className="font-bold text-gray-900 text-sm uppercase mb-2">Event Details</h4>
                                    <p className="whitespace-pre-wrap leading-relaxed text-sm">{viewEvent.description}</p>
                                </div>

                                {viewEvent.resultsSummary && (
                                    <div className="bg-gray-100 p-4 rounded-lg border-l-4 border-gray-600 mb-6">
                                        <h4 className="font-bold text-gray-800 mb-1">Final Outcome</h4>
                                        <p>{viewEvent.resultsSummary}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-green-50 p-4 rounded-lg border border-green-100">
                                    <div>
                                        <p className="text-xs font-bold text-green-700 uppercase">Prizes & Awards</p>
                                        <p className="text-sm">{viewEvent.prizes || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-green-700 uppercase">Registration Fees</p>
                                        <p className="text-sm">{viewEvent.fees || 'N/A'}</p>
                                    </div>
                                    {(viewEvent.contactName || viewEvent.contactPhone) && (
                                        <div className="sm:col-span-2 pt-2 border-t border-green-200 mt-2">
                                             <p className="text-xs font-bold text-green-700 uppercase">Contact Organizer</p>
                                             <p className="text-sm font-semibold">{viewEvent.contactName} {viewEvent.contactPhone && <span>• <a href={`tel:${viewEvent.contactPhone}`} className="text-blue-600 hover:underline">{viewEvent.contactPhone}</a></span>}</p>
                                             {viewEvent.contactEmail && <p className="text-sm"><a href={`mailto:${viewEvent.contactEmail}`} className="text-blue-600 hover:underline">{viewEvent.contactEmail}</a></p>}
                                        </div>
                                    )}
                                </div>

                            </CardContent>
                        </div>
                    </Card>
                </div>
            )}
        </section>
    );
};

export default CommunityHub;