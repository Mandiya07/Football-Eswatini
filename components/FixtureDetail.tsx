import React, { useState, useEffect, useRef } from 'react';
import { CompetitionFixture, MatchEvent, Player } from '../data/teams';
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
import { doc, runTransaction, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { removeUndefinedProps } from '../services/utils';
import PlusCircleIcon from './icons/PlusCircleIcon';
import PhotoIcon from './icons/PhotoIcon';
import XIcon from './icons/XIcon';
import StarIcon from './icons/StarIcon';
import SendIcon from './icons/SendIcon';

const EventIcon: React.FC<{ type: MatchEvent['type'] }> = ({ type }) => {
    switch (type) {
        case 'goal': return <GoalIcon className="w-4 h-4 text-green-600" />;
        case 'yellow-card': return <CardIcon className="w-4 h-4 text-yellow-500" />;
        case 'red-card': return <CardIcon className="w-4 h-4 text-red-600" />;
        case 'substitution': return <SubstitutionIcon className="w-4 h-4 text-blue-500" />;
        default: return <ClockIcon className="w-4 h-4 text-gray-500" />;
    }
};

const PlayerRatingItem: React.FC<{ player: Player; rating: number; onRate: (id: number, val: number) => void }> = ({ player, rating, onRate }) => (
    <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-[10px] font-bold text-gray-400 w-4">#{player.number}</span>
            <span className="text-xs font-semibold truncate">{player.name}</span>
        </div>
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button 
                    key={star} 
                    onClick={() => onRate(player.id, star)}
                    className={`transition-colors ${star <= rating ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-200'}`}
                >
                    <StarIcon className="w-3.5 h-3.5 fill-current" />
                </button>
            ))}
        </div>
    </div>
);

const FixtureDetail: React.FC<{ fixture: CompetitionFixture, competitionId: string }> = ({ fixture, competitionId }) => {
    const { user, isLoggedIn, openAuthModal, addXP } = useAuth();
    const [activeSection, setActiveSection] = useState<'info' | 'chat' | 'ratings'>('info');
    const [comments, setComments] = useState<FixtureComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [ratings, setRatings] = useState<Record<number, number>>({});
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = listenToFixtureComments(fixture.id, setComments);
        return () => unsubscribe();
    }, [fixture.id]);

    useEffect(() => {
        if (activeSection === 'chat') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [comments, activeSection]);

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;
        setIsSubmittingComment(true);
        try {
            await addFixtureComment(fixture.id, newComment.trim(), user);
            setNewComment('');
            addXP(5); // Reward for engagement
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleRatePlayer = (playerId: number, rating: number) => {
        if (!isLoggedIn) return openAuthModal();
        setRatings(prev => ({ ...prev, [playerId]: rating }));
        // In a real app, this would also save to Firestore
    };

    const sortedEvents = fixture.events ? [...fixture.events].sort((a, b) => a.minute - b.minute) : [];

    return (
        <div className="bg-gray-100/70 p-0 overflow-hidden animate-slide-down rounded-b-xl border-t border-gray-200">
            {/* Tab Navigation */}
            <div className="flex bg-white/50 backdrop-blur-sm border-b border-gray-200 px-4">
                <button 
                    onClick={() => setActiveSection('info')}
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeSection === 'info' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}
                >
                    Match Info
                </button>
                <button 
                    onClick={() => setActiveSection('chat')}
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${activeSection === 'chat' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}
                >
                    Live Chat <span className="bg-primary/10 text-primary px-1.5 rounded-full text-[10px]">{comments.length}</span>
                </button>
                {fixture.status === 'finished' && (
                    <button 
                        onClick={() => setActiveSection('ratings')}
                        className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeSection === 'ratings' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}
                    >
                        Rate Players
                    </button>
                )}
            </div>

            <div className="p-4 md:p-6 min-h-[300px]">
                {activeSection === 'info' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-bold text-sm text-gray-800 border-b pb-2 mb-3">Match Details</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <MapPinIcon className="w-5 h-5 text-gray-400" />
                                        <span>{fixture.venue || 'Mavuso Sports Centre'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <UserIcon className="w-5 h-5 text-gray-400" />
                                        <span>Referee: {fixture.referee || 'TBA'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {sortedEvents.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-sm text-gray-800 border-b pb-2 mb-3">Timeline</h4>
                                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                        {sortedEvents.map((event, idx) => (
                                            <div key={idx} className="flex items-start gap-3 text-xs">
                                                <span className="font-bold w-6">{event.minute}'</span>
                                                <EventIcon type={event.type} />
                                                <span className="text-gray-700">{event.description}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-bold text-sm text-gray-800 border-b pb-2">Recent Form (Last 5)</h4>
                            <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100">
                                <span className="text-sm font-semibold">{fixture.teamA}</span>
                                <FormGuide form={fixture.teamAForm || 'W D L W W'} />
                            </div>
                            <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100">
                                <span className="text-sm font-semibold">{fixture.teamB}</span>
                                <FormGuide form={fixture.teamBForm || 'L L D W D'} />
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'chat' && (
                    <div className="flex flex-col h-[400px] animate-fade-in">
                        <div className="flex-grow overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                            {comments.length > 0 ? comments.map((comment) => (
                                <div key={comment.id} className={`flex gap-3 ${comment.userId === user?.id ? 'flex-row-reverse' : ''}`}>
                                    <img src={comment.userAvatar} className="w-8 h-8 rounded-full border border-gray-200" alt="" />
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${comment.userId === user?.id ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none shadow-sm'}`}>
                                        <div className="flex justify-between items-center gap-4 mb-1">
                                            <span className="font-bold text-[10px] uppercase opacity-70">{comment.userName}</span>
                                        </div>
                                        <p className="leading-relaxed">{comment.text}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <MessageSquareIcon className="w-12 h-12 opacity-20 mb-2" />
                                    <p className="text-sm">Be the first to join the discussion!</p>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        
                        <form onSubmit={handleCommentSubmit} className="flex gap-2">
                            <input 
                                type="text" 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder={isLoggedIn ? "Say something..." : "Log in to chat"}
                                disabled={!isLoggedIn}
                                className="flex-grow bg-white border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                            />
                            <Button 
                                type="submit" 
                                disabled={!isLoggedIn || !newComment.trim() || isSubmittingComment}
                                className="bg-primary text-white p-2 rounded-full hover:scale-105 transition-transform disabled:opacity-50"
                            >
                                {isSubmittingComment ? <Spinner className="w-5 h-5 border-2" /> : <SendIcon className="w-5 h-5" />}
                            </Button>
                        </form>
                    </div>
                )}

                {activeSection === 'ratings' && (
                    <div className="animate-fade-in">
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 mb-6 flex items-center gap-3">
                            <StarIcon className="w-6 h-6 text-yellow-500" />
                            <p className="text-sm text-yellow-800">Match finished! Rate the players to crown the Fan's Man of the Match.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <h5 className="font-bold text-xs uppercase tracking-widest text-primary border-b pb-1">{fixture.teamA}</h5>
                                <div className="grid gap-2">
                                    {/* These would normally come from the competition data teams[0].players */}
                                    <p className="text-[10px] text-gray-400 italic">Select players from the team roster to rate them.</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h5 className="font-bold text-xs uppercase tracking-widest text-secondary border-b pb-1">{fixture.teamB}</h5>
                                <div className="grid gap-2">
                                    {/* Same for away team */}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FixtureDetail;
