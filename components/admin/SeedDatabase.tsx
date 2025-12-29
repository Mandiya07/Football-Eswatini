import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import DatabaseIcon from '../icons/DatabaseIcon';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';

import { db } from '../../services/firebase';
import { doc, writeBatch, collection } from "firebase/firestore";
import { sponsors } from '../../data/sponsors';
import { newsData } from '../../data/news';
import { videoData } from '../../data/videos';
import { youthData } from '../../data/youth';
import { cupData } from '../../data/cups';
import { coachingContent } from '../../data/coaching';
import { onThisDayData, archiveData } from '../../data/memoryLane';
import { directoryData } from '../../data/directory';
import { scoutingData } from '../../data/scouting';
import { products } from '../../data/shop';
import { refereeData } from '../../data/referees';
import { Team, CompetitionFixture } from '../../data/teams';
import { initialExclusiveContent, initialTeamYamVideos } from '../../data/features';
import { internationalData } from '../../data/international';
import { calculateStandings, removeUndefinedProps } from '../../services/utils';

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

const yesterdayStr = yesterday.toISOString().split('T')[0];
const tomorrowStr = tomorrow.toISOString().split('T')[0];
const tomorrowDay = tomorrow.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

const initialAds = {
    'homepage-banner': { imageUrl: 'https://via.placeholder.com/1200x150/002B7F/FFFFFF?text=Eswatini+Mobile+-+Official+Partner', link: '#', altText: 'Ad' },
    'fixtures-banner': { imageUrl: 'https://via.placeholder.com/800x100/000000/FFFFFF?text=UMBRO+-+Official+Kit+Supplier', link: '#', altText: 'Ad' },
    'news-listing-top-banner': { imageUrl: 'https://via.placeholder.com/1200x120/D22730/FFFFFF?text=MTN+-+Proud+Sponsors', link: '#', altText: 'Ad' },
    'news-article-top-banner': { imageUrl: 'https://via.placeholder.com/800x100/FDB913/002B7F?text=Join+our+Newsletter', link: '#', altText: 'Ad' },
    'live-scoreboard-banner': { imageUrl: 'https://via.placeholder.com/1200x120/228B22/FFFFFF?text=Powered+by+Instacash', link: '#', altText: 'Ad' },
    'community-hub-banner': { imageUrl: 'https://via.placeholder.com/1200x120/FF4500/FFFFFF?text=Hub+Hardware', link: '#', altText: 'Ad' },
    'directory-banner': { imageUrl: 'https://via.placeholder.com/1200x120/00008B/FFFFFF?text=Standard+Bank', link: '#', altText: 'Ad' },
    'interactive-zone-banner': { imageUrl: 'https://via.placeholder.com/1200x120/4B0082/FFFFFF?text=Predict+and+Win', link: '#', altText: 'Ad' }
};

const initialCategories = [
    { id: 'national-teams', name: 'National Teams', order: 5 },
    { id: 'premier-leagues', name: 'Premier Leagues', order: 10 },
    { id: 'international-leagues', name: 'International Leagues', order: 15 },
    { id: 'national-divisions', name: 'National Divisions', order: 20 },
    { id: 'regional-leagues', name: 'Regional Leagues', order: 30 },
    { id: 'development', name: 'Development', order: 40 },
];

