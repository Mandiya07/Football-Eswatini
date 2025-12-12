
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

// --- DYNAMIC DATES ---
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const dayAfterTomorrow = new Date(today);
dayAfterTomorrow.setDate(today.getDate() + 2);

const todayStr = today.toISOString().split('T')[0];
const tomorrowStr = tomorrow.toISOString().split('T')[0];
const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];

const todayDay = today.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
const tomorrowDay = tomorrow.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
const dayAfterTomorrowDay = dayAfterTomorrow.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

// --- MOCK DATA & DEFAULTS ---
const initialAds = {
    'homepage-banner': {
        imageUrl: 'https://via.placeholder.com/1200x150/002B7F/FFFFFF?text=Eswatini+Mobile+-+Official+Telecommunications+Partner',
        link: '#',
        altText: 'Advertisement for Eswatini Mobile'
    },
    'fixtures-banner': {
        imageUrl: 'https://via.placeholder.com/800x100/000000/FFFFFF?text=UMBRO+-+Official+Kit+Supplier',
        link: '#',
        altText: 'Advertisement for Umbro'
    },
    'news-listing-top-banner': {
        imageUrl: 'https://via.placeholder.com/1200x120/D22730/FFFFFF?text=MTN+-+Proud+Sponsors+of+the+Premier+League',
        link: '#',
        altText: 'Advertisement for MTN'
    },
    'news-article-top-banner': {
        imageUrl: 'https://via.placeholder.com/800x100/FDB913/002B7F?text=Subscribe+to+our+Newsletter+for+Exclusive+News',
        link: '#/profile/setup',
        altText: 'Newsletter Subscription Banner'
    },
    'live-scoreboard-banner': {
        imageUrl: 'https://via.placeholder.com/1200x120/228B22/FFFFFF?text=Live+Updates+Powered+by+Instacash',
        link: '#',
        altText: 'Advertisement for Instacash'
    },
    'community-hub-banner': {
        imageUrl: 'https://via.placeholder.com/1200x120/FF4500/FFFFFF?text=Support+Local+Football+-+Hub+Hardware',
        link: '#',
        altText: 'Advertisement for Hub Hardware'
    },
    'directory-banner': {
        imageUrl: 'https://via.placeholder.com/1200x120/00008B/FFFFFF?text=Find+Your+Local+Club+-+Sponsored+by+Standard+Bank',
        link: '#',
        altText: 'Advertisement for Standard Bank'
    },
    'interactive-zone-banner': {
        imageUrl: 'https://via.placeholder.com/1200x120/4B0082/FFFFFF?text=Predict+and+Win+-+Eswatini+Gaming+Board',
        link: '#',
        altText: 'Advertisement for Eswatini Gaming'
    }
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
    { code: 'FLASHSALE', type: 'fixed', value: 50, isActive: true },
];

