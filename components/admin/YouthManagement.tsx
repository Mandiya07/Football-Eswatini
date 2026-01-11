
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
import { removeUndefinedProps, compressImage } from '../../services/utils';
import ImageIcon from '../icons/ImageIcon';

const YouthManagement: React.FC = () => {
    const [leagues, setLeagues] = useState<YouthLeague[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeLeagueId, setActiveLeagueId] = useState<string>('');
    const [isEditingLeague, setIsEditingLeague] = useState(false);
    const [editingLeagueDesc, setEditingLeagueDesc] = useState('');
    const [editingLeagueLogo, setEditingLeagueLogo] = useState('');
    
    // Create League Modal
    const [isCreateLeagueModalOpen, setIsCreateLeagueModalOpen] = useState(false);
    const [newLeagueName, setNewLeagueName] = useState('');

    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [teamFormData, setTeamFormData] = useState({ name: '', crestUrl: '' });
    const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<RisingStarPlayer | null>(null);
    const [playerFormData, setPlayerFormData] = useState({ name: '', age: 16, team: '', position: '', photoUrl: '', bio: '' });
    
    // Articles State
    const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState<YouthArticle | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchYouthData();
            setLeagues(data);
            if (data.length > 0 && !activeLeagueId) setActiveLeagueId(data[0].id);
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
        if (!newLeagueName.trim()) return;
        
        const newId = newLeagueName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const newLeague: YouthLeague = {
            id: newId,
            name: newLeagueName,
            description: 'New Youth League Description',
            logoUrl: '',
            teams: [],
            risingStars: [],
            articles: []
        };

        try {
            await setDoc(doc(db, 'youth', newId), newLeague);
            setLeagues([...leagues, newLeague]);
            setActiveLeagueId(newId);
            setIsCreateLeagueModalOpen(false);
            setNewLeagueName('');
        } catch (err) {
            handleFirestoreError(err, 'create youth league');
        }
    };

    const handleDeleteLeague = async () => {
        if (!activeLeague || !window.confirm(`Are you sure you want to PERMANENTLY delete the entire ${activeLeague.name} competition?`)) return;
        
        try {
            await deleteDoc(doc(db, 'youth', activeLeague.id));
            const remaining = leagues.filter(l => l.id !== activeLeague.id);
            setLeagues(remaining);
            setActiveLeagueId(remaining.length > 0 ? remaining[0].id : '');
        } catch (err) {
            handleFirestoreError(err, 'delete youth league');
        }
    };

    const handleSaveLeagueInfo = async () => {
        if (!activeLeague) return;
        const updatedLeague = { 
            ...activeLeague, 
            description: editingLeagueDesc,
            logoUrl: editingLeagueLogo
        };
        await saveLeagueState(updatedLeague);
        setIsEditingLeague(false);
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const base64 = await compressImage(e.target.files[0], 400, 0.7);
                setEditingLeagueLogo(base64);
            } catch (err) {
                console.error("Logo process failed", err);
            }
        }
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
                        <h3 className="text-2xl font-bold font-display">Youth Content Management</h3>
                        <Button onClick={() => setIsCreateLeagueModalOpen(true)} className="bg-primary text-white text-xs h-9 px-4 flex items-center gap-2">
                            <PlusCircleIcon className="w-4 h-4" /> New Competition
                        </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
                        {leagues.map(league => (
                            <button
                                key={league.id}
                                onClick={() => setActiveLeagueId(league.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeLeagueId === league.id ? 'bg-primary text-white' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
                            >
                                {league.name}
                            </button>
                        ))}
                    </div>

                    {activeLeague && (
                        <div className="space-y-10 animate-fade-in w-full overflow-hidden">
                            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-blue-900 uppercase text-xs">League Metadata</h4>
                                    <div className="flex gap-4">
                                        {!isEditingLeague ? (
                                            <button onClick={() => { setEditingLeagueDesc(activeLeague.description); setEditingLeagueLogo(activeLeague.logoUrl || ''); setIsEditingLeague(true); }} className="text-xs font-bold text-blue-600 hover:underline">Edit Info</button>
                                        ) : (
                                            <div className="flex gap-3">
                                                <button onClick={() => setIsEditingLeague(false)} className="text-xs text-gray-500">Cancel</button>
                                                <button onClick={handleSaveLeagueInfo} className="text-xs font-bold text-blue-700">Save</button>
                                            </div>
                                        )}
                                        <button onClick={handleDeleteLeague} className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"><TrashIcon className="w-3 h-3"/> Delete League</button>
                                    </div>
                                </div>
                                {isEditingLeague ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-blue-900 block mb-1">Description</label>
                                            <textarea rows={3} className="w-full p-3 border rounded-xl text-sm" value={editingLeagueDesc} onChange={e => setEditingLeagueDesc(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-blue-900 block mb-1">League Logo</label>
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 bg-white rounded-lg border flex items-center justify-center p-1">
                                                    {editingLeagueLogo ? <img src={editingLeagueLogo} className="max-h-full max-w-full object-contain" /> : <ImageIcon className="text-gray-300 w-8 h-8"/>}
                                                </div>
                                                <input type="file" onChange={handleLogoUpload} accept="image/*" className="text-xs text-blue-900" />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-6 items-start">
                                        <div className="w-20 h-20 bg-white rounded-xl border flex items-center justify-center p-2 flex-shrink-0">
                                            {activeLeague.logoUrl ? <img src={activeLeague.logoUrl} className="max-h-full max-w-full object-contain" /> : <ImageIcon className="text-gray-200 w-10 h-10"/>}
                                        </div>
                                        <p className="text-sm text-blue-800 leading-relaxed break-words">{activeLeague.description}</p>
                                    </div>
                                )}
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
                                                    {article.imageUrl ? <img src={article.imageUrl} className="w-full h-full object-cover rounded-lg" /> : <FileTextIcon className="w-5 h-5 text-gray-400" />}
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
                                </div>
                            </section>

                            {/* Teams Section */}
                            <section className="w-full">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-black text-xs uppercase tracking-widest text-gray-400">Participating Teams ({activeLeague.teams?.length || 0})</h4>
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
                                    <h4 className="font-black text-xs uppercase tracking-widest text-gray-400">Rising Stars ({activeLeague.risingStars?.length || 0})</h4>
                                    <Button onClick={() => { setEditingPlayer(null); setPlayerFormData({ name: '', age: 16, team: '', position: '', photoUrl: '', bio: '' }); setIsPlayerModalOpen(true); }} className="bg-green-600 text-white text-[10px] h-7 px-3">Add Player</Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(activeLeague.risingStars || []).map(player => (
                                        <div key={player.id} className="p-4 border border-gray-100 rounded-2xl flex gap-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                                            <div className="w-16 h-16 bg-gray-50 rounded-xl flex-shrink-0 overflow-hidden border">
                                                {player.photoUrl ? <img src={player.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full p-4 flex items-center justify-center bg-gray-100"><XIcon className="text-gray-300"/></div>}
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

            {/* Create League Modal */}
            {isCreateLeagueModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsCreateLeagueModalOpen(false)}>
                    <Card className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <CardContent className="p-8">
                            <h4 className="font-bold text-xl mb-4">New Youth Competition</h4>
                            <form onSubmit={handleCreateLeague} className="space-y-4">
                                <input placeholder="Competition Name" value={newLeagueName} onChange={e => setNewLeagueName(e.target.value)} className="w-full p-3 border rounded-xl" required />
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" onClick={() => setIsCreateLeagueModalOpen(false)} className="bg-gray-100 text-gray-700">Cancel</Button>
                                    <Button type="submit" className="bg-primary text-white">Create League</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Team Modal */}
            {isTeamModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsTeamModalOpen(false)}>
                    <Card className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <CardContent className="p-8">
                            <h4 className="font-bold text-xl mb-6">Add Youth Team</h4>
                            <form onSubmit={handleSaveTeam} className="space-y-4">
                                <input placeholder="Club/Academy Name" value={teamFormData.name} onChange={e => setTeamFormData({...teamFormData, name: e.target.value})} className="w-full p-3 border rounded-xl" required />
                                <div className="flex justify-end gap-3 mt-6">
                                    <Button type="button" onClick={() => setIsTeamModalOpen(false)} className="bg-gray-100 text-gray-700">Cancel</Button>
                                    <Button type="submit" className="bg-primary text-white">Register Team</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Player Modal */}
            {isPlayerModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsPlayerModalOpen(false)}>
                    <Card className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <CardContent className="p-8">
                            <h4 className="font-bold text-xl mb-6">{editingPlayer ? 'Edit Player' : 'Add Rising Star'}</h4>
                            <form onSubmit={handleSavePlayer} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <input placeholder="Name" value={playerFormData.name} onChange={e => setPlayerFormData({...playerFormData, name: e.target.value})} className="w-full p-2 border rounded" required />
                                    <input placeholder="Age" type="number" value={playerFormData.age} onChange={e => setPlayerFormData({...playerFormData, age: parseInt(e.target.value)})} className="w-full p-2 border rounded" required />
                                    <input placeholder="Team" value={playerFormData.team} onChange={e => setPlayerFormData({...playerFormData, team: e.target.value})} className="w-full p-2 border rounded" required />
                                    <input placeholder="Position" value={playerFormData.position} onChange={e => setPlayerFormData({...playerFormData, position: e.target.value})} className="w-full p-2 border rounded" required />
                                </div>
                                <textarea placeholder="Bio / Scouting Notes" value={playerFormData.bio} onChange={e => setPlayerFormData({...playerFormData, bio: e.target.value})} className="w-full p-2 border rounded" rows={3} />
                                <div className="flex justify-end gap-3 mt-6">
                                    <Button type="button" onClick={() => setIsPlayerModalOpen(false)} className="bg-gray-100 text-gray-700">Cancel</Button>
                                    <Button type="submit" className="bg-primary text-white">Save Profile</Button>
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
