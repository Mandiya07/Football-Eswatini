
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import UploadCloudIcon from '../icons/UploadCloudIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, fetchCompetition } from '../../services/api';
import { CompetitionFixture } from '../../data/teams';
import Spinner from '../ui/Spinner';
import ClipboardListIcon from '../icons/ClipboardListIcon';
import BarChartIcon from '../icons/BarChartIcon';

const ManageMatchDay: React.FC<{ clubName: string }> = ({ clubName }) => {
    // Pre-Match State
    const [teamSheet, setTeamSheet] = useState<File | null>(null);
    const [formationNotes, setFormationNotes] = useState('');
    const [preMatchSuccess, setPreMatchSuccess] = useState('');
    const [isSubmittingPre, setIsSubmittingPre] = useState(false);

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

    const COMPETITION_ID = 'mtn-premier-league';

    useEffect(() => {
        const loadMatches = async () => {
            setLoadingMatches(true);
            try {
                const data = await fetchCompetition(COMPETITION_ID);
                if (data?.results) {
                    // Filter results for this club
                    const myResults = data.results.filter(
                        r => r.teamA === clubName || r.teamB === clubName
                    ).sort((a, b) => new Date(b.fullDate || '').getTime() - new Date(a.fullDate || '').getTime());
                    setRecentMatches(myResults);
                }
            } catch (error) {
                console.error("Error loading matches", error);
            } finally {
                setLoadingMatches(false);
            }
        };
        loadMatches();
    }, [clubName]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setTeamSheet(e.target.files[0]);
        }
    };
    
    const handlePreMatchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teamSheet) {
            alert("Please upload a team sheet.");
            return;
        }
        setIsSubmittingPre(true);
        try {
            await addDoc(collection(db, 'matchDaySubmissions'), {
                clubName,
                type: 'pre-match',
                teamSheetName: teamSheet.name,
                formationNotes,
                submittedAt: serverTimestamp()
            });

            setPreMatchSuccess("Team sheet submitted successfully!");
            setTeamSheet(null);
            setFormationNotes('');
            const fileInput = document.getElementById('team-sheet-input') as HTMLInputElement;
            if(fileInput) fileInput.value = '';

            setTimeout(() => setPreMatchSuccess(''), 4000);
        } catch (error) {
            handleFirestoreError(error, 'submit team sheet');
        } finally {
            setIsSubmittingPre(false);
        }
    };

    const handlePostMatchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMatchId) {
            alert("Please select a match.");
            return;
        }

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

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <div className="space-y-8 animate-fade-in">
            {/* PRE-MATCH SECTION */}
            <Card className="shadow-lg">
                <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <ClipboardListIcon className="w-6 h-6 text-blue-600" />
                        <h3 className="text-2xl font-bold font-display">Pre-Match: Team Sheet</h3>
                    </div>
                    <p className="text-gray-600 mb-6 text-sm">Upload your starting XI and formations before kickoff. This data is used for media lineups.</p>
                    
                    {preMatchSuccess && (
                        <div className="mb-4 p-3 bg-green-100 text-green-800 border border-green-200 rounded-md flex items-center gap-2 animate-fade-in">
                            <CheckCircleIcon className="w-5 h-5" />
                            <span className="text-sm font-semibold">{preMatchSuccess}</span>
                        </div>
                    )}
                    
                    <form onSubmit={handlePreMatchSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Team Sheet File</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition-colors cursor-pointer relative">
                                <input id="team-sheet-input" name="team-sheet" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept=".pdf,.doc,.docx,image/*" />
                                <div className="space-y-1 text-center pointer-events-none">
                                    <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600 justify-center">
                                        <span className="font-medium text-primary">Upload a file</span>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    {teamSheet ? (
                                        <p className="text-sm text-green-600 font-semibold">{teamSheet.name}</p>
                                    ) : (
                                        <p className="text-xs text-gray-500">Images, PDF, DOC up to 10MB</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="formation-notes" className="block text-sm font-medium text-gray-700 mb-1">Tactical Notes (Optional)</label>
                            <textarea
                                id="formation-notes"
                                rows={3}
                                value={formationNotes}
                                onChange={e => setFormationNotes(e.target.value)}
                                className={inputClass}
                                placeholder="e.g., Formation: 4-4-2. Key instructions for media."
                            ></textarea>
                        </div>
                        
                        <div className="text-right">
                            <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700" disabled={isSubmittingPre}>
                                {isSubmittingPre ? <Spinner className="w-4 h-4 border-2"/> : 'Submit Team Sheet'}
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
                        <h3 className="text-2xl font-bold font-display">Post-Match: Analysis Report</h3>
                    </div>
                    <p className="text-gray-600 mb-6 text-sm">Submit your technical report, manager ratings, and medical updates after the game.</p>

                    {postMatchSuccess && (
                        <div className="mb-4 p-3 bg-green-100 text-green-800 border border-green-200 rounded-md flex items-center gap-2 animate-fade-in">
                            <CheckCircleIcon className="w-5 h-5" />
                            <span className="text-sm font-semibold">{postMatchSuccess}</span>
                        </div>
                    )}

                    <form onSubmit={handlePostMatchSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Match Result</label>
                            {loadingMatches ? <Spinner className="w-5 h-5 border-gray-400" /> : (
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
                            {recentMatches.length === 0 && !loadingMatches && <p className="text-xs text-red-500 mt-1">No completed matches found.</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tactical Analysis / Summary</label>
                            <textarea
                                value={analysisData.summary}
                                onChange={e => setAnalysisData({...analysisData, summary: e.target.value})}
                                className={inputClass}
                                rows={4}
                                placeholder="What went well? What needs improvement? Key turning points."
                                required
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Man of the Match</label>
                                <input 
                                    type="text" 
                                    value={analysisData.manOfTheMatch}
                                    onChange={e => setAnalysisData({...analysisData, manOfTheMatch: e.target.value})}
                                    className={inputClass}
                                    placeholder="Player Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Manager Performance Rating (1-10)</label>
                                <input 
                                    type="number" 
                                    value={analysisData.managerRating}
                                    onChange={e => setAnalysisData({...analysisData, managerRating: e.target.value})}
                                    className={inputClass}
                                    min="1" max="10"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Injuries & Fitness Report</label>
                            <textarea
                                value={analysisData.injuries}
                                onChange={e => setAnalysisData({...analysisData, injuries: e.target.value})}
                                className={inputClass}
                                rows={2}
                                placeholder="List any injuries sustained or fitness concerns..."
                            ></textarea>
                        </div>

                        <div className="text-right pt-2">
                            <Button type="submit" className="bg-green-600 text-white hover:bg-green-700" disabled={isSubmittingPost || !selectedMatchId}>
                                {isSubmittingPost ? <Spinner className="w-4 h-4 border-2"/> : 'Submit Report'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ManageMatchDay;
