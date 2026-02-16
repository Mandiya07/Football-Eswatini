
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import ArrowRightIcon from './icons/ArrowRightIcon';
import SparklesIcon from './icons/SparklesIcon';
import CalendarIcon from './icons/CalendarIcon';
import CloudDownloadIcon from './icons/CloudDownloadIcon';
import UsersIcon from './icons/UsersIcon';
import SettingsIcon from './icons/SettingsIcon';
import { useAuth } from '../contexts/AuthContext';
import { fetchAllCompetitions, Competition, updateCompetitionMetadata } from '../services/api';
import Spinner from './ui/Spinner';
import TrophyIcon from './icons/TrophyIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ImageUploader from './ui/ImageUploader';
import XIcon from './icons/XIcon';

const LeagueSettingsModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    managedLeagues: string[];
    onSave: () => void;
}> = ({ isOpen, onClose, managedLeagues, onSave }) => {
    const [leagues, setLeagues] = useState<Record<string, Competition>>({});
    const [selectedId, setSelectedId] = useState(managedLeagues[0] || '');
    const [formData, setFormData] = useState({ displayName: '', logoUrl: '' });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const load = async () => {
            setLoading(true);
            try {
                const all = await fetchAllCompetitions();
                setLeagues(all);
                // Ensure selectedId is valid or pick first available if current is invalid
                let activeId = selectedId;
                if (!all[activeId] && managedLeagues.length > 0) {
                    activeId = managedLeagues[0];
                    setSelectedId(activeId);
                }

                if (activeId && all[activeId]) {
                    setFormData({
                        displayName: all[activeId].displayName || all[activeId].name || '',
                        logoUrl: all[activeId].logoUrl || ''
                    });
                }
            } catch (e) {
                console.error("Failed to load competition settings", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [isOpen, selectedId, managedLeagues]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedId) return;
        setIsSaving(true);
        try {
            await updateCompetitionMetadata(selectedId, {
                displayName: formData.displayName,
                logoUrl: formData.logoUrl
            });
            setSaveSuccess(true);
            onSave();
            setTimeout(() => {
                setSaveSuccess(false);
                onClose();
            }, 1500);
        } catch (e) {
            alert("Update failed. Check your network and permissions.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[500] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <Card className="w-full max-w-md bg-white border-0 shadow-2xl rounded-[2rem] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-primary p-6 text-white flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2"><SettingsIcon className="w-5 h-5"/> Hub Identity</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors"><XIcon className="w-6 h-6"/></button>
                </div>
                <CardContent className="p-8">
                    {loading ? <div className="flex justify-center py-10"><Spinner /></div> : (
                        <form onSubmit={handleSave} className="space-y-6">
                            {managedLeagues.length > 1 && (
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Target Hub</label>
                                    <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl font-bold bg-gray-50">
                                        {managedLeagues.map(id => (
                                            <option key={id} value={id}>
                                                {leagues[id]?.displayName || leagues[id]?.name || id}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Official Display Name</label>
                                <input 
                                    value={formData.displayName} 
                                    onChange={e => setFormData({...formData, displayName: e.target.value})} 
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" 
                                    placeholder="e.g. MTN Premier League 2024" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Hub Crest / Logo</label>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center p-2 shadow-inner">
                                            {formData.logoUrl ? (
                                                <img src={formData.logoUrl} className="max-h-full max-w-full object-contain" alt="" />
                                            ) : (
                                                <TrophyIcon className="w-10 h-10 text-gray-200"/>
                                            )}
                                        </div>
                                        <div className="flex-grow">
                                            <ImageUploader 
                                                onUpload={(b) => setFormData({...formData, logoUrl: b})} 
                                                status={saveSuccess ? 'saved' : isSaving ? 'saving' : undefined} 
                                            />
                                        </div>
                                    </div>
                                    <input 
                                        type="url"
                                        value={formData.logoUrl} 
                                        onChange={e => setFormData({...formData, logoUrl: e.target.value})} 
                                        className="w-full p-2 border border-gray-100 rounded-lg text-[10px] text-gray-400 bg-gray-50 outline-none" 
                                        placeholder="Or paste direct image URL here..." 
                                    />
                                </div>
                            </div>
                            <div className="pt-6 flex justify-end gap-3 border-t border-gray-50">
                                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                                <Button type="submit" disabled={isSaving} className="bg-primary text-white px-8 h-11 shadow-lg hover:scale-105 transition-transform active:scale-95">
                                    {isSaving ? <Spinner className="w-4 h-4 border-white"/> : 'Update Identity'}
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

const DataManagementPage: React.FC = () => {
    const { user } = useAuth();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [allLeagueIds, setAllLeagueIds] = useState<string[]>([]);
    
    const isSuperAdmin = user?.role === 'super_admin';

    useEffect(() => {
        if (isSuperAdmin) {
            const loadIds = async () => {
                const comps = await fetchAllCompetitions();
                setAllLeagueIds(Object.keys(comps));
            };
            loadIds();
        }
    }, [isSuperAdmin]);

    const managedLeagues = isSuperAdmin ? allLeagueIds : (user?.managedLeagues || []);

    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2 uppercase tracking-tighter">
                        League Control Center
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto font-medium">
                        Official tools for managing match data, league structures, and team rosters.
                    </p>
                </div>

                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* HUB SETTINGS - ACCESSIBLE TO MANAGERS AND SUPER ADMINS */}
                    <Card 
                        className={`shadow-lg border-l-4 border-primary bg-slate-900 text-white group cursor-pointer hover:-translate-y-1 transition-all ${managedLeagues.length === 0 ? 'opacity-50 grayscale' : ''}`} 
                        onClick={() => managedLeagues.length > 0 && setIsSettingsOpen(true)}
                    >
                        <CardContent className="p-8 text-center flex flex-col items-center h-full">
                            <div className="bg-white/10 p-4 rounded-3xl mb-6 group-hover:bg-primary transition-colors">
                                <SettingsIcon className="w-10 h-10 text-accent" />
                            </div>
                            <h2 className="text-2xl font-bold font-display text-white">Hub Identity</h2>
                            <p className="text-blue-100/60 mt-2 mb-6 flex-grow text-sm leading-relaxed">
                                {managedLeagues.length === 0 
                                    ? "No authorized leagues assigned to your account."
                                    : "Configure the official display name and crest for your authorized leagues."
                                }
                            </p>
                            <Button 
                                disabled={managedLeagues.length === 0}
                                className="bg-accent text-primary-dark font-black px-8 h-12 rounded-xl shadow-xl w-full text-[10px] uppercase tracking-widest disabled:opacity-20"
                            >
                                Manage Metadata
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-l-4 border-blue-600">
                        <CardContent className="p-8 text-center flex flex-col items-center h-full">
                            <div className="bg-blue-100 p-4 rounded-3xl mb-6">
                                <UsersIcon className="w-10 h-10 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold font-display text-gray-800">Manage Teams</h2>
                            <p className="text-gray-600 mt-2 mb-6 flex-grow text-sm">
                                Add new clubs to your hub, update team crests, and sync with the public directory.
                            </p>
                            <Link to="/data-management/teams" className="w-full">
                                <Button className="bg-blue-600 text-white hover:bg-blue-700 w-full h-12 rounded-xl font-bold text-[10px] uppercase tracking-widest">
                                    Open Team Manager
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-l-4 border-yellow-500">
                        <CardContent className="p-8 text-center flex flex-col items-center h-full">
                            <div className="bg-accent/20 p-4 rounded-3xl mb-6">
                                <SparklesIcon className="w-10 h-10 text-yellow-600" />
                            </div>
                            <h2 className="text-2xl font-bold font-display text-gray-800">AI Bulk Import</h2>
                            <p className="text-gray-600 mt-2 mb-6 flex-grow text-sm">
                                Paste a list of fixtures or results and let our AI parse and import them for you in seconds.
                            </p>
                            <Link to="/data-management/bulk-import" className="w-full">
                                <Button className="bg-accent text-primary-dark font-black hover:bg-yellow-300 w-full h-12 rounded-xl text-[10px] uppercase tracking-widest">
                                    Use AI Bulk Import
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                     <Card className="shadow-lg border-l-4 border-green-600">
                        <CardContent className="p-8 text-center flex flex-col items-center h-full">
                            <div className="bg-green-100 p-4 rounded-3xl mb-6">
                                <CalendarIcon className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold font-display text-gray-800">Manual Entry Forms</h2>
                            <p className="text-gray-600 mt-2 mb-6 flex-grow text-sm">
                                Dedicated forms to add a single new fixture or match result. Best for specific updates.
                            </p>
                            <div className="flex gap-2 justify-center w-full">
                                <Link to="/submit-fixtures" className="flex-1">
                                    <Button className="bg-green-600 text-white hover:bg-green-700 w-full text-[10px] font-black uppercase">
                                        Fixture
                                    </Button>
                                </Link>
                                <Link to="/submit-results" className="flex-1">
                                    <Button className="bg-primary text-white hover:bg-primary-dark w-full text-[10px] font-black uppercase">
                                       Result
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-l-4 border-purple-600">
                        <CardContent className="p-8 text-center flex flex-col items-center h-full">
                            <div className="bg-purple-100 p-4 rounded-3xl mb-6">
                                <CloudDownloadIcon className="w-10 h-10 text-purple-600" />
                            </div>
                            <h2 className="text-2xl font-bold font-display text-gray-800">Live Fixture Import</h2>
                            <p className="text-gray-600 mt-2 mb-6 flex-grow text-sm">
                                Connect to external sports APIs to fetch and import upcoming fixtures directly into the database.
                            </p>
                            <Link to="/data-management/api-import" className="w-full">
                                <Button className="bg-purple-600 text-white font-black hover:bg-purple-700 w-full h-12 rounded-xl text-[10px] uppercase tracking-widest">
                                    Import from Live Feed
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {isSettingsOpen && managedLeagues.length > 0 && (
                <LeagueSettingsModal 
                    isOpen={isSettingsOpen} 
                    onClose={() => setIsSettingsOpen(false)} 
                    managedLeagues={managedLeagues}
                    onSave={() => {}} 
                />
            )}
        </div>
    );
};

export default DataManagementPage;
