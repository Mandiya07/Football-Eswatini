import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import { fetchAllCompetitions, fetchCompetition } from '../services/api';
import { Competition, Team, CompetitionFixture } from '../data/teams';
import { db } from '../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import CheckCircleIcon from './icons/CheckCircleIcon';
import { removeUndefinedProps } from '../services/utils';
import { useAuth } from '../contexts/AuthContext';
import ClubLoginPrompt from './management/ClubLoginPrompt';

const SubmitFixturesPage: React.FC = () => {
    const { isLoggedIn, user } = useAuth();
    const [competitions, setCompetitions] = useState<{ id: string, name: string }[]>([]);
    const [selectedComp, setSelectedComp] = useState('mtn-premier-league');
    const [teams, setTeams] = useState<Team[]>([]);
    const [homeTeam, setHomeTeam] = useState('');
    const [awayTeam, setAwayTeam] = useState('');
    const [matchDateTime, setMatchDateTime] = useState('');
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
        setMatchDateTime('');
        setMatchday('');
        setVenue('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (homeTeam === awayTeam && homeTeam !== '') {
            setStatusMessage({ type: 'error', text: 'Home and Away teams cannot be the same.' });
            return;
        }
        if (!homeTeam || !awayTeam || !matchDateTime || !matchday) {
            setStatusMessage({ type: 'error', text: 'Please fill in all required fields.' });
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
                const currentFixtures = competition.fixtures || [];
                const currentResults = competition.results || [];
                const matchDateTimeObj = new Date(matchDateTime);
                const matchDateStr = matchDateTimeObj.toISOString().split('T')[0];
                
                // DUPLICATE CHECK: Verify a result for this match doesn't already exist.
                const resultExists = currentResults.some(r => 
                    r.fullDate === matchDateStr &&
                    ((r.teamA === homeTeam && r.teamB === awayTeam) || (r.teamA === awayTeam && r.teamB === homeTeam))
                );
                if (resultExists) {
                    throw new Error("A result for this match already exists. Cannot create a duplicate fixture.");
                }

                const existingFixtureIndex = currentFixtures.findIndex(f => 
                    f.teamA === homeTeam && f.teamB === awayTeam && f.fullDate === matchDateStr
                );
                
                let updatedFixtures: CompetitionFixture[];
                const fixtureData = {
                    matchday: parseInt(matchday, 10),
                    teamA: homeTeam,
                    teamB: awayTeam,
                    fullDate: matchDateStr,
                    date: matchDateTimeObj.getDate().toString(),
                    day: matchDateTimeObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
                    time: matchDateTimeObj.toTimeString().substring(0, 5),
                    venue: venue,
                    status: 'scheduled' as const,
                };

                if (existingFixtureIndex !== -1) {
                    updatedFixtures = [...currentFixtures];
                    updatedFixtures[existingFixtureIndex] = { ...updatedFixtures[existingFixtureIndex], ...fixtureData };
                    console.log("Updating existing fixture.");
                } else {
                    const newFixture: CompetitionFixture = { id: Date.now(), ...fixtureData };
                    updatedFixtures = [...currentFixtures, newFixture];
                    console.log("Adding new fixture.");
                }
                
                // CRITICAL: Sanitize the entire fixtures array payload.
                transaction.update(docRef, {
                    fixtures: removeUndefinedProps(updatedFixtures),
                });
            });


            setStatusMessage({ type: 'success', text: 'Fixture submitted successfully!' });
            resetForm();

        } catch (error) {
            console.error(error);
            setStatusMessage({ type: 'error', text: (error as Error).message || 'Failed to submit fixture. Please try again.' });
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
                        Submit Match Fixture
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        Schedule an upcoming match for a competition.
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
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="matchDateTime" className="block text-sm font-medium text-gray-700 mb-1">Match Date & Time</label>
                                        <input type="datetime-local" id="matchDateTime" value={matchDateTime} onChange={e => setMatchDateTime(e.target.value)} className={inputClass} required />
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
                                        {submitting ? <Spinner className="w-5 h-5 border-2" /> : 'Submit Fixture'}
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

export default SubmitFixturesPage;