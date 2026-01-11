
import React, { useState, useEffect } from 'react';
import { fetchYouthData, handleFirestoreError } from '../../services/api';
import { YouthLeague, RisingStarPlayer, YouthArticle, YouthTeam } from '../../data/youth';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';
import { db } from '../../services/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import XIcon from '../icons/XIcon';
import YouthArticleFormModal from './YouthArticleFormModal';
import FileTextIcon from '../icons/FileTextIcon';
import { removeUndefinedProps } from '../../services/utils';

const YouthManagement: React.FC = () => {
    const [leagues, setLeagues] = useState<YouthLeague[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeLeagueId, setActiveLeagueId] = useState<string>('');
    const [isEditingLeague, setIsEditingLeague] = useState(false);
    const [editingLeagueDesc, setEditingLeagueDesc] = useState('');

    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [teamFormData, setTeamFormData] = useState({ name: '', crestUrl: '' });
    const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<RisingStarPlayer | null>(null);
    const [playerFormData, setPlayerFormData] = useState({ name: '', age: 16, team: '', position: '', photoUrl: '', bio: '' });
    
    // Articles State
    const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState<YouthArticle | null>(null);

    // New League Modal
    const [isNewLeagueModalOpen, setIsNewLeagueModalOpen] = useState(false);
    const [newLeagueForm, setNewLeagueForm] = useState({ name: '', id: '' });

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchYouthData();
            
            // Deduplicate logic to ensure no ghost tournaments appear
            const leagueMap = new Map<string, YouthLeague>();
            data.forEach(l => {
                const nameKey = l.name.trim().toLowerCase();
                if (!leagueMap.has(nameKey)) {
                    leagueMap.set(nameKey, l);
                }
            });

            const uniqueLeagues = Array.from(leagueMap.values());
            setLeagues(uniqueLeagues);
            if (uniqueLeagues.length > 0 && !activeLeagueId) setActiveLeagueId(uniqueLeagues[0].id);
        } catch(e) {
            console.error("Failed to load youth management data:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const activeLeague = leagues.find(l => l.id === activeLeagueId);

    const saveLeagueState = async (updatedLeague: YouthLeague) => {
        try {
            await setDoc(doc(db, 'youth', updatedLeague.id), removeUndefinedProps(updatedLeague));
            setLeagues(prev => prev.map(l => l.id === updatedLeague.id ? updatedLeague : l));
        } catch (err) {
            handleFirestoreError(err, 'save youth league data');
        }
    };

    const handleCreateLeague = async (e: React.FormEvent) => {
        e.preventDefault();
        const leagueId = newLeagueForm.id.trim().toLowerCase().replace(/\s+/g, '-');
        if (!leagueId || !newLeagueForm.name) return;

        const newLeague: YouthLeague = {
            id: leagueId,
            name: newLeagueForm.name,
            description: 'New competition description...',
            teams: [],
            risingStars: [],
            articles: []
        };

        try {
            await setDoc(doc(db, 'youth', leagueId), newLeague);
            setLeagues([...leagues, newLeague]);
            setActiveLeagueId(leagueId);
            setIsNewLeagueModalOpen(false);
            setNewLeagueForm({ name: '', id: '' });
        } catch (err) {
            handleFirestoreError(err, 'create youth league');
        }
    };

    const handleDeleteLeague = async (id: string) => {
        if (!window.confirm("ARE YOU SURE? This will permanently delete this competition, all its teams, players, and articles from the Youth Hub.")) return;
        try {
            await deleteDoc(doc(db, 'youth', id));
            const updatedLeagues = leagues.filter(l => l.id !== id);
            setLeagues(updatedLeagues);
            if (activeLeagueId === id) {
                setActiveLeagueId(updatedLeagues[0]?.id || '');
            }
        } catch (err) {
            handleFirestoreError(err, 'delete youth league');
        }
    };

    const handleSaveLeagueDesc = async () => {
        if (!activeLeague) return;
        const updatedLeague = { ...activeLeague, description: editingLeagueDesc };
        await saveLeagueState(updatedLeague);
        setIsEditingLeague(false);
    };

    const handleDeleteTeam = async (team: YouthTeam) => {
        if (!activeLeague || !window.confirm("Remove this team?")) return;
        const updatedTeams = (activeLeague.teams || []).filter(t => t.id !== team.id);
        await saveLeagueState({ ...activeLeague, teams: updatedTeams });
    };

    const handleSaveTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeLeague) return;
        const newTeam: YouthTeam = { id: Date.now(), name: teamFormData.name, crestUrl: teamFormData.crestUrl || '' };
        await saveLeagueState({ ...activeLeague, teams: [...(activeLeague.teams || []), newTeam] });
        setIsTeamModalOpen(false);
        setTeamFormData({ name: '', crestUrl: '' });
    };

    const handleSavePlayer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeLeague) return;
        const newPlayer: RisingStarPlayer = { id: editingPlayer ? editingPlayer.id : Date.now(), ...playerFormData };
        let updatedStars = [...(activeLeague.risingStars || [])];
        updatedStars = editingPlayer ? updatedStars.map(p => p.id === editingPlayer.id ? newPlayer : p) : [...updatedStars, newPlayer];
        await saveLeagueState({ ...activeLeague, risingStars: updatedStars });
        setIsPlayerModalOpen(false);
    };

    const handleSaveArticle = async (article: YouthArticle) => {
        if (!activeLeague) return;
        let updatedArticles = [...(activeLeague.articles || [])];
        if (editingArticle) {
            updatedArticles = updatedArticles.map(a => a.id === editingArticle.id ? article : a);
        } else {
            updatedArticles = [article, ...updatedArticles];
        }
        await saveLeagueState({ ...activeLeague, articles: updatedArticles });
        setIsArticleModalOpen(false);
        setEditingArticle(null);
    };

    const handleDeleteArticle = async (articleId: string) => {
        if (!activeLeague || !window.confirm("Delete this article?")) return;
        const updatedArticles = (activeLeague.articles || []).filter(a => a.id !== articleId);
        await saveLeagueState({ ...activeLeague, articles: updatedArticles });
    };

    if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

    return (
        <div className="max-w-full overflow-hidden w-full">
            <Card className="shadow-lg animate-fade-in border-0 w-full overflow-hidden">
                <CardContent className="p-4 sm:p-6 w-full">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold font-display">Youth Hub Management</h3>
                        <Button onClick={() => setIsNewLeagueModalOpen(true)} className="bg-primary text-white hover:bg-primary-dark inline-flex items-center gap-2 h-10 px-4">
                            <PlusCircleIcon className="w-5 h-5" /> New Competition
                        </Button>
                    </div>
                    
                    {/* Navigation Tabs */}
                    <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
                        {leagues.map(league => (
                            <div key={league.id} className="relative group">
                                <button
                                    onClick={() => setActiveLeagueId(league.id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeLeagueId === league.id ? 'bg-primary text-white' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
                                >
                                    {league.name}
                                </button>
                                <button 
                                    onClick={() => handleDeleteLeague(league.id)}
                                    className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    title="Delete Competition"
                                >
                                    <TrashIcon className="w-2 h-2" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {activeLeague && (
                        <div className="space-y-10 animate-fade-in w-full overflow-hidden">
                            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-blue-900 uppercase text-xs">League Description</h4>
                                    {!isEditingLeague ? (
                                        <button onClick={() => { setEditingLeagueDesc(activeLeague.description); setIsEditingLeague(true); }} className="text-xs font-bold text-blue-600 hover:underline">Edit</button>
                                    ) : (
                                        <div className="flex gap-3">
                                            <button onClick={() => setIsEditingLeague(false)} className="text-xs text-gray-500">Cancel</button>
                                            <button onClick={handleSaveLeagueDesc} className="text-xs font-bold text-blue-700">Save</button>
                                        </div>
                                    )}
                                </div>
                                {isEditingLeague ? <textarea rows={4} className="w-full p-3 border rounded-xl text-sm" value={editingLeagueDesc} onChange={e => setEditingLeagueDesc(e.target.value)} /> : <p className="text-sm text-blue-800 leading-relaxed break-words">{activeLeague.description}</p>}
                            </div>

                            {/* Articles Section */}
                            <section className="w-full">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-black text-xs uppercase tracking-widest text-gray-400">Articles & Updates ({activeLeague.articles?.length || 0})</h4>
                                    <Button onClick={() => { setEditingArticle(null); setIsArticleModalOpen(true); }} className="bg-primary text-white text-[10px] h-7 px-3 flex items-center gap-1"><PlusCircleIcon className="w-4 h-4" /> New Article</Button>
                                </div>
                                <div className="space-y-2">
                                    {(activeLeague.articles || []).map(article => (
                                        <div key={article.id} className="p-3 bg-white border border-gray-100 rounded-xl flex items-center justify-between shadow-sm group">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-10 h-10 rounded-lg bg-gray-50 flex-shrink-0 flex items-center justify-center border">
                                                    <FileTextIcon className="w-5 h-5 text-gray-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-gray-800 truncate">{article.title}</p>
                                                    <p className="text-[10px] text-gray-500">{article.date}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditingArticle(article); setIsArticleModalOpen(true); }} className="text-blue-500 p-1.5 hover:bg-blue-50 rounded-lg"><PencilIcon className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteArticle(article.id)} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg"><TrashIcon className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!activeLeague.articles || activeLeague.articles.length === 0) && (
                                        <p className="text-center py-8 text-gray-400 text-xs italic border-2 border-dashed rounded-xl">No articles posted yet.</p>
                                    )}
                                </div>
                            </section>

                            {/* Teams Section */}
                            <section className="w-full">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-black text-xs uppercase tracking-widest text-gray-400">Teams ({activeLeague.teams?.length || 0})</h4>
                                    <Button onClick={() => setIsTeamModalOpen(true)} className="bg-blue-600 text-white text-[10px] h-7 px-3">Add Team</Button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {(activeLeague.teams || []).map(team => (
                                        <div key={team.id} className="p-3 bg-white border border-gray-100 rounded-xl flex items-center justify-between shadow-sm group">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <img src={team.crestUrl} alt="" className="w-8 h-8 object-contain flex-shrink-0" />
                                                <span className="text-sm font-bold text-gray-800 truncate">{team.name}</span>
                                            </div>
                                            <button onClick={() => handleDeleteTeam(team)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Rising Stars Section */}
                            <section className="w-full">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-black text-xs uppercase tracking-widest text-gray-400">Rising Star Profiles ({activeLeague.risingStars?.length || 0})</h4>
                                    <Button onClick={() => { setEditingPlayer(null); setPlayerFormData({ name: '', age: 16, team: '', position: '', photoUrl: '', bio: '' }); setIsPlayerModalOpen(true); }} className="bg-green-600 text-white text-[10px] h-7 px-3">Add Star</Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(activeLeague.risingStars || []).map(player => (
                                        <div key={player.id} className="p-4 border border-gray-100 rounded-2xl flex gap-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                                            <div className="w-16 h-16 bg-gray-50 rounded-xl flex-shrink-0 overflow-hidden border">
                                                {player.photoUrl ? <img src={player.photoUrl} className="w-full h-full object-cover" /> : <Spinner className="w-full h-full p-4"/>}
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <p className="font-bold text-gray-900 truncate">{player.name}</p>
                                                <p className="text-xs text-gray-500 font-semibold truncate uppercase">{player.position} • {player.team}</p>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button onClick={() => { setEditingPlayer(player); setPlayerFormData({ ...player }); setIsPlayerModalOpen(true); }} className="text-blue-500 p-1.5 hover:bg-blue-50 rounded-lg"><PencilIcon className="w-4 h-4"/></button>
                                                <button onClick={() => { if(window.confirm("Remove profile?")) saveLeagueState({...activeLeague, risingStars: activeLeague.risingStars.filter(s => s.id !== player.id)}); }} className="text-red-400 p-1.5 hover:bg-red-50 rounded-lg"><TrashIcon className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* NEW LEAGUE MODAL */}
            {isNewLeagueModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsNewLeagueModalOpen(false)}>
                    <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <CardContent className="p-8">
                            <h4 className="font-black text-xl mb-6 uppercase tracking-tight text-primary">Initialize Youth Competition</h4>
                            <form onSubmit={handleCreateLeague} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-1">League Name</label>
                                    <input placeholder="e.g. Malkerns U-15 Challenge" value={newLeagueForm.name} onChange={e => setNewLeagueForm({...newLeagueForm, name: e.target.value})} className="w-full p-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-primary outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-1">Unique ID (Slug)</label>
                                    <input placeholder="e.g. malkerns-u15" value={newLeagueForm.id} onChange={e => setNewLeagueForm({...newLeagueForm, id: e.target.value})} className="w-full p-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-primary outline-none font-mono text-sm" required />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <Button type="button" onClick={() => setIsNewLeagueModalOpen(false)} className="bg-gray-100 text-gray-700">Cancel</Button>
                                    <Button type="submit" className="bg-primary text-white shadow-xl px-8">Create Hub</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* TEAM MODAL */}
            {isTeamModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsTeamModalOpen(false)}>
                    <Card className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <CardContent className="p-8">
                            <h4 className="font-bold text-xl mb-6">Add Youth Team</h4>
                            <form onSubmit={handleSaveTeam} className="space-y-4">
                                <input placeholder="Club/Academy Name" value={teamFormData.name} onChange={e => setTeamFormData({...teamFormData, name: e.target.value})} className="w-full p-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-primary outline-none" required />
                                <div className="flex justify-end gap-3 mt-6">
                                    <Button type="button" onClick={() => setIsTeamModalOpen(false)} className="bg-gray-100 text-gray-700">Cancel</Button>
                                    <Button type="submit" className="bg-primary text-white shadow-lg">Register Team</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
            
            {isArticleModalOpen && <YouthArticleFormModal isOpen={isArticleModalOpen} onClose={() => setIsArticleModalOpen(false)} onSave={handleSaveArticle} article={editingArticle} />}
        </div>
    );
};

export default YouthManagement;
