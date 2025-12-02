
import React, { useState, useEffect } from 'react';
import { CompetitionFixture, MatchEvent } from '../data/teams';
import MapPinIcon from './icons/MapPinIcon';
import UserIcon from './icons/UserIcon';
import GoalIcon from './icons/GoalIcon';
import CardIcon from './icons/CardIcon';
import ClockIcon from './icons/ClockIcon';
import FormGuide from './ui/FormGuide';
import SubstitutionIcon from './icons/SubstitutionIcon';
import { useAuth } from '../contexts/AuthContext';
import { FixtureComment, addFixtureComment, listenToFixtureComments, Competition, handleFirestoreError } from '../services/api';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import MessageSquareIcon from './icons/MessageSquareIcon';
import { db } from '../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { removeUndefinedProps } from '../services/utils';
import PlusCircleIcon from './icons/PlusCircleIcon';
import PhotoIcon from './icons/PhotoIcon';
import XIcon from './icons/XIcon';

const EventIcon: React.FC<{ type: MatchEvent['type'] }> = ({ type }) => {
    switch (type) {
        case 'goal': return <GoalIcon className="w-4 h-4 text-green-600" />;
        case 'yellow-card': return <CardIcon className="w-4 h-4 text-yellow-500" />;
        case 'red-card': return <CardIcon className="w-4 h-4 text-red-600" />;
        case 'substitution': return <SubstitutionIcon className="w-4 h-4 text-blue-500" />;
        default: return <ClockIcon className="w-4 h-4 text-gray-500" />;
    }
};

function formatTimeAgo(timestamp: { seconds: number } | null): string {
  if (!timestamp) return '';
  const now = new Date();
  const commentDate = new Date(timestamp.seconds * 1000);
  const seconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000);

  if (seconds < 0) return 'just now'; // Handle minor clock differences

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

