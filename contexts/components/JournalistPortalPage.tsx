
import React, { useState, useEffect } from 'react';
import { useAuth, User } from '../contexts/AuthContext';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import { Link } from 'react-router-dom';
import NewspaperIcon from './icons/NewspaperIcon';
import SparklesIcon from './icons/SparklesIcon';
import MapPinIcon from './icons/MapPinIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import BadgeCheckIcon from './icons/BadgeCheckIcon';
import { fetchNews, addNotification } from '../services/api';
import { NewsItem } from '../data/news';
import BarChartIcon from './icons/BarChartIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';

const JournalistPortalPage: React.FC = () => {
    const { user, isLoggedIn, openAuthModal, updateUser } = useAuth();
    const [myArticles, setMyArticles] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isApplying, setIsApplying] = useState(false);

    const isJournalist = user?.role === 'journalist' || user?.role === 'super_admin';

    useEffect(() => {
        if (isJournalist) {
            const loadData = async () => {
                setLoading(true);
                const allNews = await fetchNews();
                // Match articles by author name or a custom authorId if implemented
                const filtered = allNews.filter(n => n.title.includes(user?.name || 'NONE') || (n as any).authorId === user?.id);
                setMyArticles(filtered);
                setLoading(false);
            };
            loadData();
        } else {
            setLoading(false);
        }
    }, [isJournalist, user]);

    const handleApply = async () => {
        setIsApplying(true);
        try {
            // In a real app, this would create a 'journalist_application' doc in Firestore
            // For now, we simulate sending a request to the admin
            await addNotification({
                userId: 'system_admin', // Admin notification
                title: 'New Press Application',
                message: `${user?.name} has applied for Journalist credentials.`,
                type: 'info'
            });
            alert("Application submitted! Our media team will review your credentials within 48 hours.");
        } catch (e) {
            console.error(e);
        } finally {
            setIsApplying(false);
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="bg-slate-50 min-h-screen flex items-center justify-center p-6">
                <Card className="max-w-md w-full shadow-2xl text-center p-10 rounded-[2.5rem] border-0">
                    <div className="bg-indigo-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                        <NewspaperIcon className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h2 className="text-3xl font-display font-black text-gray-900 mb-4">Press Access</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">Login to access your Journalist Dashboard, AI Article Suite, and official matchday credentials.</p>
                    <Button onClick={openAuthModal} className="w-full bg-primary h-14 rounded-2xl font-black uppercase shadow-xl tracking-widest text-xs">Sign In to Portal</Button>
                </Card>
            </div>
        );
    }

    // --- VISITOR VIEW (Non-Journalists) ---
    if (!isJournalist) {
        return (
            <div className="bg-slate-50 min-h-screen py-12 px-6">
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="text-center">
                        <div className="inline-block p-4 bg-white rounded-3xl shadow-xl mb-6">
                             <NewspaperIcon className="w-12 h-12 text-indigo-600" />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-display font-black text-slate-900 mb-4 tracking-tight">Become a <span className="text-indigo-600">Verified</span> Reporter</h1>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                            Join Eswatini's largest digital football network. Get the tools you need to break stories and analyze the game.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center">
                            <SparklesIcon className="w-10 h-10 text-blue-500 mx-auto mb-4" />
                            <h4 className="font-bold text-lg mb-2">AI drafting</h4>
                            <p className="text-sm text-slate-500">Access our Elite Article Editor to turn raw match data into professional prose instantly.</p>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center">
                            <MapPinIcon className="w-10 h-10 text-red-500 mx-auto mb-4" />
                            <h4 className="font-bold text-lg mb-2">Press Passes</h4>
                            <p className="text-sm text-slate-500">Request official digital accreditation for MTN Premier League and Cup matches.</p>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center">
                            <BarChartIcon className="w-10 h-10 text-green-500 mx-auto mb-4" />
                            <h4 className="font-bold text-lg mb-2">Reach 50k+ Fans</h4>
                            <p className="text-sm text-slate-500">Your articles are pushed to our global fanbase, building your professional portfolio.</p>
                        </div>
                    </div>

                    <Card className="bg-indigo-900 text-white p-10 rounded-[3rem] shadow-2xl border-0 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><BadgeCheckIcon className="w-48 h-48" /></div>
                        <CardContent className="p-0 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                            <div className="max-w-xl">
                                <h3 className="text-3xl font-bold mb-4">Submit Your Application</h3>
                                <p className="text-indigo-100 mb-6 leading-relaxed">Tell us about your media outlet or independent blog. We provide credentials for professional journalists and community reporters alike.</p>
                                <Button 
                                    onClick={handleApply} 
                                    disabled={isApplying}
                                    className="bg-accent text-primary-dark h-14 px-10 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                                >
                                    {isApplying ? <Spinner className="w-5 h-5 border-primary-dark" /> : 'Apply for Credentials'}
                                </Button>
                            </div>
                            <div className="hidden md:block">
                                <ShieldCheckIcon className="w-32 h-32 text-accent" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // --- MEMBER VIEW (Journalists) ---
    return (
        <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="container mx-auto max-w-6xl animate-fade-in">
                
                {/* Journalist Profile Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <img src={user.avatar} className="w-24 h-24 rounded-2xl object-cover border-4 border-slate-50 shadow-lg" alt="" />
                            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-full border-2 border-white shadow-md">
                                <BadgeCheckIcon className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-display font-black text-gray-900">{user.name}</h1>
                            </div>
                            <p className="text-indigo-600 font-black uppercase text-[10px] tracking-[0.3em] mb-1">Verified {user.journalismCredentials?.outlet || 'Independent'}</p>
                            <p className="text-slate-400 text-sm font-medium">{user.journalismCredentials?.bio || 'Football Eswatini Official Press Partner'}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                         <Link to="/ai-assistant">
                            <Button className="bg-indigo-600 text-white h-12 px-8 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-indigo-700 transition-all active:scale-95">
                                <SparklesIcon className="w-4 h-4"/> AI Article Suite
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Analytics Overview */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="bg-white border-0 shadow-sm">
                                <CardContent className="p-6">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Reach</p>
                                    <p className="text-3xl font-black text-slate-900">42.5k</p>
                                    <div className="text-[10px] font-bold text-green-600 mt-2">+12% vs last month</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-white border-0 shadow-sm">
                                <CardContent className="p-6">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Article Shares</p>
                                    <p className="text-3xl font-black text-slate-900">1,204</p>
                                    <div className="text-[10px] font-bold text-blue-600 mt-2">Top in Region</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-white border-0 shadow-sm">
                                <CardContent className="p-6">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Credibility</p>
                                    <p className="text-3xl font-black text-slate-900">Elite</p>
                                    <div className="text-[10px] font-bold text-indigo-600 mt-2">Verified Partner</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Activity Card */}
                        <Card className="shadow-lg bg-white border-0 overflow-hidden rounded-[2.5rem]">
                            <CardContent className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-black font-display uppercase tracking-tight text-slate-900">My Portfolio</h3>
                                    <Link to="/ai-assistant" className="text-indigo-600 text-xs font-black uppercase tracking-widest hover:underline">Draft New Post &rarr;</Link>
                                </div>
                                
                                {loading ? <div className="py-20 flex justify-center"><Spinner /></div> : (
                                    <div className="space-y-4">
                                        {myArticles.length > 0 ? myArticles.map(article => (
                                            <div key={article.id} className="flex gap-6 p-4 border border-slate-100 rounded-3xl bg-slate-50/30 hover:bg-white transition-all hover:shadow-md group">
                                                <img src={article.image} className="w-28 h-24 rounded-2xl object-cover shadow-sm" alt=""/>
                                                <div className="flex-grow min-w-0 flex flex-col justify-center">
                                                    <h4 className="font-bold text-lg text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">{article.title}</h4>
                                                    <p className="text-xs text-slate-500 mt-1">{new Date(article.date).toLocaleDateString()}</p>
                                                    <div className="flex items-center gap-6 mt-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                                            <span className="text-[10px] font-black uppercase text-green-600 tracking-wider">Live</span>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-400">842 Views</span>
                                                        <span className="text-[10px] font-bold text-slate-400">12 Comments</span>
                                                    </div>
                                                </div>
                                                <button className="text-slate-300 hover:text-indigo-600 self-center p-2"><ArrowRightIcon className="w-6 h-6"/></button>
                                            </div>
                                        )) : (
                                            <div className="text-center py-20 border-2 border-dashed rounded-[2.5rem] bg-slate-50/50">
                                                <NewspaperIcon className="w-16 h-16 mx-auto text-slate-200 mb-4"/>
                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No articles published under your byline yet</p>
                                                <Link to="/ai-assistant">
                                                    <Button variant="outline" className="mt-6 border-slate-200 text-slate-600 h-10 px-6">Start Your First Draft</Button>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Area */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Press Credentials Card */}
                        <Card className="shadow-2xl border-0 bg-slate-900 text-white rounded-[2.5rem] overflow-hidden">
                            <CardContent className="p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-indigo-500 rounded-lg">
                                        <MapPinIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold font-display uppercase tracking-tight">Accreditation</h3>
                                </div>
                                <p className="text-slate-400 text-xs mb-8 leading-relaxed">
                                    Request official digital credentials for the media tribune. Once approved, your badge will appear in your mobile wallet.
                                </p>
                                <div className="space-y-3">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center group hover:bg-white/10 transition-all cursor-pointer">
                                        <div>
                                            <p className="text-sm font-bold">Mbabane Derby</p>
                                            <p className="text-[10px] text-slate-500 font-medium">Somhlolo Stadium • Nov 18</p>
                                        </div>
                                        <button className="text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg group-hover:bg-indigo-500">Request</button>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center opacity-40 grayscale">
                                        <div>
                                            <p className="text-sm font-bold">Young Buffaloes vs Leopards</p>
                                            <p className="text-[10px] text-slate-500 font-medium">Mavuso Sports • Nov 19</p>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest border border-white/20 px-4 py-2 rounded-xl">Closed</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Guidelines Card */}
                        <Card className="shadow-lg border-0 bg-white rounded-[2.5rem] overflow-hidden border-t-4 border-indigo-600">
                            <CardContent className="p-8">
                                <h4 className="font-black text-[10px] uppercase text-slate-400 tracking-[0.2em] mb-6">Editorial Standards</h4>
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="h-2 w-2 rounded-full bg-indigo-600 mt-2 flex-shrink-0"></div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">Verified Data Usage</p>
                                            <p className="text-[11px] text-slate-500 leading-relaxed mt-1">Always use the built-in AI data bridge to ensure match scores and scorers are 100% accurate.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="h-2 w-2 rounded-full bg-indigo-600 mt-2 flex-shrink-0"></div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">Neutral Reporting</p>
                                            <p className="text-[11px] text-slate-500 leading-relaxed mt-1">Maintain objective standards even when reporting on your local team's performance.</p>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" className="w-full mt-8 text-indigo-600 font-black text-[10px] uppercase tracking-widest border border-indigo-50 rounded-xl py-3">View Full Style Guide</Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JournalistPortalPage;
