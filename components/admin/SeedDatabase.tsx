import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

// Imports from run.js
import { db } from '../../services/firebase';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch } from "firebase/firestore";
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
// Note: calculateStandings is not used in the seeding script itself.
import { calculateStandings } from '../../services/utils';

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
    }
};
const initialCategories = [
    { id: 'national-teams', name: 'National Teams', order: 5 },
    { id: 'premier-leagues', name: 'Premier Leagues', order: 10 },
    { id: 'international-leagues', name: 'International Leagues', order: 15 },
    { id: 'national-divisions', name: 'National Divisions', order: 20 },
    { id: 'regional-leagues', name: 'Regional Leagues', order: 30 },
    { id: 'womens-leagues', name: 'Women\'s Leagues', order: 35 },
    { id: 'youth-leagues', name: 'Youth Leagues', order: 40 },
    { id: 'cup-competitions', name: 'Cup Competitions', order: 50 },
];
const photoGalleries = [ { id: 1, title: "Derby Day: Swallows vs Highlanders", date: "October 28, 2023", coverUrl: "https://picsum.photos/seed/gallery1/600/400", imageUrls: ["https://picsum.photos/seed/g1p1/1200/800", "https://picsum.photos/seed/g1p2/1200/800", "https://picsum.photos/seed/g1p3/1200/800", "https://picsum.photos/seed/g1p4/1200/800", "https://picsum.photos/seed/g1p5/1200/800"] }, { id: 2, title: "Green Mamba Crowned Champions", date: "October 15, 2023", coverUrl: "https://picsum.photos/seed/gallery2/600/400", imageUrls: ["https://picsum.photos/seed/g2p1/1200/800", "https://picsum.photos/seed/g2p2/1200/800", "https://picsum.photos/seed/g2p3/1200/800"] }, { id: 3, title: "Action from Ingwenyama Cup Final", date: "September 30, 2023", coverUrl: "https://picsum.photos/seed/gallery3/600/400", imageUrls: ["https://picsum.photos/seed/g3p1/1200/800", "https://picsum.photos/seed/g3p2/1200/800", "https://picsum.photos/seed/g3p3/1200/800", "https://picsum.photos/seed/g3p4/1200/800"] }];
const behindTheScenesData = [ { id: 1, type: 'photo', title: "Locker Room Pre-Match Talk", description: "A quiet moment of focus as the coach delivers the final instructions before a crucial match.", thumbnailUrl: "https://picsum.photos/seed/bts1/600/400", contentUrl: "https://picsum.photos/seed/bts1-full/1200/800" }, { id: 2, type: 'video', title: "Tunnel Cam: Derby Day", description: "Exclusive footage from the tunnel at Somhlolo National Stadium as the teams make their way onto the pitch for the Mbabane derby.", thumbnailUrl: "https://picsum.photos/seed/bts2/600/400", contentUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4" } ];
const premierLeagueId = 'mtn-premier-league';
const premierLeagueData = { name: "MTN Premier League", logoUrl: "https://via.placeholder.com/150/FF8C00/000000?text=MTN", categoryId: "premier-leagues", externalApiId: "4733", fixtures: [], results: [], teams: [ { id: 1, name: 'Green Mamba FC', crestUrl: 'https://via.placeholder.com/128/1E4620/FFFFFF?text=GM', players: [], fixtures: [], results: [], staff: [] }, { id: 2, name: 'Mbabane Swallows FC', crestUrl: 'https://via.placeholder.com/128/FF0000/FFFFFF?text=MS', players: [], fixtures: [], results: [], staff: [] }, { id: 3, name: 'Young Buffaloes FC', crestUrl: 'https://via.placeholder.com/128/A52A2A/FFFFFF?text=YB', players: [], fixtures: [], results: [], staff: [] }, { id: 4, name: 'Royal Leopards FC', crestUrl: 'https://via.placeholder.com/128/00008B/FFFFFF?text=RL', players: [], fixtures: [], results: [], staff: [] }, { id: 5, name: 'Mbabane Highlanders FC', crestUrl: 'https://via.placeholder.com/128/000000/FFFFFF?text=MH', players: [], fixtures: [], results: [], staff: [] }, { id: 6, name: 'Manzini Wanderers FC', crestUrl: 'https://via.placeholder.com/128/800080/FFFFFF?text=MW', players: [], fixtures: [], results: [], staff: [] }, { id: 7, name: 'Moneni Pirates FC', crestUrl: 'https://via.placeholder.com/128/FF4500/000000?text=MP', players: [], fixtures: [], results: [], staff: [] }, { id: 8, name: 'Nsingizini Hotspurs FC', crestUrl: 'https://via.placeholder.com/128/FFFF00/000000?text=NH', players: [], fixtures: [], results: [], staff: [] }, { id: 9, name: 'Manzini Sea Birds FC', crestUrl: 'https://via.placeholder.com/128/87CEEB/000000?text=MSB', players: [], fixtures: [], results: [], staff: [] }, { id: 10, name: 'Denver Sundowns FC', crestUrl: 'https://via.placeholder.com/128/F0E68C/000000?text=DS', players: [], fixtures: [], results: [], staff: [] }, { id: 11, name: 'Madlenya FC', crestUrl: 'https://via.placeholder.com/128/483D8B/FFFFFF?text=MFC', players: [], fixtures: [], results: [], staff: [] }, { id: 12, name: 'Ezulwini United FC', crestUrl: 'https://via.placeholder.com/128/008080/FFFFFF?text=EU', players: [], fixtures: [], results: [], staff: [] }, { id: 13, name: 'Mhlume Peacemakers FC', crestUrl: 'https://via.placeholder.com/128/6B8E23/FFFFFF?text=MPF', players: [], fixtures: [], results: [], staff: [] } ], };
const womensLeagueData = { name: "Eswatini Women Football League", categoryId: "womens-leagues", fixtures: [], results: [], teams: [ { id: 501, name: 'Young Buffaloes Ladies', crestUrl: 'https://via.placeholder.com/128/A52A2A/FFFFFF?text=YBL', players: [], fixtures: [], results: [], staff: [] }, { id: 502, name: 'Manzini Wanderers Ladies', crestUrl: 'https://via.placeholder.com/128/800080/FFFFFF?text=MWL', players: [], fixtures: [], results: [], staff: [] }, { id: 503, name: 'Royal Leopards Ladies', crestUrl: 'https://via.placeholder.com/128/00008B/FFFFFF?text=RLL', players: [], fixtures: [], results: [], staff: [] }, { id: 504, name: 'Mbabane Swallows Ladies', crestUrl: 'https://via.placeholder.com/128/FF0000/FFFFFF?text=MSL', players: [], fixtures: [], results: [], staff: [] }, { id: 505, name: 'Green Mamba Ladies', crestUrl: 'https://via.placeholder.com/128/1E4620/FFFFFF?text=GML', players: [], fixtures: [], results: [], staff: [] }, { id: 506, name: 'AS Interladies FC', crestUrl: 'https://via.placeholder.com/128/00BFFF/000000?text=ASL', players: [], fixtures: [], results: [], staff: [] } ] };
const firstDivisionData = { name: "National First Division", categoryId: "national-divisions", fixtures: [], results: [], teams: [ { id: 101, name: 'Hlatikulu Tycoons', crestUrl: 'https://via.placeholder.com/128/FF8C00/FFFFFF?text=HT', players: [], fixtures: [], results: [], staff: [] }, { id: 102, name: 'Illovo FC', crestUrl: 'https://via.placeholder.com/128/228B22/FFFFFF?text=IFC', players: [], fixtures: [], results: [], staff: [] }, { id: 103, name: 'Louis XIV FC', crestUrl: 'https://via.placeholder.com/128/4682B4/FFFFFF?text=LFC', players: [], fixtures: [], results: [], staff: [] }, { id: 104, name: 'Milling Hotspurs', crestUrl: 'https://via.placeholder.com/128/B22222/FFFFFF?text=MH', players: [], fixtures: [], results: [], staff: [] }, { id: 105, name: 'Seven Dreams FC', crestUrl: 'https://via.placeholder.com/128/778899/FFFFFF?text=SD', players: [], fixtures: [], results: [], staff: [] }, { id: 106, name: 'Tambankulu Celtics', crestUrl: 'https://via.placeholder.com/128/006400/FFFFFF?text=TC', players: [], fixtures: [], results: [], staff: [] } ] };
const hhohhoNorthLeagueData = { name: "Hhohho Super League (North)", categoryId: "regional-leagues", fixtures: [], results: [], teams: [ { id: 201, name: 'Ngwenya Glass', crestUrl: 'https://via.placeholder.com/128/1C1C1C/FFFFFF?text=NG', players: [], fixtures: [], results: [], staff: [] }, { id: 202, name: 'Pigg\'s Peak Black Swallows', crestUrl: 'https://via.placeholder.com/128/DAA520/000000?text=PPBS', players: [], fixtures: [], results: [], staff: [] }, { id: 203, name: 'Mayiwane', crestUrl: 'https://via.placeholder.com/128/4169E1/FFFFFF?text=MYW', players: [], fixtures: [], results: [], staff: [] }, { id: 204, name: 'Mhlume Hotspurs', crestUrl: 'https://via.placeholder.com/128/CD5C5C/FFFFFF?text=MH', players: [], fixtures: [], results: [], staff: [] } ] };
const hhohhoSouthLeagueData = { name: "Hhohho Super League (South)", categoryId: "regional-leagues", fixtures: [], results: [], teams: [ { id: 211, name: 'Lobamba Cosmos', crestUrl: 'https://via.placeholder.com/128/FF6347/FFFFFF?text=LC', players: [], fixtures: [], results: [], staff: [] }, { id: 212, name: 'Ezulwini Celtics', crestUrl: 'https://via.placeholder.com/128/2E8B57/FFFFFF?text=EC', players: [], fixtures: [], results: [], staff: [] }, { id: 213, name: 'Siphocosini', crestUrl: 'https://via.placeholder.com/128/8A2BE2/FFFFFF?text=SPS', players: [], fixtures: [], results: [], staff: [] }, { id: 214, name: 'Umbelebele Jomo Cosmos', crestUrl: 'https://via.placeholder.com/128/D2691E/FFFFFF?text=UJC', players: [], fixtures: [], results: [], staff: [] } ] };
const lubomboLeagueData = { name: "Lubombo Super League", categoryId: "regional-leagues", fixtures: [], results: [], teams: [ { id: 301, name: 'Siteki Gunners', crestUrl: 'https://via.placeholder.com/128/FF6347/FFFFFF?text=SG', players: [], fixtures: [], results: [], staff: [] }, { id: 302, name: 'Big Bend Vipers', crestUrl: 'https://via.placeholder.com/128/2E8B57/FFFFFF?text=BV', players: [], fixtures: [], results: [], staff: [] }, { id: 303, name: 'Tshaneni FC', crestUrl: 'https://via.placeholder.com/128/8A2BE2/FFFFFF?text=TFC', players: [], fixtures: [], results: [], staff: [] }, { id: 304, name: 'Simunye FC', crestUrl: 'https://via.placeholder.com/128/D2691E/FFFFFF?text=SFC', players: [], fixtures: [], results: [], staff: [] } ] };
const manziniLeagueData = { name: "Manzini Super League", categoryId: "regional-leagues", fixtures: [], results: [], teams: [ { id: 401, name: 'Matsapha United', crestUrl: 'https://via.placeholder.com/128/6A5ACD/FFFFFF?text=MU', players: [], fixtures: [], results: [], staff: [] }, { id: 402, name: 'Malkerns FC', crestUrl: 'https://via.placeholder.com/128/B8860B/FFFFFF?text=MFC', players: [], fixtures: [], results: [], staff: [] }, { id: 403, name: 'Sidvokodvo Riders', crestUrl: 'https://via.placeholder.com/128/48D1CC/000000?text=SR', players: [], fixtures: [], results: [], staff: [] }, { id: 404, name: 'Bhunya FC', crestUrl: 'https://via.placeholder.com/128/9932CC/FFFFFF?text=BFC', players: [], fixtures: [], results: [], staff: [] } ] };
const shiselweniNorthLeagueData = { name: "Shiselweni Super League (North)", categoryId: "regional-leagues", fixtures: [], results: [], teams: [ { id: 601, name: 'Nkwene Sundowns', crestUrl: 'https://via.placeholder.com/128/FFD700/000000?text=NS', players: [], fixtures: [], results: [], staff: [] }, { id: 602, name: 'New Heaven', crestUrl: 'https://via.placeholder.com/128/32CD32/FFFFFF?text=NH', players: [], fixtures: [], results: [], staff: [] }, { id: 603, name: 'Hluti', crestUrl: 'https://via.placeholder.com/128/8B0000/FFFFFF?text=HLT', players: [], fixtures: [], results: [], staff: [] }, { id: 604, name: 'Hlatikulu Tycoons', crestUrl: 'https://via.placeholder.com/128/FF8C00/FFFFFF?text=HT', players: [], fixtures: [], results: [], staff: [] } ] };
const shiselweniSouthLeagueData = { name: "Shiselweni Super League (South)", categoryId: "regional-leagues", fixtures: [], results: [], teams: [ { id: 611, name: 'Lavumisa', crestUrl: 'https://via.placeholder.com/128/00CED1/000000?text=LVM', players: [], fixtures: [], results: [], staff: [] }, { id: 612, name: 'Shiselweni Roses', crestUrl: 'https://via.placeholder.com/128/FF69B4/FFFFFF?text=SR', players: [], fixtures: [], results: [], staff: [] }, { id: 613, name: 'Zombodze', crestUrl: 'https://via.placeholder.com/128/4B0082/FFFFFF?text=ZBD', players: [], fixtures: [], results: [], staff: [] }, { id: 614, name: 'Makhosini', crestUrl: 'https://via.placeholder.com/128/556B2F/FFFFFF?text=MKS', players: [], fixtures: [], results: [], staff: [] } ] };
const cafChampionsLeagueData = { name: "CAF Champions League", categoryId: "cup-competitions", fixtures: [], results: [], teams: [ { id: 701, name: 'Al Ahly SC', crestUrl: 'https://via.placeholder.com/128/FF0000/FFFFFF?text=AA', players: [], fixtures: [], results: [], staff: [] }, { id: 702, name: 'Mamelodi Sundowns', crestUrl: 'https://via.placeholder.com/128/FFFF00/000000?text=MSD', players: [], fixtures: [], results: [], staff: [] }, { id: 703, name: 'Wydad Casablanca', crestUrl: 'https://via.placeholder.com/128/DC143C/FFFFFF?text=WAC', players: [], fixtures: [], results: [], staff: [] }, { id: 704, name: 'Espérance de Tunis', crestUrl: 'https://via.placeholder.com/128/FFDB58/FF0000?text=EST', players: [], fixtures: [], results: [], staff: [] } ] };
const cafConfederationCupData = { name: "CAF Confederation Cup", categoryId: "cup-competitions", fixtures: [], results: [], teams: [ { id: 711, name: 'Zamalek SC', crestUrl: 'https://via.placeholder.com/128/FFFFFF/FF0000?text=ZSC', players: [], fixtures: [], results: [], staff: [] }, { id: 712, name: 'USM Alger', crestUrl: 'https://via.placeholder.com/128/000000/FF0000?text=USMA', players: [], fixtures: [], results: [], staff: [] }, { id: 713, name: 'RS Berkane', crestUrl: 'https://via.placeholder.com/128/FFA500/000000?text=RSB', players: [], fixtures: [], results: [], staff: [] }, { id: 714, name: 'Orlando Pirates', crestUrl: 'https://via.placeholder.com/128/000000/FFFFFF?text=OP', players: [], fixtures: [], results: [], staff: [] } ] };
const englishPremierLeagueData = { name: "English Premier League", categoryId: "international-leagues", externalApiId: 'PL', fixtures: [], results: [], teams: [ { id: 801, name: 'Manchester City', crestUrl: 'https://via.placeholder.com/128/6CABDD/FFFFFF?text=MCFC', players: [], fixtures: [], results: [], staff: [] }, { id: 802, name: 'Arsenal', crestUrl: 'https://via.placeholder.com/128/EF0107/FFFFFF?text=AFC', players: [], fixtures: [], results: [], staff: [] }, { id: 803, name: 'Liverpool', crestUrl: 'https://via.placeholder.com/128/C8102E/FFFFFF?text=LFC', players: [], fixtures: [], results: [], staff: [] }, { id: 804, name: 'Manchester United', crestUrl: 'https://via.placeholder.com/128/DA291C/FFFFFF?text=MUFC', players: [], fixtures: [], results: [], staff: [] }, { id: 805, name: 'Chelsea', crestUrl: 'https://via.placeholder.com/128/034694/FFFFFF?text=CFC', players: [], fixtures: [], results: [], staff: [] }, { id: 806, name: 'Tottenham Hotspur', crestUrl: 'https://via.placeholder.com/128/FFFFFF/132257?text=THFC', players: [], fixtures: [], results: [], staff: [] } ] };

const SeedDatabase: React.FC = () => {
    const [isSeeding, setIsSeeding] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    const logRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [log]);

    const appendLog = (message: string) => {
        setLog(prev => [...prev, message]);
    };

    const handleSeed = async () => {
        setIsSeeding(true);
        setLog([]);

        const seedOrRepairCompetition = async (competitionId: string, data: any) => {
            const docRef = doc(db, 'competitions', competitionId);
            let docSnap = await getDoc(docRef);

            const batch = writeBatch(db);
            const teamIds = (data.teams || []).map((t: any) => t.id);

            // This part is now deprecated as teams are no longer stored in a top-level `teams` collection
            // for (const team of data.teams || []) {
            //     const teamWithCompetitionId = { ...team, competitionId: competitionId };
            //     const teamDocRef = doc(db, 'teams', String(team.id));
            //     batch.set(teamDocRef, teamWithCompetitionId);
            // }

            // The 'teams' array is now embedded directly in the competition document.
            // The `teamIds` field is deprecated and no longer needed.
            const { teamIds: _, ...competitionData } = data;
            const finalCompetitionData = { ...competitionData };

            // Check if the document exists AND if it has the old `teams` array (signifying old structure)
            if (!docSnap.exists() || docSnap.data()?.teams?.length > 0) {
                 batch.set(docRef, finalCompetitionData, { merge: true });
                 appendLog(`Competition '${competitionId}' seeded/repaired with embedded team data.`);
            } else {
                appendLog(`Competition '${competitionId}' already exists and appears to be in the old format, skipping.`);
                return;
            }

            await batch.commit();
        };

        const seedCollection = async (collectionName: string, data: any[]) => {
            appendLog(`Seeding '${collectionName}'...`);
            const collectionRef = collection(db, collectionName);
            const snapshot = await getDocs(collectionRef);

            if (snapshot.empty) {
                const batch = writeBatch(db);
                data.forEach(item => {
                    const docId = String(item.id || item.name.replace(/\s+/g, '-').toLowerCase());
                    const docRef = doc(collectionRef, docId);
                    batch.set(docRef, item);
                });
                await batch.commit();
                appendLog(`'${collectionName}' collection seeded with ${data.length} items.`);
            } else {
                appendLog(`'${collectionName}' collection already contains data. Skipping seed.`);
            }
        };

        const seedSingleDoc = async (collectionName: string, docId: string, data: any) => {
            appendLog(`Seeding single doc '${collectionName}/${docId}'...`);
            const docRef = doc(db, collectionName, docId);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                await setDoc(docRef, data);
                appendLog(`Document '${collectionName}/${docId}' seeded.`);
            } else {
                appendLog(`Document '${collectionName}/${docId}' already exists. Skipping seed.`);
            }
        };

        try {
            appendLog("--- STARTING DATABASE SEEDING & REPAIR ---");

            await seedCollection('categories', initialCategories);
            await seedCollection('news', newsData);
            await seedCollection('videos', videoData);
            await seedCollection('youth', youthData);
            await seedCollection('cups', cupData);
            await seedCollection('coaching', coachingContent);
            await seedCollection('onThisDay', onThisDayData);
            await seedCollection('archive', archiveData);
            await seedCollection('directory', directoryData);
            await seedCollection('scouting', scoutingData);
            await seedCollection('products', products);
            await seedSingleDoc('ads', 'main', initialAds);
            await seedSingleDoc('sponsors', 'main', sponsors);
            await seedSingleDoc('referees', 'main', refereeData);
            await seedCollection('photoGalleries', photoGalleries);
            await seedCollection('behindTheScenes', behindTheScenesData);

            await seedOrRepairCompetition(premierLeagueId, premierLeagueData);
            await seedOrRepairCompetition('eswatini-women-football-league', womensLeagueData);
            await seedOrRepairCompetition('national-first-division', firstDivisionData);
            await seedOrRepairCompetition('hhohho-super-league-north', hhohhoNorthLeagueData);
            await seedOrRepairCompetition('hhohho-super-league-south', hhohhoSouthLeagueData);
            await seedOrRepairCompetition('lubombo-super-league', lubomboLeagueData);
            await seedOrRepairCompetition('manzini-super-league', manziniLeagueData);
            await seedOrRepairCompetition('shiselweni-super-league-north', shiselweniNorthLeagueData);
            await seedOrRepairCompetition('shiselweni-super-league-south', shiselweniSouthLeagueData);
            await seedOrRepairCompetition('caf-champions-league', cafChampionsLeagueData);
            await seedOrRepairCompetition('caf-confederation-cup', cafConfederationCupData);
            await seedOrRepairCompetition('english-premier-league', englishPremierLeagueData);

            appendLog("\n--- DATABASE SEEDING & REPAIR COMPLETE ---");

        } catch (e) {
            appendLog(`An error occurred during seeding: ${(e as Error).message}`);
            console.error("Seeding error:", e);
        }

        setIsSeeding(false);
    };

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <h3 className="text-2xl font-bold font-display mb-1">Seed Database</h3>
                <p className="text-sm text-gray-600 mb-6">
                    Click to populate your Firestore database with the initial dataset. This is for first-time setup or for restoring data after a reset. This process can take a minute.
                </p>
                <Button onClick={handleSeed} disabled={isSeeding} className="bg-primary text-white hover:bg-primary-dark w-48 h-11 flex justify-center items-center">
                    {isSeeding ? <Spinner className="w-5 h-5 border-2" /> : 'Start Seeding'}
                </Button>
                {log.length > 0 && (
                    <div ref={logRef} className="mt-4 p-4 bg-gray-900 text-white font-mono text-xs rounded-md h-64 overflow-y-auto">
                        {log.map((line, index) => (
                            <div key={index}>{line}</div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default SeedDatabase;