const generateTeams = (names: string[]): Team[] => {
    return names.map((name, index) => ({
        id: 2000 + index + Math.floor(Math.random() * 500),
        name,
        crestUrl: `https://via.placeholder.com/128/333333/FFFFFF?text=${name.charAt(0)}`,
        stats: { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' },
        players: [], fixtures: [], results: [], staff: []
    }));
};

const generateMatches = (teams: Team[], type: 'results' | 'fixtures') => {
    const matches: CompetitionFixture[] = [];
    for (let i = 0; i < teams.length; i += 2) {
        if (i + 1 >= teams.length) break;
        const isResult = type === 'results';
        matches.push({
            id: Date.now() + i + (isResult ? 1000 : 2000),
            matchday: isResult ? 1 : 2,
            teamA: teams[i].name,
            teamB: teams[i+1].name,
            date: isResult ? yesterday.getDate().toString() : tomorrow.getDate().toString(),
            day: isResult ? yesterday.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase() : tomorrowDay,
            fullDate: isResult ? yesterdayStr : tomorrowStr,
            time: '15:00',
            status: isResult ? 'finished' : 'scheduled',
            scoreA: isResult ? Math.floor(Math.random() * 3) : undefined,
            scoreB: isResult ? Math.floor(Math.random() * 3) : undefined,
            venue: 'Regional Sports Ground'
        });
    }
    return matches;
};

const SeedDatabase: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const handleSeed = async () => {
        if (!window.confirm("This will initialize all Hubs, Categories, and the UEFA Champions League 36-team Phase. Proceed?")) return;
        setLoading(true);
        setStatus(null);
        console.log("Starting database seed...");

        try {
            const batch = writeBatch(db);
            const m = { merge: true };

            // Singleton Configs
            console.log("Adding config documents...");
            batch.set(doc(db, 'sponsors', 'main'), sponsors, m);
            batch.set(doc(db, 'ads', 'main'), initialAds, m);
            batch.set(doc(db, 'referees', 'main'), refereeData, m);

            // Categories
            console.log("Adding categories...");
            initialCategories.forEach(cat => {
                batch.set(doc(db, 'categories', cat.id), cat, m);
            });

            // Directory
            console.log("Adding directory entries...");
            directoryData.forEach(item => {
                batch.set(doc(db, 'directory', item.id), item, m);
            });
            
            // International Tournaments (UEFA Champions League 36 teams)
            console.log("Adding international tournaments...");
            internationalData.forEach(tourn => {
                const tournRef = doc(db, 'hybrid_tournaments', tourn.id);
                // Strip ID for cleaner DB structure
                const { id, ...data } = tourn;
                batch.set(tournRef, data, m);
            });

            // Regional Super Leagues
            console.log("Adding regional leagues...");
            const regionalCompetitions = [
                { id: 'hhohho-super-league-northern-zone', name: 'Hhohho Super League (Northern Zone)', teams: ['Pigg\'s Peak Rangers', 'Mhlatane United', 'Ntfonjeni Stars', 'Buhleni United'] },
                { id: 'hhohho-super-league-southern-zone', name: 'Hhohho Super League (Southern Zone)', teams: ['Mbabane Citizens', 'Sithobela United', 'Motshane FC', 'Lozitha Spurs'] },
                { id: 'manzini-super-league', name: 'Manzini Super League', teams: ['Manzini Sea Birds II', 'Ludzeludze Brothers', 'Matsapha United', 'Moneni Pirates II'] },
                { id: 'lubombo-super-league', name: 'Lubombo Super League', teams: ['Siteki Scouts', 'Big Bend United', 'Simunye FC', 'Mhlume Peacemakers'] },
                { id: 'shiselweni-super-league-northern-zone', name: 'Shiselweni Super League (Northern Zone)', teams: ['Hlathikhulu FC', 'Hlathikhulu United', 'Kubuta FC', 'Mtsambama FC'] },
                { id: 'shiselweni-super-league-southern-zone', name: 'Shiselweni Super League (Southern Zone)', teams: ['Nhlangano Sun', 'Sigwe FC', 'Zombodze Eels', 'Mhlosheni Stars'] }
            ];

            regionalCompetitions.forEach(comp => {
                const teams = generateTeams(comp.teams);
                const results = generateMatches(teams, 'results');
                const fixtures = generateMatches(teams, 'fixtures');
                const finalTeams = calculateStandings(teams, results, fixtures);

                batch.set(doc(db, 'competitions', comp.id), {
                    name: comp.name,
                    categoryId: 'regional-leagues',
                    teams: finalTeams,
                    fixtures: fixtures,
                    results: results,
                    logoUrl: `https://via.placeholder.com/150?text=${comp.name.charAt(0)}`
                }, m);
            });

            console.log("Committing batch...");
            await batch.commit();
            console.log("Batch commit successful!");
            setStatus({ type: 'success', msg: 'Database updated! International Hub and Regional Leagues are now synced.' });
        } catch (error: any) {
            console.error("Seed error:", error);
            setStatus({ type: 'error', msg: 'Failed: ' + (error.message || 'Check browser console for details.') });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="shadow-lg border-2 border-blue-100">
            <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <DatabaseIcon className="w-6 h-6 text-blue-600" />
                    <h3 className="text-2xl font-bold font-display text-gray-800">Initialize Hub Data</h3>
                </div>
                <p className="text-sm text-gray-600 mb-6 italic">
                    Note: This will push all core configurations, categories, the UEFA Champions League 36-team pots, and Regional Super League zones to your database.
                </p>
                
                <div className="flex flex-col gap-4">
                    <Button 
                        onClick={handleSeed} 
                        disabled={loading} 
                        className="bg-blue-600 text-white hover:bg-blue-700 h-11 px-8 shadow-lg w-full sm:w-fit"
                    >
                        {loading ? <Spinner className="w-5 h-5 border-2"/> : 'Initialize Leagues'}
                    </Button>
                    
                    {status && (
                        <div className={`p-4 rounded-lg text-sm font-bold flex items-center gap-2 ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {status.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <AlertTriangleIcon className="w-5 h-5" />}
                            <div>
                                <p>{status.msg}</p>
                                {status.type === 'error' && (
                                    <p className="text-xs font-normal mt-1">If this persists, check if your Firebase Security Rules allow writing to these collections.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default SeedDatabase;