// --- HELPER FUNCTIONS ---
const generateTeams = (names: string[]): Team[] => {
    return names.map((name, index) => ({
        id: 1000 + index + Math.floor(Math.random() * 1000),
        name,
        crestUrl: `https://via.placeholder.com/128/333333/FFFFFF?text=${name.charAt(0)}`,
        stats: { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' },
        players: [],
        fixtures: [],
        results: [],
        staff: []
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
            id: Date.now() + i,
            matchday: isResult ? 1 : 2,
            teamA: teamA.name,
            teamB: teamB.name,
            date: isResult ? today.getDate().toString() : tomorrow.getDate().toString(),
            day: isResult ? todayDay : tomorrowDay,
            fullDate: isResult ? todayStr : tomorrowStr,
            time: '15:00',
            status: isResult ? 'finished' : 'scheduled',
            venue: 'Regional Ground'
        };

        if (isResult) {
            match.scoreA = Math.floor(Math.random() * 3);
            match.scoreB = Math.floor(Math.random() * 3);
            
            // Update Team Stats for results
            teamA.stats.p++;
            teamB.stats.p++;
            teamA.stats.gs += match.scoreA;
            teamA.stats.gc += match.scoreB;
            teamB.stats.gs += match.scoreB;
            teamB.stats.gc += match.scoreA;
            teamA.stats.gd = teamA.stats.gs - teamA.stats.gc;
            teamB.stats.gd = teamB.stats.gs - teamB.stats.gc;

            if (match.scoreA > match.scoreB) {
                teamA.stats.w++; teamA.stats.pts += 3; teamB.stats.l++;
                teamA.stats.form = 'W'; teamB.stats.form = 'L';
            } else if (match.scoreB > match.scoreA) {
                teamB.stats.w++; teamB.stats.pts += 3; teamA.stats.l++;
                teamB.stats.form = 'W'; teamA.stats.form = 'L';
            } else {
                teamA.stats.d++; teamA.stats.pts += 1;
                teamB.stats.d++; teamB.stats.pts += 1;
                teamA.stats.form = 'D'; teamB.stats.form = 'D';
            }
        }
        matches.push(match);
    }
    return matches;
};

const SeedDatabase: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const handleSeed = async () => {
        if (!window.confirm("This will overwrite existing categories, ads, and static content. Competition data will be added if missing. Proceed?")) return;
        
        setLoading(true);
        setStatus(null);

        try {
            const batch = writeBatch(db);

            // 1. Global Settings & Content
            batch.set(doc(db, 'sponsors', 'main'), sponsors);
            batch.set(doc(db, 'ads', 'main'), initialAds);
            batch.set(doc(db, 'referees', 'main'), refereeData);

            // 2. Categories
            for (const cat of initialCategories) {
                batch.set(doc(db, 'categories', cat.id), cat);
            }

            // 3. News
            for (const item of newsData) {
                batch.set(doc(db, 'news', item.id), item);
            }

            // 4. Features
            for (const item of videoData) {
                batch.set(doc(db, 'videos', item.id), item);
            }
            for (const item of youthData) {
                batch.set(doc(db, 'youth', item.id), item);
            }
            for (const item of cupData) {
                batch.set(doc(db, 'cups', item.id), item);
            }
            for (const item of coachingContent) {
                const docRef = doc(collection(db, 'coaching')); // Auto-ID for new features
                batch.set(docRef, item);
            }
            for (const item of onThisDayData) {
                batch.set(doc(db, 'onThisDay', item.id.toString()), item);
            }
            for (const item of archiveData) {
                batch.set(doc(db, 'archive', item.id.toString()), item);
            }
            for (const item of directoryData) {
                batch.set(doc(db, 'directory', item.id), item);
            }
            for (const item of scoutingData) {
                batch.set(doc(db, 'scouting', item.id), item);
            }
            for (const item of products) {
                batch.set(doc(db, 'products', item.id), item);
            }

            // Seed Exclusive Content
            for (const item of initialExclusiveContent) {
                batch.set(doc(db, 'exclusiveContent', item.id), item);
            }
            
            // Seed Team Yam Videos
            for (const item of initialTeamYamVideos) {
                batch.set(doc(db, 'teamYamVideos', item.id), item);
            }
            
            // Seed Promo Codes
            for (const code of initialPromoCodes) {
                const docRef = doc(collection(db, 'promo_codes'));
                batch.set(docRef, code);
            }

            // 5. Regional Competitions Setup
            const regionalCompetitions = [
                {
                    id: 'hhohho-super-league-northern-zone',
                    name: 'Hhohho Super League (Northern Zone)',
                    teamNames: ['Pigg\'s Peak Rangers', 'Mhlatane United', 'Ntfonjeni Stars', 'Buhleni United', 'Mvuma Hotspurs', 'Manchester United PP']
                },
                {
                    id: 'hhohho-super-league-southern-zone',
                    name: 'Hhohho Super League (Southern Zone)',
                    teamNames: ['Motshane FC', 'Lobamba Wanderers', 'Ezulwini City', 'Elangeni United', 'Vusweni FC', 'Mvutjini United']
                },
                {
                    id: 'shiselweni-super-league-northern-zone',
                    name: 'Shiselweni Super League (Northern Zone)',
                    teamNames: ['Kubuta FC', 'Mtsambama FC', 'Sandleni United', 'Hlatikulu Tycoons II', 'Grand Valley FC', 'Phusumoya Stars']
                },
                {
                    id: 'shiselweni-super-league-southern-zone',
                    name: 'Shiselweni Super League (Southern Zone)',
                    teamNames: ['Nhlangano Sun', 'Zombodze Eels', 'Matsanjeni United', 'Lavumisa FC', 'Hluthi Highlanders', 'Sigwe FC']
                },
                {
                    id: 'lubombo-super-league',
                    name: 'Lubombo Super League',
                    teamNames: ['Siteki Scouts', 'Big Bend United', 'Simunye FC', 'Mhlume Peacemakers', 'Vuvulane Stars', 'Tshaneni City']
                },
                {
                    id: 'manzini-super-league',
                    name: 'Manzini Super League',
                    teamNames: ['Manzini Sea Birds II', 'Ludzeludze Brothers', 'Matsapha United', 'Moneni Pirates II', 'Malkerns FC', 'Luyengo Foxes']
                }
            ];

            // 6. National Team Competitions Setup
            const nationalCompetitions = [
                {
                    id: 'national-u17-cosafa',
                    name: 'National U17 - COSAFA',
                    description: 'Regional youth championship for the Under-17 squad.',
                    teamNames: ['Eswatini U17', 'South Africa U17', 'Zambia U17', 'Botswana U17', 'Mozambique U17', 'Lesotho U17']
                },
                {
                    id: 'national-u20-cosafa',
                    name: 'National U-20 - COSAFA',
                    description: 'The COSAFA U-20 Challenge Cup campaign.',
                    teamNames: ['Eswatini U20', 'Angola U20', 'Namibia U20', 'Malawi U20', 'Zimbabwe U20', 'Comoros U20']
                },
                {
                    id: 'world-cup-qualifiers-men',
                    name: 'World Cup Qualifiers (Men)',
                    description: 'Sihlangu Semnikati\'s journey to the FIFA World Cup.',
                    teamNames: ['Eswatini', 'Cameroon', 'Libya', 'Angola', 'Mauritius', 'Cape Verde']
                },
                {
                    id: 'world-cup-qualifiers-women',
                    name: 'World Cup Qualifiers (Women)',
                    description: 'Sitsebe SaMhlekazi\'s quest for global qualification.',
                    teamNames: ['Eswatini Women', 'Burkina Faso Women', 'South Africa Women', 'Zambia Women']
                }
            ];

            const seedLeagueGroup = (comps: typeof regionalCompetitions, categoryId: string) => {
                comps.forEach(comp => {
                    const teams = generateTeams(comp.teamNames);
                    const results = generateMatches(teams, 'results'); // Populate logs
                    const fixtures = generateMatches(teams, 'fixtures'); // Populate upcoming

                    // Sort teams by points for the log
                    teams.sort((a, b) => b.stats.pts - a.stats.pts);

                    batch.set(doc(db, 'competitions', comp.id), {
                        name: comp.name,
                        displayName: comp.name,
                        description: (comp as any).description || '',
                        categoryId: categoryId,
                        teams: teams,
                        fixtures: fixtures,
                        results: results,
                        logoUrl: `https://via.placeholder.com/150?text=${comp.name.charAt(0)}`
                    });
                });
            };

            seedLeagueGroup(regionalCompetitions, 'regional-leagues');
            seedLeagueGroup(nationalCompetitions, 'national-teams');

            await batch.commit();
            setStatus({ type: 'success', msg: 'Database seeded successfully! Shop Discounts, Leagues, Features, and Exclusive Content updated.' });
        } catch (error) {
            console.error("Seeding failed:", error);
            setStatus({ type: 'error', msg: 'Failed to seed database. Check console for errors.' });
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
                    Initialize or reset the database with default content, including the <strong>National Team</strong> competitions, <strong>Regional</strong> leagues, <strong>Exclusive Content</strong>, <strong>Team Yam</strong> videos, and <strong>Shop Promo Codes</strong>.
                    Use this if the app is empty or you want to restore default demo data.
                </p>

                <Button 
                    onClick={handleSeed} 
                    disabled={loading} 
                    className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 h-11 w-auto flex justify-center items-center gap-2 px-6"
                >
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
