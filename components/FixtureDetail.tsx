
import React, { useState, useEffect, useRef } from 'react';
import { CompetitionFixture, MatchEvent, Player } from '../data/teams';
import MapPinIcon from './icons/MapPinIcon';
import UserIcon from './icons/UserIcon';
import GoalIcon from './icons/GoalIcon';
import CardIcon from './icons/CardIcon';
import ClockIcon from './icons/ClockIcon';
import FormGuide from './ui/FormGuide';
import SubstitutionIcon from './icons/SubstitutionIcon';
// Added missing WhistleIcon import
import WhistleIcon from './icons/WhistleIcon';
import { useAuth } from '../contexts/AuthContext';
import { FixtureComment, addFixtureComment, listenToFixtureComments } from '../services/api';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import MessageSquareIcon from './icons/MessageSquareIcon';
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

const FixtureDetail: React.FC<{ fixture: CompetitionFixture, competitionId: string }> = ({ fixture, competitionId }) => {
    const { user, isLoggedIn, openAuthModal, addXP } = useAuth();
    const [activeSection, setActiveSection] = useState<'info' | 'chat' | 'ratings'>('info');
    const [comments, setComments] = useState<FixtureComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
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
            addXP(5); 
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const sortedEvents = fixture.events ? [...fixture.events].sort((a, b) => (a.minute || 0) - (b.minute || 0)) : [];
    
    const isLive = fixture.status === 'live';
    const isFinished = fixture.status === 'finished';
    const showScore = isLive || isFinished;

    return (
        <div className="bg-white p-0 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 rounded-b-xl border-t border-gray-200 shadow-inner">
            {/* Expanded Header: Status and Score */}
            <div className="bg-slate-900 text-white p-6 text-center border-b border-white/10">
                <div className="flex flex-col items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-0.5 rounded-full ${isLive ? 'bg-red-600 animate-pulse' : 'bg-gray-700'}`}>
                        {fixture.status === 'scheduled' ? 'Scheduled' : fixture.status?.toUpperCase() || 'Match Center'}
                        {isLive && ` • ${fixture.liveMinute || '0'}'`}
                    </span>
                    
                    {showScore && (
                        <div className="flex items-center gap-8 my-2">
                            <div className="text-right flex-1">
                                <p className="text-xl font-bold truncate max-w-[150px]">{fixture.teamA}</p>
                            </div>
                            <div className="bg-white/10 px-6 py-2 rounded-xl border border-white/10">
                                <span className="text-4xl font-black tabular-nums tracking-tighter text-accent">
                                    {fixture.scoreA ?? 0} : {fixture.scoreB ?? 0}
                                </span>
                            </div>
                            <div className="text-left flex-1">
                                <p className="text-xl font-bold truncate max-w-[150px]">{fixture.teamB}</p>
                            </div>
                        </div>
                    )}
                    
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
                        {fixture.fullDate} • {fixture.time}
                    </p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-gray-50 border-b border-gray-200 px-4">
                <button 
                    onClick={() => setActiveSection('info')}
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeSection === 'info' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}
                >
                    Match Center
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
                        Fan Ratings
                    </button>
                )}
            </div>

            <div className="p-4 md:p-6 min-h-[350px] bg-white">
                {activeSection === 'info' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in fade-in duration-500">
                        {/* Timeline Column */}
                        <div className="md:col-span-7 space-y-6">
                            <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4 border-b pb-2">Timeline</h4>
                            {sortedEvents.length > 0 ? (
                                <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
                                    {sortedEvents.map((event, idx) => (
                                        <div key={idx} className="flex items-start gap-6 relative pl-10">
                                            <div className="absolute left-[13px] top-1 bg-white border-2 border-gray-200 rounded-full w-2.5 h-2.5 z-10"></div>
                                            <span className="font-mono font-black text-gray-400 text-sm w-10 flex-shrink-0">{event.minute}'</span>
                                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex-grow shadow-sm">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <EventIcon type={event.type} />
                                                    <p className="font-black text-gray-900 uppercase text-[10px] tracking-tight">{event.type.replace('-', ' ')}</p>
                                                </div>
                                                <p className="text-sm text-gray-700 font-medium">{event.description}</p>
                                                {event.playerName && <p className="text-xs text-primary font-bold mt-1.5">{event.playerName}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed">
                                    <ClockIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="italic text-sm">Waiting for match action...</p>
                                </div>
                            )}
                        </div>

                        {/* Metadata Column */}
                        <div className="md:col-span-5 space-y-8">
                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-sm">
                                <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4">Technical Info</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 text-sm text-gray-700">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border shadow-sm"><MapPinIcon className="w-5 h-5 text-gray-400" /></div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-gray-400">Venue</p>
                                            <p className="font-bold">{fixture.venue || 'Mavuso Sports Centre'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-700">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border shadow-sm"><WhistleIcon className="w-5 h-5 text-gray-400" /></div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-gray-400">Match Official</p>
                                            <p className="font-bold">Ref: {fixture.referee || 'TBA'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">Recent Form</h4>
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-800 truncate pr-2">{fixture.teamA}</span>
                                    <FormGuide form={fixture.teamAForm || 'W D L W W'} />
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-800 truncate pr-2">{fixture.teamB}</span>
                                    <FormGuide form={fixture.teamBForm || 'L L D W D'} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'chat' && (
                    <div className="flex flex-col h-[450px] animate-in fade-in duration-500">
                        <div className="flex-grow overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                            {comments.length > 0 ? comments.map((comment) => (
                                <div key={comment.id} className={`flex gap-3 ${comment.userId === user?.id ? 'flex-row-reverse' : ''}`}>
                                    <img src={comment.userAvatar} className="w-8 h-8 rounded-full border border-gray-200 shadow-sm" alt="" />
                                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${comment.userId === user?.id ? 'bg-primary text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200 shadow-sm'}`}>
                                        <div className="flex justify-between items-center gap-4 mb-1">
                                            <span className="font-black text-[9px] uppercase opacity-70 tracking-widest">{comment.userName}</span>
                                        </div>
                                        <p className="leading-relaxed font-medium">{comment.text}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <MessageSquareIcon className="w-12 h-12 opacity-10 mb-2" />
                                    <p className="text-sm font-bold tracking-tight">BE THE FIRST TO SHOUT!</p>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        
                        <form onSubmit={handleCommentSubmit} className="flex gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-200">
                            <input 
                                type="text" 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder={isLoggedIn ? "Say something..." : "Log in to join the chat"}
                                disabled={!isLoggedIn}
                                className="flex-grow bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none shadow-sm"
                            />
                            <Button 
                                type="submit" 
                                disabled={!isLoggedIn || !newComment.trim() || isSubmittingComment}
                                className="bg-primary text-white p-2 rounded-xl hover:scale-105 transition-transform disabled:opacity-50 shadow-md flex-shrink-0"
                            >
                                {isSubmittingComment ? <Spinner className="w-5 h-5 border-2" /> : <SendIcon className="w-5 h-5" />}
                            </Button>
                        </form>
                    </div>
                )}

                {activeSection === 'ratings' && (
                    <div className="animate-in fade-in duration-500">
                        <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-200 mb-8 flex items-center gap-4 shadow-sm">
                            <div className="bg-yellow-400 p-3 rounded-full shadow-lg"><StarIcon className="w-6 h-6 text-yellow-900" /></div>
                            <div>
                                <h4 className="font-black text-yellow-900 uppercase text-xs tracking-widest">Crowd MVP</h4>
                                <p className="text-sm text-yellow-800 font-medium">Rate the performance of every player to crown the Fan's Man of the Match!</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h5 className="font-black text-xs uppercase tracking-[0.3em] text-primary border-b-2 border-primary/10 pb-2">{fixture.teamA} Roster</h5>
                                <div className="grid gap-2">
                                    <p className="text-[10px] text-gray-400 italic bg-gray-50 p-4 rounded-xl border border-dashed">Select players from the team roster to submit your ratings.</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h5 className="font-black text-xs uppercase tracking-[0.3em] text-secondary border-b-2 border-secondary/10 pb-2">{fixture.teamB} Roster</h5>
                                <div className="grid gap-2">
                                    <p className="text-[10px] text-gray-400 italic bg-gray-50 p-4 rounded-xl border border-dashed">Select players from the team roster to submit your ratings.</p>
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