const FixtureDetail: React.FC<{ fixture: CompetitionFixture, competitionId: string }> = ({ fixture, competitionId }) => {
    const sortedEvents = fixture.events ? [...fixture.events].sort((a, b) => a.minute - b.minute) : [];
    const { user, isLoggedIn, openAuthModal } = useAuth();
    const [comments, setComments] = useState<FixtureComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    
    // State for adding match events
    const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
    const [newEvent, setNewEvent] = useState({ minute: '', type: 'goal' as MatchEvent['type'], description: '' });

    // State for gallery lightbox
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const canAddEvent = user && (user.role === 'super_admin' || user.role === 'club_admin');

    useEffect(() => {
        const unsubscribe = listenToFixtureComments(fixture.id, setComments);
        return () => unsubscribe();
    }, [fixture.id]);

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;
        setIsSubmittingComment(true);
        try {
            await addFixtureComment(fixture.id, newComment.trim(), user);
            setNewComment('');
        } catch (error) {
            // Error is handled by API layer
        } finally {
            setIsSubmittingComment(false);
        }
    };
    
    const handleEventInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewEvent(prev => ({ ...prev, [name]: value }));
    };
    
    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEvent.minute || !newEvent.description) {
            alert("Please fill in all event details.");
            return;
        }

        setIsSubmittingEvent(true);
        
        const docRef = doc(db, 'competitions', competitionId);
        try {
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Competition not found");

                const competition = docSnap.data() as Competition;
                // The fixture is in `fixtures` array because it's live
                const fixtureIndex = (competition.fixtures || []).findIndex(f => f.id === fixture.id);
                if (fixtureIndex === -1) throw new Error("Live fixture not found. It may have already finished.");

                const updatedFixtures = [...competition.fixtures];
                const fixtureToUpdate = updatedFixtures[fixtureIndex];
                
                const eventToAdd: MatchEvent = {
                    minute: parseInt(newEvent.minute),
                    type: newEvent.type,
                    description: newEvent.description,
                };

                const updatedEvents = [...(fixtureToUpdate.events || []), eventToAdd];
                fixtureToUpdate.events = updatedEvents;

                transaction.update(docRef, { fixtures: removeUndefinedProps(updatedFixtures) });
            });
            
            // Reset form
            setNewEvent({ minute: '', type: 'goal', description: '' });

        } catch (error) {
            handleFirestoreError(error, 'add match event');
        } finally {
            setIsSubmittingEvent(false);
        }
    };


    return (
        <div className="bg-gray-100/70 p-4 md:p-6 animate-slide-down">
             <style>{`
                @keyframes slide-down {
                    from { opacity: 0; transform: translateY(-10px); max-height: 0; }
                    to { opacity: 1; transform: translateY(0); max-height: 2000px; /* Increased max-height */ }
                }
                .animate-slide-down { 
                    animation: slide-down 0.4s ease-out forwards;
                    overflow: hidden;
                }
            `}</style>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Match Info */}
                <div className="space-y-3">
                    <h4 className="font-bold text-sm text-gray-800 border-b pb-2">Match Info</h4>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <MapPinIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <div>
                            <p className="font-semibold">Venue</p>
                            <p>{fixture.venue || 'TBA'}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3 text-sm text-gray-600">
                        <UserIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <div>
                            <p className="font-semibold">Referee</p>
                            <p>{fixture.referee || 'TBA'}</p>
                        </div>
                    </div>
                </div>

                {/* Team Form */}
                <div className="space-y-3">
                     <h4 className="font-bold text-sm text-gray-800 border-b pb-2">Recent Form (Last 5)</h4>
                     <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-gray-700">{fixture.teamA}</span>
                        {fixture.teamAForm && <FormGuide form={fixture.teamAForm} />}
                     </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-gray-700">{fixture.teamB}</span>
                        {fixture.teamBForm && <FormGuide form={fixture.teamBForm} />}
                     </div>
                </div>

                {/* Live Stats */}
                <div className="space-y-3">
                     <h4 className="font-bold text-sm text-gray-800 border-b pb-2">Match Statistics</h4>
                     {fixture.status === 'live' || fixture.status === 'finished' ? (
                        <div className="text-sm space-y-2">
                           <div className="flex justify-between"><span>Possession</span> <span>{fixture.teamA} 58% - 42% {fixture.teamB}</span></div>
                           <div className="flex justify-between"><span>Shots on Target</span> <span>4 - 2</span></div>
                           <div className="flex justify-between"><span>Corners</span> <span>6 - 3</span></div>
                        </div>
                     ) : (
                         <p className="text-sm text-gray-500 italic">
                            {['postponed', 'cancelled', 'abandoned', 'suspended'].includes(fixture.status || '') 
                                ? `Match ${fixture.status}. Statistics unavailable.`
                                : "Statistics will be available when the match starts."}
                        </p>
                     )}
                </div>
            </div>

            {(fixture.status === 'live' || fixture.status === 'finished') && sortedEvents.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                    <h4 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
                        <ClockIcon className="w-5 h-5 text-gray-500" />
                        Match Timeline
                    </h4>
                    <div className="max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300">
                        <ul className="space-y-0 relative pb-2">
                            <div className="absolute left-[2.5rem] top-3 bottom-3 w-0.5 bg-gray-200 -ml-px z-0"></div>
                            {sortedEvents.map((event, index) => (
                               <li key={index} className="group relative flex items-start gap-4 pb-6 last:pb-0 animate-fade-in z-10">
                                   <div className="w-10 text-right font-mono text-sm font-bold text-gray-500 pt-1">
                                       {event.minute}'
                                   </div>
                                   <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-white rounded-full border-2 border-gray-100 shadow-sm">
                                       <EventIcon type={event.type} />
                                   </div>
                                   <div className="flex-1 pt-1.5">
                                       <p className="text-sm font-medium text-gray-900">{event.description}</p>
                                   </div>
                               </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
            
            {/* Match Gallery Section */}
            {fixture.galleryImages && fixture.galleryImages.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                    <h4 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
                        <PhotoIcon className="w-5 h-5 text-gray-500" />
                        Match Gallery
                    </h4>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {fixture.galleryImages.map((imgUrl, index) => (
                            <button 
                                key={index} 
                                onClick={() => setSelectedImage(imgUrl)}
                                className="flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <img src={imgUrl} alt={`Match photo ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {canAddEvent && fixture.status === 'live' && (
                <div className="mt-6 pt-4 border-t">
                    <h4 className="font-bold text-sm text-gray-800 mb-3">Add Match Event</h4>
                    <form onSubmit={handleAddEvent} className="p-4 bg-white rounded-lg border space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-[80px_1fr_2fr] gap-3 items-end">
                            <div>
                                <label htmlFor="minute" className="block text-xs font-medium text-gray-600 mb-1">Minute</label>
                                <input type="number" id="minute" name="minute" value={newEvent.minute} onChange={handleEventInputChange} className="block w-full text-sm p-2 border border-gray-300 rounded-md" required />
                            </div>
                            <div>
                                <label htmlFor="type" className="block text-xs font-medium text-gray-600 mb-1">Event Type</label>
                                <select id="type" name="type" value={newEvent.type} onChange={handleEventInputChange} className="block w-full text-sm p-2 border border-gray-300 rounded-md">
                                    <option value="goal">Goal</option>
                                    <option value="yellow-card">Yellow Card</option>
                                    <option value="red-card">Red Card</option>
                                    <option value="substitution">Substitution</option>
                                    <option value="info">Info</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                                <input type="text" id="description" name="description" value={newEvent.description} onChange={handleEventInputChange} className="block w-full text-sm p-2 border border-gray-300 rounded-md" required placeholder="e.g., Goal by K. Moloto"/>
                            </div>
                        </div>
                        <div className="text-right">
                            <Button type="submit" disabled={isSubmittingEvent} className="bg-primary text-white h-9 px-4 text-xs inline-flex items-center justify-center gap-2">
                                {isSubmittingEvent ? <Spinner className="w-4 h-4 border-2" /> : <PlusCircleIcon className="w-4 h-4" />} Add Event
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="mt-6 pt-4 border-t">
                <h4 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
                    <MessageSquareIcon className="w-5 h-5 text-gray-500" />
                    Comments ({comments.length})
                </h4>
                <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                    {comments.length > 0 ? comments.map(comment => (
                        <div key={comment.id} className="flex items-start gap-3 text-sm">
                            <img src={comment.userAvatar} alt={comment.userName} className="w-8 h-8 rounded-full" />
                            <div className="flex-1 bg-white p-3 rounded-lg">
                                <div className="flex items-baseline gap-2">
                                    <p className="font-semibold">{comment.userName}</p>
                                    <p className="text-xs text-gray-500">{formatTimeAgo(comment.timestamp)}</p>
                                </div>
                                <p className="text-gray-700">{comment.text}</p>
                            </div>
                        </div>
                    )) : (
                        <p className="text-sm text-gray-500 text-center py-4">No comments yet. Be the first to post!</p>
                    )}
                </div>
                
                <div className="mt-4">
                    {isLoggedIn && user ? (
                        <form onSubmit={handleCommentSubmit} className="flex items-start gap-3">
                             <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                            <div className="flex-1">
                                <textarea 
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Add your comment..."
                                    rows={2}
                                    className="block w-full text-sm p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                                <Button type="submit" disabled={isSubmittingComment || !newComment.trim()} className="mt-2 bg-primary text-white hover:bg-primary-dark h-8 px-3 text-xs">
                                    {isSubmittingComment ? <Spinner className="w-4 h-4 border-2" /> : 'Post Comment'}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="text-center p-4 bg-white rounded-lg border">
                            <p className="text-sm text-gray-600">You must be logged in to comment.</p>
                             <Button onClick={openAuthModal} className="mt-2 bg-primary-light text-white text-xs px-3 py-1.5">
                                Log In to Comment
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setSelectedImage(null)}
                >
                    <button 
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300"
                    >
                        <XIcon className="w-8 h-8" />
                    </button>
                    <img 
                        src={selectedImage} 
                        alt="Match gallery" 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default FixtureDetail;
