
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import UploadCloudIcon from '../icons/UploadCloudIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import { db } from '../../services/firebase';
/* Added missing Firestore imports: addDoc, collection, serverTimestamp */
import { doc, runTransaction, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, fetchCompetition } from '../../services/api';
import { CompetitionFixture, Player, Competition } from '../../data/teams';
import Spinner from '../ui/Spinner';
import ClipboardListIcon from '../icons/ClipboardListIcon';
import BarChartIcon from '../icons/BarChartIcon';
import { removeUndefinedProps } from '../../services/utils';
import UserIcon from '../icons/UserIcon';

const ManageMatchDay: React.FC<{ clubName: string }> = ({ clubName }) => {
    const COMPETITION_ID = 'mtn-premier-league';

    // Roster State
    const [clubRoster, setClubRoster] = useState<Player[]>([]);
    
    // Lineup State
    const [activeMatchId, setActiveMatchId] = useState('');
    const [starters, setStarters] = useState<number[]>([]);
    const [subs, setSubs] = useState<number[]>([]);
    const [upcomingMatches, setUpcomingMatches] = useState<CompetitionFixture[]>([]);
    const [isSubmittingLineup, setIsSubmittingLineup] = useState(false);
    const [lineupSuccess, setLineupSuccess] = useState('');

    // Post-Match State
    const [recentMatches, setRecentMatches] = useState<CompetitionFixture[]>([]);
    const [loadingMatches, setLoadingMatches] = useState(true);
    const [selectedMatchId, setSelectedMatchId] = useState('');
    const [analysisData, setAnalysisData] = useState({
        summary: '',
        manOfTheMatch: '',
        injuries: '',
        managerRating: ''
    });
    const [isSubmittingPost, setIsSubmittingPost] = useState(false);
    const [postMatchSuccess, setPostMatchSuccess] = useState('');

    useEffect(() => {
        const loadInitial = async () => {
            setLoadingMatches(true);
            try {
                const data = await fetchCompetition(COMPETITION_ID);
                if (data) {
                    const team = data.teams?.find(t => t.name === clubName);
                    setClubRoster(team?.players || []);

                    // Split matches
                    const today = new Date().toISOString().split('T')[0];
                    const myMatches = (data.fixtures || []).filter(f => f.teamA === clubName || f.teamB === clubName);
                    const myResults = (data.results || []).filter(r => r.teamA === clubName || r.teamB === clubName);

                    setUpcomingMatches(myMatches.sort((a,b) => a.date.localeCompare(b.date)));
                    setRecentMatches(myResults.sort((a,b) => b.date.localeCompare(a.date)));
                }
            } catch (error) {
                console.error("Error loading data", error);
            } finally {
                setLoadingMatches(false);
            }
        };
        loadInitial();
    }, [clubName]);

    const handleTogglePlayer = (playerId: number, listType: 'starters' | 'subs') => {
        if (listType === 'starters') {
            if (starters.includes(playerId)) {
                setStarters(prev => prev.filter(id => id !== playerId));
            } else {
                if (starters.length >= 11) return alert("You can only select 11 starters.");
                setSubs(prev => prev.filter(id => id !== playerId));
                setStarters(prev => [...prev, playerId]);
            }
        } else {
            if (subs.includes(playerId)) {
                setSubs(prev => prev.filter(id => id !== playerId));
            } else {
                setStarters(prev => prev.filter(id => id !== playerId));
                setSubs(prev => [...prev, playerId]);
            }
        }
    };

    const handleLineupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeMatchId) return alert("Select a match.");
        if (starters.length < 11) return alert("Please select exactly 11 starters.");

        setIsSubmittingLineup(true);
        try {
            const docRef = doc(db, 'competitions', COMPETITION_ID);
            await runTransaction(db, async (transaction) => {
                const snap = await transaction.get(docRef);
                if (!snap.exists()) return;
                const comp = snap.data() as Competition;
                
                const updatedFixtures = (comp.fixtures || []).map(f => {
                    if (String(f.id) === activeMatchId) {
                        const isTeamA = f.teamA === clubName;
                        const sideKey = isTeamA ? 'teamA' : 'teamB';
                        return {
                            ...f,
                            lineups: {
                                ...f.lineups,
                                [sideKey]: { starters, subs }
                            }
                        };
                    }
                    return f;
                });

                transaction.update(docRef, { fixtures: removeUndefinedProps(updatedFixtures) });
            });

            setLineupSuccess("Match team sheet submitted!");
            setTimeout(() => setLineupSuccess(''), 4000);
        } catch (error) {
            handleFirestoreError(error, 'submit lineup');
        } finally {
            setIsSubmittingLineup(false);
        }
    };

    const handlePostMatchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMatchId) return alert("Please select a match.");

        setIsSubmittingPost(true);
        try {
            const match = recentMatches.find(m => String(m.id) === selectedMatchId);
            await addDoc(collection(db, 'matchReports'), {
                clubName,
                matchId: selectedMatchId,
                opponent: match ? (match.teamA === clubName ? match.teamB : match.teamA) : 'Unknown',
                matchDate: match?.fullDate,
                ...analysisData,
                submittedAt: serverTimestamp()
            });

            setPostMatchSuccess("Match report submitted successfully!");
            setAnalysisData({ summary: '', manOfTheMatch: '', injuries: '', managerRating: '' });
            setSelectedMatchId('');
            setTimeout(() => setPostMatchSuccess(''), 4000);
        } catch (error) {
            handleFirestoreError(error, 'submit match report');
        } finally {
            setIsSubmittingPost(false);
        }
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <div className="space-y-8 animate-fade-in">
            {/* DIGITAL TEAM SHEET SECTION */}
            <Card className="shadow-lg border-t-4 border-blue-600">
                <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <ClipboardListIcon className="w-6 h-6 text-blue-600" />
                        <h3 className="text-2xl font-bold font-display text-gray-900">Digital Team Sheet</h3>
                    </div>
                    <p className="text-gray-600 mb-6 text-sm">Select your matchday squad from your official roster.</p>
                    
                    {lineupSuccess && (
                        <div className="mb-6 p-3 bg-green-100 text-green-800 border border-green-200 rounded-lg flex items-center gap-2">
                            <CheckCircleIcon className="w-5 h-5" />
                            <span className="text-sm font-semibold">{lineupSuccess}</span>
                        </div>
                    )}
                    
                    <form onSubmit={handleLineupSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">1. Select Match</label>
                            {loadingMatches ? <Spinner className="w-5 h-5" /> : (
                                <select 
                                    value={activeMatchId} 
                                    onChange={e => setActiveMatchId(e.target.value)} 
                                    className={inputClass}
                                    required
                                >
                                    <option value="">-- Choose upcoming match --</option>
                                    {upcomingMatches.map(m => (
                                        <option key={m.id} value={m.id}>{m.fullDate}: vs {m.teamA === clubName ? m.teamB : m.teamA}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                             <div className="flex justify-between items-center mb-4">
                                <label className="block text-sm font-bold text-gray-700">2. Pick Your XI & Bench</label>
                                <div className="flex gap-4">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${starters.length === 11 ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>Starters: {starters.length}/11</span>
                                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700">Subs: {subs.length}</span>
                                </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                 {clubRoster.map(player => (
                                     <div key={player.id} className="flex items-center justify-between p-2 bg-white border rounded-lg hover:shadow-sm">
                                         <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                                {player.photoUrl ? <img src={player.photoUrl} className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4 text-gray-400"/>}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-900">{player.name}</p>
                                                <p className="text-[10px] text-gray-400 uppercase font-black">{player.position}</p>
                                            </div>
                                         </div>
                                         <div className="flex gap-2">
                                            <button 
                                                type="button" 
                                                onClick={() => handleTogglePlayer(player.id, 'starters')}
                                                className={`px-3 py-1 text-[10px] font-black rounded-md border transition-all ${starters.includes(player.id) ? 'bg-green-600 text-white border-green-700' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'}`}
                                            >XI</button>
                                            <button 
                                                type="button" 
                                                onClick={() => handleTogglePlayer(player.id, 'subs')}
                                                className={`px-3 py-1 text-[10px] font-black rounded-md border transition-all ${subs.includes(player.id) ? 'bg-blue-600 text-white border-blue-700' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'}`}
                                            >SUB</button>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                        </div>
                        
                        <div className="text-right">
                            <Button type="submit" className="bg-primary text-white hover:bg-primary-dark w-full md:w-auto h-12 px-10 shadow-lg" disabled={isSubmittingLineup}>
                                {isSubmittingLineup ? <Spinner className="w-4 h-4 border-2"/> : 'Submit Match Squad'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* POST-MATCH SECTION */}
            <Card className="shadow-lg border-t-4 border-green-500">
                <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <BarChartIcon className="w-6 h-6 text-green-600" />
                        <h3 className="text-2xl font-bold font-display text-gray-900">Post-Match Report</h3>
                    </div>
                    <p className="text-gray-600 mb-6 text-sm">Submit technical analysis and medical updates after the game.</p>

                    {postMatchSuccess && (
                        <div className="mb-4 p-3 bg-green-100 text-green-800 border border-green-200 rounded-lg flex items-center gap-2">
                            <CheckCircleIcon className="w-5 h-5" />
                            <span className="text-sm font-semibold">{postMatchSuccess}</span>
                        </div>
                    )}

                    <form onSubmit={handlePostMatchSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Select Match Result</label>
                            {loadingMatches ? <Spinner className="w-5 h-5" /> : (
                                <select 
                                    value={selectedMatchId} 
                                    onChange={e => setSelectedMatchId(e.target.value)} 
                                    className={inputClass}
                                    required
                                >
                                    <option value="" disabled>-- Select a recent match --</option>
                                    {recentMatches.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.fullDate}: {m.teamA} {m.scoreA}-{m.scoreB} {m.teamB}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Technical Summary</label>
                            <textarea
                                value={analysisData.summary}
                                onChange={e => setAnalysisData({...analysisData, summary: e.target.value})}
                                className={inputClass}
                                rows={4}
                                placeholder="Key tactical moments..."
                                required
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Man of the Match</label>
                                <input 
                                    type="text" 
                                    value={analysisData.manOfTheMatch}
                                    onChange={e => setAnalysisData({...analysisData, manOfTheMatch: e.target.value})}
                                    className={inputClass}
                                    placeholder="Player Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Manager Rating (1-10)</label>
                                <input 
                                    type="number" 
                                    value={analysisData.managerRating}
                                    onChange={e => setAnalysisData({...analysisData, managerRating: e.target.value})}
                                    className={inputClass}
                                    min="1" max="10"
                                />
                            </div>
                        </div>

                        <div className="text-right pt-2">
                            <Button type="submit" className="bg-green-600 text-white hover:bg-green-700" disabled={isSubmittingPost || !selectedMatchId}>
                                {isSubmittingPost ? <Spinner className="w-4 h-4 border-2"/> : 'Submit Analysis'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ManageMatchDay;
