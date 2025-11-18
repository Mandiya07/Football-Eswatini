import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import { fetchAllCompetitions, fetchCompetition } from '../services/api';
import { Competition, Team, CompetitionFixture } from '../data/teams';
import { db } from '../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import CheckCircleIcon from './icons/CheckCircleIcon';
import { calculateStandings, removeUndefinedProps } from '../services/utils';
import { useAuth } from '../contexts/AuthContext';
import ClubLoginPrompt from './management/ClubLoginPrompt';

const SubmitResultsPage: React.FC = () => {
    const { isLoggedIn, user } = useAuth();
    const [competitions, setCompetitions] = useState<{ id: string, name: string }[]>([]);
    const [selectedComp, setSelectedComp] = useState('mtn-premier-league');
    const [teams, setTeams] = useState<Team[]>([]);
    const [homeTeam, setHomeTeam] = useState('');
    const [awayTeam, setAwayTeam] = useState('');
    const [homeScore, setHomeScore] = useState('');
    const [awayScore, setAwayScore] = useState('');
    const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]);
    const [matchday, setMatchday] = useState('');
    const [venue, setVenue] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const loadCompetitions = async () => {
            setLoading(true);
            const allComps = await fetchAllCompetitions();
            const leagueList = Object.entries(allComps)
                .map(([id, comp]) => ({ id, name: comp.name }));
            setCompetitions(leagueList);
            if (leagueList.length > 0 && !leagueList.find(l => l.id === 'mtn-premier-league')) {
                setSelectedComp(leagueList[0].id);
            }
            setLoading(false);
        };
        loadCompetitions();
    }, []);

    useEffect(() => {
        const loadTeams = async () => {
            if (!selectedComp) return;
            setLoading(true);
            const competitionData = await fetchCompetition(selectedComp);
            setTeams(competitionData?.teams?.sort((a,b) => a.name.localeCompare(b.name)) || []);
            resetForm(); // Reset form when competition changes
            setLoading(false);
        };
        if (isLoggedIn) {
            loadTeams();
        }
    }, [selectedComp, isLoggedIn]);

    const resetForm = () => {
        setHomeTeam('');
        setAwayTeam('');
        setHomeScore('');
        setAwayScore('');
        setMatchDate(new Date().toISOString().split('T')[0]);
        setMatchday('');
        setVenue('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (homeTeam === awayTeam && homeTeam !== '') {
            setStatusMessage({ type: 'error', text: 'Home and Away teams cannot be the same.' });
            return;
        }
        if (!homeTeam || !awayTeam || !homeScore || !awayScore || !matchday) {
            setStatusMessage({ type: 'error', text: 'Please fill in all fields.' });
            return;
        }

        setSubmitting(true);
        setStatusMessage({ type: '', text: '' });
        
        try {
            const docRef = doc(db, 'competitions', selectedComp);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) {
                    throw new Error("Competition not found in database.");
                }

                const competition = docSnap.data() as Competition;
                const currentTeams = competition.teams || [];
                const currentFixtures = competition.fixtures || [];
                const currentResults = competition.results || [];

                const fixtureToMove = currentFixtures.find(f => 
                    f.status === 'scheduled' &&
                    f.teamA === homeTeam &&
                    f.teamB === awayTeam
                );

                const updatedFixtures = fixtureToMove ? currentFixtures.filter(f => f.id !== fixtureToMove.id) : currentFixtures;
                let newResult: CompetitionFixture;
                const matchDateObj = new Date(matchDate);

                const resultData = {
                    status: 'finished' as const,
                    scoreA: parseInt(homeScore, 10),
                    scoreB: parseInt(awayScore, 10),
                    fullDate: matchDate,
                    date: matchDateObj.getDate().toString(),
                    day: matchDateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
                    matchday: parseInt(matchday, 10),
                    venue: venue,
                };
                
                if (fixtureToMove) {
                     console.log("Found existing scheduled fixture to update.");
                     newResult = { ...fixtureToMove, ...resultData };
                } else {
                    console.log("No existing scheduled fixture found, adding new result.");
                    // DUPLICATE CHECK: Verify this exact result doesn't already exist.
                    const resultExists = currentResults.some(r =>
                        r.fullDate === matchDate &&
                        ((r.teamA === homeTeam && r.teamB === awayTeam) || (r.teamA === awayTeam && r.teamB === homeTeam))
                    );
                    if (resultExists) {
                        throw new Error("This result has already been submitted.");
                    }
                    newResult = {
                        id: Date.now(),
                        teamA: homeTeam,
                        teamB: awayTeam,
                        time: '15:00', // Default time
                        ...resultData
                    };
                }
                
                const updatedResults = [...currentResults, newResult];
                const updatedTeamsWithNewStats = calculateStandings(currentTeams, updatedResults, updatedFixtures);

                // CRITICAL: Sanitize the entire payload before updating.
                transaction.update(docRef, removeUndefinedProps({
                    fixtures: updatedFixtures,
                    results: updatedResults,
                    teams: updatedTeamsWithNewStats
                }));
                
                setTeams(updatedTeamsWithNewStats); 
            });


            setStatusMessage({ type: 'success', text: 'Result submitted and league logs updated successfully!' });
            resetForm();

        } catch (error) {
            console.error(error);
            setStatusMessage({ type: 'error', text: (error as Error).message || 'Failed to submit result. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };
    
    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
    
    if (!isLoggedIn || (user?.role !== 'club_admin' && user?.role !== 'super_admin')) {
        return (
            <div className="bg-gray-50 py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
                    <ClubLoginPrompt />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
                        Submit Match Results
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        Add a finished match result to a competition. The league log will be automatically recalculated.
                    </p>
                </div>
                
                <Card className="max-w-3xl mx-auto shadow-lg">
                    <CardContent className="p-8">
                        {loading ? <div className="flex justify-center"><Spinner /></div> : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="competition" className="block text-sm font-medium text-gray-700 mb-1">Competition</label>
                                    <select id="competition" value={selectedComp} onChange={e => setSelectedComp(e.target.value)} className={inputClass}>
                                        {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4">
                                    {teams.length > 0 ? (
                                        <>
                                            <select value={homeTeam} onChange={e => setHomeTeam(e.target.value)} className={inputClass} required>
                                                <option value="" disabled>Select Home Team</option>
                                                {teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                            </select>
                                            <span className="font-bold text-gray-500 text-center">vs</span>
                                            <select value={awayTeam} onChange={e => setAwayTeam(e.target.value)} className={inputClass} required>
                                                <option value="" disabled>Select Away Team</option>
                                                {teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                            </select>
                                        </>
                                    ) : (
                                         <p className="text-sm text-red-600 col-span-3">No teams found for this competition. Please add teams via the Admin Panel.</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                                    <input type="number" value={homeScore} onChange={e => setHomeScore(e.target.value)} placeholder="Home Score" className={`${inputClass} text-center`} min="0" required />
                                    <span className="font-bold text-2xl text-gray-400">-</span>
                                    <input type="number" value={awayScore} onChange={e => setAwayScore(e.target.value)} placeholder="Away Score" className={`${inputClass} text-center`} min="0" required />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="matchDate" className="block text-sm font-medium text-gray-700 mb-1">Match Date</label>
                                        <input type="date" id="matchDate" value={matchDate} onChange={e => setMatchDate(e.target.value)} className={inputClass} required />
                                    </div>
                                    <div>
                                        <label htmlFor="matchday" className="block text-sm font-medium text-gray-700 mb-1">Matchday</label>
                                        <input type="number" id="matchday" value={matchday} onChange={e => setMatchday(e.target.value)} placeholder="e.g., 5" className={inputClass} min="1" required />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-1">Venue (Optional)</label>
                                    <input type="text" id="venue" value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g., Somhlolo National Stadium" className={inputClass} />
                                </div>

                                {statusMessage.text && (
                                    <div className={`p-3 rounded-md text-sm font-semibold ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {statusMessage.text}
                                    </div>
                                )}
                                
                                <div className="text-right">
                                    <Button type="submit" className="bg-primary text-white hover:bg-primary-dark w-full sm:w-auto h-10 flex items-center justify-center" disabled={submitting || teams.length === 0}>
                                        {submitting ? <Spinner className="w-5 h-5 border-2" /> : 'Submit Result'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SubmitResultsPage;