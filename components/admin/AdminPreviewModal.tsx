import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';
import ShieldCheckIcon from '../icons/ShieldCheckIcon';
import BuildingIcon from '../icons/BuildingIcon';
import MegaphoneIcon from '../icons/MegaphoneIcon';
import FileTextIcon from '../icons/FileTextIcon';
import TrophyIcon from '../icons/TrophyIcon';
import CalendarIcon from '../icons/CalendarIcon';
import UsersIcon from '../icons/UsersIcon';
import ArrowRightIcon from '../icons/ArrowRightIcon';
import SparklesIcon from '../icons/SparklesIcon';
import NationalTeamIcon from '../icons/NationalTeamIcon';
import NewspaperIcon from '../icons/NewspaperIcon';
import InfoIcon from '../icons/InfoIcon';

interface AdminPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'news' | 'communication' | 'event' | 'competition' | 'squad';
    data: any;
}

const AdminPreviewModal: React.FC<AdminPreviewModalProps> = ({ isOpen, onClose, type, data }) => {
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

    if (!isOpen || !data) return null;

    const renderIcon = (iconType?: string) => {
        switch(iconType) {
            case 'shield': return <ShieldCheckIcon className="w-6 h-6 text-blue-600" />;
            case 'building': return <BuildingIcon className="w-6 h-6 text-blue-600" />;
            case 'megaphone': return <MegaphoneIcon className="w-6 h-6 text-blue-600" />;
            default: return <FileTextIcon className="w-6 h-6 text-blue-600" />;
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Date TBD';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div 
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className={`bg-slate-950 text-white border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 text-emerald-400">
                            <SparklesIcon className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="font-display font-black text-lg tracking-tight">EFA Hub Live Public Preview</h3>
                            <p className="text-xs text-slate-400 font-medium">Verify visual appeal and details before final publication.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {/* Device Toggle */}
                        <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex gap-1 text-xs">
                            <button 
                                onClick={() => setViewMode('desktop')}
                                className={`px-3 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all ${viewMode === 'desktop' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                Desktop
                            </button>
                            <button 
                                onClick={() => setViewMode('mobile')}
                                className={`px-3 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all ${viewMode === 'mobile' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                Mobile
                            </button>
                        </div>

                        <button 
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-slate-800"
                            aria-label="Close preview"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-slate-900/40 p-6 md:p-8 overflow-y-auto flex-grow flex items-center justify-center">
                    <div className={`transition-all duration-300 w-full ${viewMode === 'mobile' ? 'max-w-md border-x-4 border-t-4 border-b-[12px] border-slate-800 rounded-[2.5rem] bg-gray-50 text-slate-900 p-6 min-h-[500px] shadow-inner relative' : 'bg-gray-50 text-slate-900 p-8 rounded-2xl w-full min-h-[300px]'}`}>
                        
                        {/* Mobile Status Bar Mock */}
                        {viewMode === 'mobile' && (
                            <div className="absolute top-2 left-0 right-0 flex justify-between px-6 text-[10px] font-black text-slate-400 select-none uppercase tracking-widest">
                                <span>EFA Hub Mobile</span>
                                <span>12:00 PM</span>
                            </div>
                        )}

                        <div className={`h-full flex flex-col justify-center ${viewMode === 'mobile' ? 'pt-4' : ''}`}>
                            {/* Context Notice Badge */}
                            <div className="mb-6 flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm">
                                <InfoIcon className="w-4 h-4 flex-shrink-0 text-blue-600" />
                                <span>This is an exact visual simulation of how this item will be styled in public views.</span>
                            </div>

                            {/* 1. EFA Communication Preview */}
                            {type === 'communication' && (
                                <div className="space-y-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Notice Card Render:</span>
                                    <Card className="hover:shadow-2xl transition-all border-0 shadow-lg overflow-hidden group rounded-[2rem] bg-white">
                                        <CardContent className="p-0 flex flex-col md:flex-row">
                                            <div className="bg-blue-50 p-8 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                                                {renderIcon(data.iconType)}
                                            </div>
                                            <div className="p-8 flex-grow">
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{data.category || 'Governance'}</span>
                                                    <span className="text-xs text-gray-400 font-bold">{data.date || 'Today'}</span>
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">{data.title || 'Untitled Communication Notice'}</h3>
                                                <p className="text-gray-600 text-sm leading-relaxed mb-6">{data.summary || 'Summary of the official document or circular goes here.'}</p>
                                                <Button variant="ghost" className="p-0 h-auto text-blue-600 hover:text-blue-800 font-black flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                    Read Full Document <ArrowRightIcon className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* 2. EFA Event Preview */}
                            {type === 'event' && (
                                <div className="space-y-4 max-w-sm mx-auto">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Sidebar Widget Render:</span>
                                    <Card className="rounded-[2.5rem] border-0 shadow-xl p-8 bg-white">
                                        <h3 className="text-xl font-black mb-6">Upcoming Events</h3>
                                        <div className="flex gap-4 items-start">
                                            <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl font-black text-center min-w-[60px] shadow-sm">
                                                <span className="block text-xs uppercase tracking-tighter">{data.date ? (data.date.split(' ')[1] || 'MAY') : 'MAY'}</span>
                                                <span className="text-lg">{data.date ? (data.date.split(' ')[0] || '15') : '15'}</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{data.event || 'Official EFA Event Name'}</p>
                                                <p className="text-xs text-gray-400 font-medium">{data.location || 'Stadium / Venue location'}</p>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {/* 3. National Intel News Preview */}
                            {type === 'news' && (
                                <div className="space-y-6">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Grid Card Layout:</span>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Standard Card Preview */}
                                        <div className="group block">
                                            <Card className="h-full border-0 shadow-sm overflow-hidden rounded-[2rem] bg-white">
                                                <div className="relative h-52 overflow-hidden bg-slate-100">
                                                    <img src={data.image || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800'} alt="" className="h-full w-full object-cover" />
                                                    <div className="absolute top-4 left-4">
                                                        <span className="bg-white/90 backdrop-blur-md text-primary text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-lg">
                                                            {Array.isArray(data.categories) ? data.categories[0] : (data.category || 'National')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <CardContent className="p-6">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{formatDate(data.date)}</p>
                                                    <h3 className="text-lg font-bold text-gray-900 mb-3 leading-tight line-clamp-2">
                                                        {data.title || 'Untitled Intel Article'}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">{data.summary || 'Summary preview of the news article content will go here.'}</p>
                                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Explore &rarr;</span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Featured Card Preview */}
                                        <div className="group block relative rounded-[2.5rem] overflow-hidden shadow-xl min-h-[300px] bg-slate-800">
                                            <img src={data.image || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800'} alt="" className="absolute inset-0 h-full w-full object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                                            <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-primary text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg">
                                                        {Array.isArray(data.categories) ? data.categories[0] : (data.category || 'National')}
                                                    </span>
                                                    <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{formatDate(data.date)}</span>
                                                </div>
                                                <h4 className="text-xl font-display font-black text-white leading-tight">
                                                    {data.title || 'Untitled Intel Article'}
                                                </h4>
                                                <p className="text-white/70 text-xs line-clamp-2 font-medium">
                                                    {data.summary || 'Summary preview of the news article content.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 4. Competitions / National Teams Preview */}
                            {type === 'competition' && (
                                <div className="space-y-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Competitions Landing Page Card:</span>
                                    <div className="max-w-sm mx-auto">
                                        <Card className="shadow-lg h-full border-0 overflow-hidden rounded-3xl bg-white">
                                            <div className="h-2 bg-primary"></div>
                                            <CardContent className="p-8 flex flex-col items-center text-center h-full">
                                                {data.logoUrl ? (
                                                    <img src={data.logoUrl} alt="" className="w-24 h-24 object-contain mb-6 drop-shadow-xl bg-slate-50 p-1.5 rounded-2xl border" />
                                                ) : (
                                                    <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-primary shadow-inner">
                                                        {data.isCup ? <TrophyIcon className="w-10 h-10" /> : <NationalTeamIcon className="w-10 h-10" />}
                                                    </div>
                                                )}
                                                <h2 className="text-2xl font-display font-black text-slate-900 leading-tight">{data.name || 'Official National Cohort'}</h2>
                                                <p className="text-xs text-primary font-black uppercase tracking-widest mt-1 opacity-80">{data.isCup ? 'Knockout / Cup Tournament' : 'Squad / League Season'}</p>
                                                <p className="text-sm text-slate-500 mt-3 line-clamp-2 font-medium">{data.description || 'Official rosters, entries, schedules, and national tournament structures.'}</p>
                                                <div className="mt-8 text-primary font-black text-xs uppercase tracking-[0.2em] inline-flex items-center gap-2">
                                                    {data.isCup ? 'Enter Bracket' : 'Enter Match Center'} &rarr;
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            )}

                            {/* 5. Squad / Team Preview */}
                            {type === 'squad' && (
                                <div className="space-y-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">National Squad / Team Segment Card:</span>
                                    <div className="max-w-sm mx-auto">
                                        <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between gap-4 shadow-md">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 p-1.5">
                                                    {data.crestUrl ? <img src={data.crestUrl} alt="" className="w-10 h-10 object-contain" /> : <UsersIcon className="w-6 h-6 text-gray-300"/>}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{data.name || 'New National Squad Name'}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{data.players?.length || 0} Registered Players</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-xl text-blue-600 font-black text-[10px] uppercase tracking-wider">
                                                <UsersIcon className="w-3.5 h-3.5" />
                                                Roster
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-900 px-6 py-4 border-t border-slate-800 flex justify-end gap-3 flex-shrink-0">
                    <Button onClick={onClose} className="bg-slate-800 text-slate-200 hover:bg-slate-700">
                        Close Preview
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AdminPreviewModal;
