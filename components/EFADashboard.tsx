
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import SparklesIcon from './icons/SparklesIcon';
import BarChartIcon from './icons/BarChartIcon';
import MegaphoneIcon from './icons/MegaphoneIcon';
import UsersIcon from './icons/UsersIcon';
import TrophyIcon from './icons/TrophyIcon';
import GlobeIcon from './icons/GlobeIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';
import MessageSquareIcon from './icons/MessageSquareIcon';
import CalendarIcon from './icons/CalendarIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import FileTextIcon from './icons/FileTextIcon';
import DatabaseIcon from './icons/DatabaseIcon';
import WhistleIcon from './icons/WhistleIcon';
import BuildingIcon from './icons/BuildingIcon';
import LockIcon from './icons/LockIcon';
import AlertTriangleIcon from './icons/AlertTriangleIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import EFAIntelligenceDashboard from './EFAIntelligenceDashboard';
import EFACommunicationsManagement from './admin/EFACommunicationsManagement';
import EFAEventsManagement from './admin/EFAEventsManagement';
import NationalTeamsManagement from './admin/NationalTeamsManagement';
import NationalSquadRosterManagement from './admin/NationalSquadRosterManagement';
import NationalNewsManagement from './admin/NationalNewsManagement';

const EFADashboard: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab ] = useState<'hub' | 'national' | 'stats'>('hub');
    const [nationalSubTab, setNationalSubTab] = useState<'comps' | 'rosters' | 'news'>('comps');

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-500"></div>
                    
                    <div className="mx-auto bg-red-500/10 border border-red-500/20 w-20 h-20 rounded-3xl flex items-center justify-center text-red-500 mb-8 animate-pulse">
                        <LockIcon className="w-10 h-10" />
                    </div>

                    <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] inline-block mb-4">
                        Authentication Required
                    </span>

                    <h2 className="text-3xl font-display font-black text-white mb-4 tracking-tight">Unauthenticated Session</h2>
                    <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                        This administrative environment is locked. Please sign in with authorized EFA staff credentials or a system administrator account.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link to="/">
                            <Button className="w-full sm:w-auto bg-slate-800 text-white hover:bg-slate-700">
                                Return to Public Hub
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!user.canAccessEFADashboard && user.role !== 'super_admin') {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-500"></div>
                    
                    <div className="mx-auto bg-red-500/10 border border-red-500/20 w-20 h-20 rounded-3xl flex items-center justify-center text-red-500 mb-8">
                        <AlertTriangleIcon className="w-10 h-10" />
                    </div>

                    <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] inline-block mb-4">
                        Clearance Level Insufficient
                    </span>

                    <h2 className="text-3xl font-display font-black text-white mb-3 tracking-tight">Access Denied</h2>
                    <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-md mx-auto">
                        Your account does not possess the required digital credentials to access the <strong>EFA Executive Dashboard</strong>.
                    </p>

                    {/* RBAC Role Details Card */}
                    <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 mb-8 text-left space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700/50">
                                <UserCircleIcon className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm">{user.name || 'Anonymous User'}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user.email}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800 text-xs">
                            <div>
                                <span className="text-slate-500 block text-[10px] font-black uppercase tracking-widest mb-1">Your RBAC Role:</span>
                                <span className="bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider text-[9px] border border-red-500/20 inline-block">
                                    {user.role?.replace('_', ' ') || 'Fan'}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-500 block text-[10px] font-black uppercase tracking-widest mb-1">Required Clearance:</span>
                                <span className="text-white font-bold flex items-center gap-1">
                                    <ShieldCheckIcon className="w-4 h-4 text-emerald-500" /> EFA Officer +
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link to="/">
                            <Button className="w-full sm:w-auto bg-slate-800 text-white hover:bg-slate-700">
                                Back to Public Hub
                            </Button>
                        </Link>
                        <Link to="/profile">
                            <Button className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700">
                                Go to My Profile
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Executive Secure Admin Branding Header */}
            <div className="bg-slate-900 text-white py-16 px-4 relative overflow-hidden border-b border-slate-800">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                    <ShieldCheckIcon className="w-64 h-64" />
                </div>
                <div className="container mx-auto max-w-6xl relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="bg-slate-800 p-4 rounded-3xl shadow-2xl border border-slate-700/50">
                            <ShieldCheckIcon className="w-20 h-20 text-emerald-500" />
                        </div>
                        <div className="w-full">
                            <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-4 py-1.5 rounded-full inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-4">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                                Secure EFA Administration Panel
                            </div>
                            <h1 className="text-4xl md:text-5xl font-display font-black leading-tight mb-3">
                                Executive Administrative Console
                            </h1>
                            <p className="text-lg text-slate-400 max-w-2xl font-medium">
                                Secure system panel to create, update, and manage official content reflecting on the public EFA Hub and National page.
                            </p>

                            {/* Security Clearance RBAC Metadata */}
                            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-800 pt-6">
                                <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3.5">
                                    <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400">
                                        <ShieldCheckIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">RBAC Clearance Level</p>
                                        <p className="text-xs font-black text-white">
                                            {user.role === 'super_admin' ? 'Level 3 - Root Admin' : 'Level 2 - EFA Officer'}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3.5">
                                    <div className="bg-blue-500/10 p-2 rounded-xl text-blue-400">
                                        <UserCircleIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Administrator</p>
                                        <p className="text-xs font-black text-white truncate max-w-[150px]">{user.name || 'EFA Staff'}</p>
                                    </div>
                                </div>
                                <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3.5">
                                    <div className="bg-purple-500/10 p-2 rounded-xl text-purple-400">
                                        <DatabaseIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Publishing Directive</p>
                                        <p className="text-xs font-black text-white">Verified Security Audit Log</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="container mx-auto max-w-6xl -mt-8 px-4 relative z-20">
                <div className="bg-white rounded-3xl shadow-xl p-2 flex flex-col md:flex-row gap-2 border border-gray-100">
                    <button 
                        onClick={() => setActiveTab('hub')}
                        className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'hub' ? 'bg-slate-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <MegaphoneIcon className="w-4 h-4" /> Public EFA Hub updates
                    </button>
                    <button 
                        onClick={() => setActiveTab('national')}
                        className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'national' ? 'bg-slate-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <TrophyIcon className="w-4 h-4" /> National Page Updates
                    </button>
                    <button 
                        onClick={() => setActiveTab('stats')}
                        className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'stats' ? 'bg-slate-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <BarChartIcon className="w-4 h-4" /> Strategic Intelligence
                    </button>
                </div>
            </div>

            <main className="container mx-auto max-w-6xl mt-12 px-4">
                <AnimatePresence mode="wait">
                    {activeTab === 'hub' && (
                        <motion.div 
                            key="hub"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl mb-2 text-xs text-slate-500 font-semibold flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                <span>Note: Communications and notices managed here propagate immediately to the public-facing <strong>EFA Hub</strong> page.</span>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-8">
                                    <EFACommunicationsManagement />
                                </div>
                                <div className="space-y-8">
                                    <EFAEventsManagement />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'national' && (
                        <motion.div 
                            key="national"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl mb-4 text-xs text-slate-500 font-semibold flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                <span>Note: Content managed inside this panel propagates immediately to the public-facing <strong>National Teams Hub</strong>.</span>
                            </div>

                            {/* Sub Navigation Tabs */}
                            <div className="flex flex-wrap bg-white border border-slate-100 p-2 rounded-2xl shadow-sm gap-2 w-fit">
                                <button 
                                    onClick={() => setNationalSubTab('comps')}
                                    className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${nationalSubTab === 'comps' ? 'bg-slate-950 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                                >
                                    1. Competitions & Team entries
                                </button>
                                <button 
                                    onClick={() => setNationalSubTab('rosters')}
                                    className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${nationalSubTab === 'rosters' ? 'bg-slate-950 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                                >
                                    2. Squad Rosters & Fixtures
                                </button>
                                <button 
                                    onClick={() => setNationalSubTab('news')}
                                    className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${nationalSubTab === 'news' ? 'bg-slate-950 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                                >
                                    3. National Intel News
                                </button>
                            </div>

                            <AnimatePresence mode="wait">
                                {nationalSubTab === 'comps' && (
                                    <motion.div key="comps" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                        <NationalTeamsManagement />
                                    </motion.div>
                                )}
                                {nationalSubTab === 'rosters' && (
                                    <motion.div key="rosters" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                        <NationalSquadRosterManagement />
                                    </motion.div>
                                )}
                                {nationalSubTab === 'news' && (
                                    <motion.div key="news" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                        <NationalNewsManagement />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {activeTab === 'stats' && (
                        <motion.div 
                            key="stats"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-12"
                        >
                            <EFAIntelligenceDashboard />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Sponsorship Footer Branding */}
            <div className="container mx-auto max-w-6xl mt-20 px-4">
                <Card className="bg-slate-900 text-white border border-slate-800 rounded-[2.5rem] p-12 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <TrophyIcon className="w-40 h-40" />
                    </div>
                    <div className="flex justify-center mb-6">
                        <div className="bg-emerald-500/10 p-4 rounded-full border border-emerald-500/20">
                            <ShieldCheckIcon className="w-10 h-10 text-emerald-400" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-black mb-4 tracking-tight">System Integrity & Audit</h3>
                    <p className="text-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
                        You are logged into a secure administrative session. All operations, content additions, and metadata revisions are logged under official EFA administration security audits.
                    </p>
                </Card>
            </div>
        </div>
    );
};

export default EFADashboard;
