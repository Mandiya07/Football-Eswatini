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

// --- DYNAMIC DATES ---
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

const todayStr = today.toISOString().split('T')[0];
const yesterdayStr = yesterday.toISOString().split('T')[0];
const tomorrowStr = tomorrow.toISOString().split('T')[0];

const todayDay = today.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
const tomorrowDay = tomorrow.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

// --- MOCK DATA & DEFAULTS ---
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

const initialPromoCodes = [
    { code: 'SAVE10', type: 'percentage', value: 10, isActive: true },
    { code: 'WELCOME20', type: 'percentage', value: 20, isActive: true },
];

// --- HELPER FUNCTIONS ---
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
        const teamA = teams[i];
        const teamB = teams[i+1];
        const isResult = type === 'results';
        const match: CompetitionFixture = {
            id: Date.now() + i + (isResult ? 1000 : 2000),
            matchday: isResult ? 1 : 2,
            teamA: teamA.name,
            teamB: teamB.name,
            date: isResult ? yesterday.getDate().toString() : tomorrow.getDate().toString(),
            day: isResult ? yesterday.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase() : tomorrowDay,
            fullDate: isResult ? yesterdayStr : tomorrowStr,
            time: '15:00',
            status: isResult ? 'finished' : 'scheduled',
            venue: 'Regional Sports Ground'
        };
        if (isResult) {
            match.scoreA = Math.floor(Math.random() * 3);
            match.scoreB = Math.floor(Math.random() * 3);
        }
        matches.push(match);
    }
    return matches;
};

const SeedDatabase: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const handleSeed = async () => {
        if (!window.confirm("This will overwrite global content and seed new league data. Proceed?")) return;
        setLoading(true);
        setStatus(null);

        try {
            const batch = writeBatch(db);

            batch.set(doc(db, 'sponsors', 'main'), sponsors);
            batch.set(doc(db, 'ads', 'main'), initialAds);
            batch.set(doc(db, 'referees', 'main'), refereeData);

            for (const cat of initialCategories) { batch.set(doc(db, 'categories', cat.id), cat); }
            for (const item of newsData) { batch.set(doc(db, 'news', item.id), item); }
            for (const item of videoData) { batch.set(doc(db, 'videos', item.id), item); }
            for (const item of youthData) { batch.set(doc(db, 'youth', item.id), item); }
            for (const item of cupData) { batch.set(doc(db, 'cups', item.id), item); }
            for (const item of coachingContent) { batch.set(doc(collection(db, 'coaching')), item); }
            for (const item of onThisDayData) { batch.set(doc(db, 'onThisDay', item.id.toString()), item); }
            for (const item of archiveData) { batch.set(doc(db, 'archive', item.id.toString()), item); }
            for (const item of directoryData) { batch.set(doc(db, 'directory', item.id), item); }
            for (const item of scoutingData) { batch.set(doc(db, 'scouting', item.id), item); }
            for (const item of products) { batch.set(doc(db, 'products', item.id), item); }
            for (const item of initialExclusiveContent) { batch.set(doc(db, 'exclusiveContent', item.id), item); }
            for (const item of initialTeamYamVideos) { batch.set(doc(db, 'teamYamVideos', item.id), item); }
            for (const code of initialPromoCodes) { batch.set(doc(collection(db, 'promo_codes')), code); }
            for (const tourn of internationalData) { batch.set(doc(db, 'hybrid_tournaments', tourn.id), tourn); }

            const regionalCompetitions = [
                {
                    id: 'shiselweni-super-league-northern-zone',
                    name: 'Shiselweni Super League (Northern Zone)',
                    teamNames: ['Hlathikhulu FC', 'Hlathikhulu United', 'Kubuta FC', 'Mtsambama FC', 'Sandleni United', 'Grand Valley FC']
                },
                {
                    id: 'hhohho-super-league-northern-zone',
                    name: 'Hhohho Super League (Northern Zone)',
                    teamNames: ['Pigg\'s Peak Rangers', 'Mhlatane United', 'Ntfonjeni Stars', 'Buhleni United', 'Mvuma Hotspurs', 'Manchester United PP']
                },
                {
                    id: 'manzini-super-league',
                    name: 'Manzini Super League',
                    teamNames: ['Manzini Sea Birds II', 'Ludzeludze Brothers', 'Matsapha United', 'Moneni Pirates II', 'Malkerns FC', 'Luyengo Foxes']
                },
                {
                    id: 'lubombo-super-league',
                    name: 'Lubombo Super League',
                    teamNames: ['Siteki Scouts', 'Big Bend United', 'Simunye FC', 'Mhlume Peacemakers', 'Vuvulane Stars', 'Tshaneni City']
                }
            ];

            const seedLeagueGroup = (comps: any[], categoryId: string) => {
                comps.forEach(comp => {
                    const teams = generateTeams(comp.teamNames);
                    const results = generateMatches(teams, 'results');
                    const fixtures = generateMatches(teams, 'fixtures');
                    const finalTeams = calculateStandings(teams, results, fixtures);

                    batch.set(doc(db, 'competitions', comp.id), {
                        name: comp.name,
                        displayName: comp.name,
                        categoryId: categoryId,
                        teams: finalTeams,
                        fixtures: fixtures,
                        results: results,
                        logoUrl: `https://via.placeholder.com/150?text=${comp.name.charAt(0)}`
                    });
                });
            };

            seedLeagueGroup(regionalCompetitions, 'regional-leagues');

            await batch.commit();
            setStatus({ type: 'success', msg: 'Database seeded! UEFA Champions League 36-team League Phase is now active in the International Hub.' });
        } catch (error) {
            console.error("Seeding failed:", error);
            setStatus({ type: 'error', msg: 'Failed to seed database.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <DatabaseIcon className="w-6 h-6 text-blue-600" />
                    <h3 className="text-2xl font-bold font-display text-gray-800">Seed Database</h3>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                    Restore default data and ensure Hlathikhulu FC and Hlathikhulu United are treated as separate teams. This will also reset International Hub data.
                </p>
                <Button onClick={handleSeed} disabled={loading} className="bg-blue-600 text-white hover:bg-blue-700 h-11 px-6">
                    {loading ? <Spinner className="w-5 h-5 border-2"/> : <>Seed Data</>}
                </Button>
                {status && (
                    <div className={`mt-6 p-3 rounded-md text-sm font-semibold flex items-center gap-2 ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {status.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <AlertTriangleIcon className="w-5 h-5" />}
                        {status.msg}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default SeedDatabase;