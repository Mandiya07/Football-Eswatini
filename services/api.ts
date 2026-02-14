import { Team, Player, CompetitionFixture, MatchEvent, Competition } from '../data/teams';
import { NewsItem, newsData } from '../data/news';
import { app, db } from './firebase';
import { collection, getDocs, doc, getDoc, query, orderBy, addDoc, updateDoc, deleteDoc, setDoc, onSnapshot, runTransaction, deleteField, writeBatch, where, serverTimestamp, limit, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { Product, products as mockProducts } from '../data/shop';
import { ScoutedPlayer, scoutingData as mockScoutingData } from '../data/scouting';
import { DirectoryEntity, directoryData as mockDirectoryData } from '../data/directory';
import { Video, videoData as mockVideoData } from '../data/videos';
import { YouthLeague, youthData as mockYouthData } from '../data/youth';
import { Tournament, cupData as mockCupData } from '../data/cups';
import { CoachingContent, coachingContent as mockCoachingContent } from '../data/coaching';
import { OnThisDayEvent, ArchiveItem, onThisDayData as mockOnThisDayData, archiveData as mockArchiveData } from '../data/memoryLane';
import { Sponsor, KitPartner, sponsors as defaultSponsors } from '../data/sponsors';
import { PhotoAlbum, BehindTheScenesContent } from '../data/media';
import { Referee, Rule, refereeData as defaultRefereeData } from '../data/referees';
import { calculateStandings, normalizeTeamName, superNormalize, removeUndefinedProps, reconcilePlayers } from './utils';
import { User, ManagedTeam } from '../contexts/AuthContext';
import { ExclusiveItem, TeamYamVideo, initialExclusiveContent, initialTeamYamVideos } from '../data/features';
import { internationalData, youthHybridData, HybridTournament } from '../data/international';

export { type Competition, type HybridTournament }; 
export { type ExclusiveItem, type TeamYamVideo }; 

export interface StandaloneMatch extends CompetitionFixture {
    id: string;
    isFriendly: boolean;
    managedByTeam: string;
}

export interface MerchantConfig {
    momoMerchantName: string;
    momoMerchantNumber: string; 
    momoMerchantID: string;
    cardGatewayProvider: 'Flutterwave' | 'Paystack' | 'DirectBank';
    cardMerchantID: string;
    cardSecretKey: string;
    currency: string;
    isProduction: boolean;
}

export interface MerchantBalance {
    totalRevenue: number;
    pendingPayout: number;
    lastPayoutDate?: string;
}

export interface ContactInquiry {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    submittedAt: any;
}

export const getTimestamp = (item: any): number => {
    if (!item) return 0;
    if (item?.date) {
        const parsed = new Date(item.date).getTime();
        if (!isNaN(parsed)) return parsed;
    }
    if (item?.timestamp?.seconds) return item.timestamp.seconds * 1000;
    if (item?.submittedAt?.seconds) return item.submittedAt.seconds * 1000;
    if (item?.createdAt?.seconds) return item.createdAt.seconds * 1000;
    return 0;
};

export const sortByLatest = <T>(items: T[]): T[] => {
    if (!items || !Array.isArray(items)) return [];
    return [...items].sort((a, b) => {
        const timeA = getTimestamp(a);
        const timeB = getTimestamp(b);
        if (timeA === timeB) {
            return String((b as any).id || '').localeCompare(String((a as any).id || ''));
        }
        return timeB - timeA;
    });
};

const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, backoff = 1000): Promise<Response> => {
    try {
        const response = await fetch(url, options);
        if ((response.status === 429 || response.status >= 500) && retries > 0) {
            await new Promise(resolve => setTimeout(resolve, backoff));
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }
        return response;
    } catch (err) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, backoff));
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }
        throw err;
    }
};

export interface AppSettings {
    appLogoUrl?: string;
}

export interface RegionConfig {
    id: string;
    name: string;
    description: string;
    logoUrl?: string;
    color: string;
}

export interface FixtureComment {
    id: string;
    fixtureId: number | string;
    text: string;
    userId: string;
    userName: string;
    userAvatar: string;
    timestamp: any;
}

export interface NewsComment {
    id: string;
    articleId: string;
    text: string;
    userId: string;
    userName: string;
    userAvatar: string;
    timestamp: any;
}

export interface YouthArticleComment {
    id: string;
    articleId: string;
    text: string;
    userId: string;
    userName: string;
    userAvatar: string;
    timestamp: any;
}

export interface CommunityEventComment {
    id: string;
    eventId: string;
    text: string;
    userId: string;
    userName: string;
    userAvatar: string;
    timestamp: any;
}

export interface CommunityEvent {
    id: string;
    userId?: string;
    title: string;
    eventType: 'Knockout' | 'League' | 'Festival' | 'Charity' | 'Trial' | 'Workshop' | 'Other';
    description: string;
    date: string;
    time: string;
    venue: string;
    organizer: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    prizes?: string;
    fees?: string;
    posterUrl?: string;
    isSpotlight?: boolean;
    resultsSummary?: string;
    status: 'pending' | 'approved' | 'rejected';
    likes: number;
    likedBy: string[];
    createdAt: any;
}

export interface InAppNotification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
    read: boolean;
    timestamp: any;
}

export interface LeagueRegistrationRequest {
    id: string;
    leagueName: string;
    region: string;
    managerName: string;
    managerEmail: string;
    managerId: string;
    description: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: any;
    requestType: 'create' | 'manage';
    targetLeagueId?: string;
    categoryId?: string;
}

export const handleFirestoreError = (error: any, operation: string) => {
    const firebaseError = error as { code?: string, message?: string };
    const code = firebaseError.code;
    if (code === 'unavailable' || code === 'deadline-exceeded' || firebaseError.message?.includes('reach Cloud Firestore backend')) {
        return;
    }
    if (code === 'permission-denied') {
        return;
    }
    if (code === 'failed-precondition' && firebaseError.message?.includes('index')) {
        return;
    }
    console.error(`[Firestore Error] '${operation}':`, error);
};

export interface Ad {
  imageUrl: string;
  link: string;
  altText: string;
}

export interface MatchTicket {
  id: string;
  fixtureId: string | number;
  competitionId: string;
  teamA: string;
  teamB: string;
  date: string;
  time: string;
  venue: string;
  price: number;
  status: 'available' | 'sold_out';
  purchaseUrl?: string;
}

export interface PendingChange {
  id: string;
  type: 'Score Update' | 'New Player' | 'Squad Removal' | 'Match Edit' | 'Match Delete';
  description: string;
  author: string;
}

export interface ClubRegistrationRequest {
    id: string;
    userId: string;
    clubName: string;
    repName: string;
    email: string;
    phone: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: any;
    promoCode?: string;
    paymentStatus?: 'pending' | 'paid';
    tier?: string;
    managedTeams?: ManagedTeam[];
}

export interface AdvertiserRequest {
    id?: string;
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    industry: string;
    interestedPlacements: string[];
    budgetRange: string;
    status: 'pending' | 'paid' | 'contacted';
    submittedAt: any;
    promoCode?: string;
    paymentTransactionId?: string;
}

export interface SponsorRequest {
    id?: string;
    brandName: string;
    contactName: string;
    email: string;
    phone: string;
    sponsorshipTier: string;
    goals: string;
    status: 'pending' | 'paid' | 'contacted';
    submittedAt: any;
    promoCode?: string;
    paymentTransactionId?: string;
}

export interface Category {
    id: string;
    name: string;
    order: number;
    logoUrl?: string; 
}

export interface LiveUpdate {
    id: string;
    fixture_id: string;
    competition: string;
    home_team: string;
    away_team: string;
    minute: number;
    type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'full_time' | 'half_time' | 'match_postponed' | 'match_abandoned' | 'match_suspended';
    player: string;
    description: string;
    score_home: number;
    score_away: number;
    timestamp: { seconds: number, nanoseconds: number };
}

export interface PromoCode {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    isActive: boolean;
}

export type PaymentMethod = 'card' | 'momo';

export interface PaymentDetails {
    method: PaymentMethod;
    cardNumber?: string;
    expiry?: string;
    cvv?: string;
    momoNumber?: string;
}

export const fetchMerchantConfig = async (): Promise<MerchantConfig | null> => {
    try {
        const docRef = doc(db, 'settings', 'merchant');
        const snap = await getDoc(docRef);
        if (snap.exists()) return snap.data() as MerchantConfig;
        return null;
    } catch { return null; }
};

export const fetchMerchantBalance = async (): Promise<MerchantBalance> => {
    try {
        const docRef = doc(db, 'finance', 'balance');
        const snap = await getDoc(docRef);
        if (snap.exists()) return snap.data() as MerchantBalance;
        return { totalRevenue: 0, pendingPayout: 0 }; 
    } catch { 
        return { totalRevenue: 0, pendingPayout: 0 }; 
    }
};

export const recordRevenue = async (amount: number) => {
    try {
        const docRef = doc(db, 'finance', 'balance');
        await setDoc(docRef, {
            totalRevenue: increment(amount),
            pendingPayout: increment(amount)
        }, { merge: true });
    } catch (e) {
        console.error("Failed to sync revenue with database", e);
    }
};

export const updateMerchantConfig = async (data: Partial<MerchantConfig>) => {
    await setDoc(doc(db, 'settings', 'merchant'), data, { merge: true });
};

export const processPayment = async (amount: number, details: PaymentDetails): Promise<{ success: boolean; transactionId: string; message: string }> => {
    const merchant = await fetchMerchantConfig();
    return new Promise((resolve) => {
        setTimeout(async () => {
            if (details.method === 'card' && (!details.cardNumber || details.cardNumber.length < 16)) {
                return resolve({ success: false, transactionId: '', message: 'Invalid card number.' });
            }
            if (details.method === 'momo' && (!details.momoNumber || details.momoNumber.length < 8)) {
                return resolve({ success: false, transactionId: '', message: 'Invalid MTN number.' });
            }
            const isAuthorized = Math.random() < 0.99;
            if (isAuthorized) {
                const txId = `FE-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
                await recordRevenue(amount);
                resolve({ success: true, transactionId: txId, message: 'Payment settled.' });
            } else {
                resolve({ success: false, transactionId: '', message: 'Transaction declined.' });
            }
        }, 3000); 
    });
};

export const fetchAppSettings = async (): Promise<AppSettings | null> => {
    try {
        const docRef = doc(db, 'settings', 'app');
        const snap = await getDoc(docRef);
        if (snap.exists()) return snap.data() as AppSettings;
        return null;
    } catch { return null; }
};

export const updateAppSettings = async (data: Partial<AppSettings>) => {
    try {
        await setDoc(doc(db, 'settings', 'app'), data, { merge: true });
    } catch (error) {
        handleFirestoreError(error, 'update app settings');
        throw error;
    }
};

export const resetAppLogo = async () => {
    try {
        const docRef = doc(db, 'settings', 'app');
        await updateDoc(docRef, { appLogoUrl: deleteField() });
    } catch (error) {
        handleFirestoreError(error, 'reset app logo');
        throw error;
    }
};

export const addLiveUpdate = async (data: Omit<LiveUpdate, 'id' | 'timestamp'>) => {
    try {
        await addDoc(collection(db, 'live_updates'), {
            ...data,
            timestamp: serverTimestamp(),
            verified: true,
        });
    } catch (error) {
        handleFirestoreError(error, 'add live update');
        throw error;
    }
};

export const listenToLiveUpdates = (callback: (updates: LiveUpdate[]) => void): (() => void) => {
    const q = query(collection(db, "live_updates"), orderBy("timestamp", "desc"), limit(50));
    return onSnapshot(q, (querySnapshot) => {
        const updates: LiveUpdate[] = [];
        querySnapshot.forEach((doc) => { updates.push({ id: doc.id, ...doc.data() } as LiveUpdate); });
        callback(updates);
    }, (error) => {
        handleFirestoreError(error, `listen to live updates`);
        callback([]);
    });
};

export const addFixtureComment = async (fixtureId: number | string, text: string, user: User) => {
    await addDoc(collection(db, 'fixture_comments'), { fixtureId, text, userId: user.id, userName: user.name, userAvatar: user.avatar, timestamp: serverTimestamp() });
};

export const listenToFixtureComments = (fixtureId: number | string, callback: (comments: any[]) => void): (() => void) => {
    const q = query(collection(db, "fixture_comments"), where("fixtureId", "==", fixtureId));
    return onSnapshot(q, (querySnapshot) => {
        const comments: any[] = [];
        querySnapshot.forEach((doc) => { comments.push({ id: doc.id, ...doc.data() }); });
        comments.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
        callback(comments);
    });
};

export const fetchNews = async (): Promise<NewsItem[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'news'));
        const dbItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsItem));
        const dbUrls = new Set(dbItems.map(i => i.url));
        const fallbacks = newsData.filter(i => !dbUrls.has(i.url));
        const allItems = [...dbItems, ...fallbacks];
        return sortByLatest(allItems);
    } catch (error) {
        handleFirestoreError(error, 'fetch news');
        return newsData;
    }
};

export const fetchNewsArticleByUrl = async (url: string): Promise<NewsItem | null> => {
    try {
        const q = query(collection(db, 'news'), where('url', '==', url));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as NewsItem;
        }
        return newsData.find(item => item.url === url) || null;
    } catch (error) {
        return newsData.find(item => item.url === url) || null;
    }
};

export const addNewsComment = async (articleId: string, text: string, user: User) => {
    await addDoc(collection(db, 'news_comments'), { articleId, text, userId: user.id, userName: user.name, userAvatar: user.avatar, timestamp: serverTimestamp() });
};

export const listenToNewsComments = (articleId: string, callback: (comments: NewsComment[]) => void): (() => void) => {
    const q = query(collection(db, "news_comments"), where("articleId", "==", articleId));
    return onSnapshot(q, (querySnapshot) => {
        const comments: NewsComment[] = [];
        querySnapshot.forEach((doc) => { comments.push({ id: doc.id, ...doc.data() } as NewsComment); });
        comments.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
        callback(comments);
    });
};

export const fetchAllCompetitions = async (): Promise<Record<string, Competition>> => {
    const comps: Record<string, Competition> = {};
    try {
        const snapshot = await getDocs(collection(db, 'competitions'));
        snapshot.forEach(doc => { comps[doc.id] = doc.data() as Competition; });
    } catch (error) { handleFirestoreError(error, 'fetch all comps'); }
    return comps;
};

export const listenToAllCompetitions = (callback: (allComps: Record<string, Competition>) => void): (() => void) => {
    return onSnapshot(collection(db, "competitions"), (querySnapshot) => {
        const comps: Record<string, Competition> = {};
        querySnapshot.forEach((doc) => { comps[doc.id] = doc.data() as Competition; });
        callback(comps);
    }, (error) => {
        handleFirestoreError(error, 'listen to all comps');
        callback({});
    });
};

export const fetchCompetition = async (id: string): Promise<Competition | undefined> => {
    try {
        const docRef = doc(db, 'competitions', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) return docSnap.data() as Competition;
        return undefined;
    } catch (error) { return undefined; }
};

export const listenToCompetition = (id: string, callback: (data: Competition | undefined) => void): (() => void) => {
    return onSnapshot(doc(db, 'competitions', id), (docSnap) => {
        callback(docSnap.exists() ? docSnap.data() as Competition : undefined);
    }, (error) => {
        handleFirestoreError(error, `listen to comp ${id}`);
        callback(undefined);
    });
};

export const fetchAllTeams = async (): Promise<Team[]> => {
    const comps = await fetchAllCompetitions();
    return Object.values(comps).flatMap(c => c.teams || []);
};

export const fetchTeamByIdGlobally = async (teamId: string | number): Promise<{ team: Team, competitionId: string } | null> => {
    const comps = await fetchAllCompetitions();
    const searchId = String(teamId);
    for (const [compId, comp] of Object.entries(comps)) {
        const team = comp.teams?.find(t => String(t.id) === searchId);
        if (team) return { team, competitionId: compId };
    }
    return null;
};

export const fetchPlayerById = async (playerId: number): Promise<{ player: Player, team: Team, competitionId: string } | null> => {
    const comps = await fetchAllCompetitions();
    for (const [compId, comp] of Object.entries(comps)) {
        if (comp.teams) {
            const allMatches = [...(comp.fixtures || []), ...(comp.results || [])];
            const reconciledTeams = reconcilePlayers(comp.teams, allMatches);
            for (const team of reconciledTeams) {
                const player = team.players?.find(p => p.id === playerId);
                if (player) return { player, team, competitionId: compId };
            }
        }
    }
    return null;
};

export const updatePlayerStats = async (compId: string, teamName: string, playerName: string, statType: 'goal' | 'assist' | 'appearance' | 'yellow_card' | 'red_card' | 'clean_sheet') => {
    const docRef = doc(db, 'competitions', compId);
    try {
        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(docRef);
            if (!snap.exists()) return;
            const data = snap.data() as Competition;
            const updatedTeams = (data.teams || []).map(t => {
                if (superNormalize(t.name) === superNormalize(teamName)) {
                    const players = [...(t.players || [])];
                    let player = players.find(p => superNormalize(p.name) === superNormalize(playerName));
                    if (!player) {
                        player = { id: Date.now() + Math.floor(Math.random() * 1000), name: playerName, position: 'Midfielder', number: 0, photoUrl: '', bio: { nationality: 'Eswatini', age: 0, height: '-' }, stats: { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, cleanSheets: 0 }, transferHistory: [] };
                        players.push(player);
                    }
                    const updatedPlayers = players.map(p => {
                        if (superNormalize(p.name) === superNormalize(playerName)) {
                            const newStats = { ...p.stats };
                            if (statType === 'goal') newStats.goals = (newStats.goals || 0) + 1;
                            if (statType === 'assist') newStats.assists = (newStats.assists || 0) + 1;
                            if (statType === 'appearance') newStats.appearances = (newStats.appearances || 0) + 1;
                            if (statType === 'yellow_card') newStats.yellowCards = (newStats.yellowCards || 0) + 1;
                            if (statType === 'red_card') newStats.redCards = (newStats.redCards || 0) + 1;
                            if (statType === 'clean_sheet') newStats.cleanSheets = (newStats.cleanSheets || 0) + 1;
                            return { ...p, stats: newStats };
                        }
                        return p;
                    });
                    return { ...t, players: updatedPlayers };
                }
                return t;
            });
            transaction.update(docRef, { teams: updatedTeams });
        });
    } catch (e) { console.error("Player stats sync failed", e); }
};

export const fetchDirectoryEntries = async (): Promise<DirectoryEntity[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'directory'));
        const dbItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DirectoryEntity));
        const dbNames = new Set(dbItems.map(i => i.name.toLowerCase().trim()));
        const fallbacks = mockDirectoryData.filter(i => !dbNames.has(i.name.toLowerCase().trim()));
        return [...dbItems, ...fallbacks];
    } catch (error) { return mockDirectoryData; }
};

export const addDirectoryEntry = async (entry: Omit<DirectoryEntity, 'id'>) => { await addDoc(collection(db, 'directory'), entry); };
export const updateDirectoryEntry = async (id: string, data: Partial<DirectoryEntity>) => { await updateDoc(doc(db, 'directory', id), data); };
export const deleteDirectoryEntry = async (id: string) => { await deleteDoc(doc(db, 'directory', id)); };

export const fetchStandaloneMatches = async (teamName?: string): Promise<StandaloneMatch[]> => {
    try {
        let q = query(collection(db, 'standalone_matches'), orderBy('fullDate', 'desc'));
        const snapshot = await getDocs(q);
        const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StandaloneMatch));
        if (teamName) {
            const norm = superNormalize(teamName);
            return all.filter(m => superNormalize(m.teamA) === norm || superNormalize(m.teamB) === norm);
        }
        return all;
    } catch (e) { return []; }
};

export const addStandaloneMatch = async (match: Omit<StandaloneMatch, 'id'>) => {
    await addDoc(collection(db, 'standalone_matches'), { ...match, createdAt: serverTimestamp() });
};

export const updateStandaloneMatch = async (id: string, data: Partial<StandaloneMatch>) => {
    await updateDoc(doc(db, 'standalone_matches', id), data);
};

export const deleteStandaloneMatch = async (id: string) => {
    await deleteDoc(doc(db, 'standalone_matches', id));
};

export const fetchProducts = async (): Promise<Product[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'products'));
        const dbItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        const dbNames = new Set(dbItems.map(i => i.name.toLowerCase().trim()));
        const fallbacks = mockProducts.filter(i => !dbNames.has(i.name.toLowerCase().trim()));
        return [...dbItems, ...fallbacks];
    } catch (error) { return mockProducts; }
};

export const addProduct = async (data: Omit<Product, 'id'>) => { await addDoc(collection(db, 'products'), data); };
export const updateProduct = async (id: string, data: Partial<Product>) => { await updateDoc(doc(db, 'products', id), data); };
export const deleteProduct = async (id: string) => { await deleteDoc(doc(db, 'products', id)); };

export const validatePromoCode = async (code: string): Promise<PromoCode | null> => {
    try {
        const q = query(collection(db, 'promo_codes'), where('code', '==', code.toUpperCase()), where('isActive', '==', true));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) return snapshot.docs[0].data() as PromoCode;
        return null;
    } catch (error) { return null; }
};

export const fetchMatchTickets = async (): Promise<MatchTicket[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'match_tickets'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MatchTicket));
    } catch (error) { return []; }
};

export const addMatchTicket = async (data: Omit<MatchTicket, 'id'>) => { await addDoc(collection(db, 'match_tickets'), data); };
export const deleteMatchTicket = async (id: string) => { await deleteDoc(doc(db, 'match_tickets', id)); };

export const fetchScoutedPlayers = async (): Promise<ScoutedPlayer[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'scouting'));
        const dbItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScoutedPlayer));
        const dbNames = new Set(dbItems.map(i => i.name.toLowerCase().trim()));
        const fallbacks = mockScoutingData.filter(i => !dbNames.has(i.name.toLowerCase().trim()));
        return [...dbItems, ...fallbacks];
    } catch (error) { return mockScoutingData; }
};

export const addScoutedPlayer = async (data: Omit<ScoutedPlayer, 'id'>) => { await addDoc(collection(db, 'scouting'), data); };
export const updateScoutedPlayer = async (id: string, data: Partial<ScoutedPlayer>) => { await updateDoc(doc(db, 'scouting', id), data); };
export const deleteScoutedPlayer = async (id: string) => { await deleteDoc(doc(db, 'scouting', id)); };

export const fetchVideos = async (): Promise<Video[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'videos'));
        const dbItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video));
        const all = [...dbItems, ...mockVideoData.filter(v => !dbItems.find(dv => dv.id === v.id))];
        return sortByLatest(all);
    } catch (error) { return mockVideoData; }
};

export const addVideo = async (data: Omit<Video, 'id'>) => { 
    await addDoc(collection(db, 'videos'), { ...data, timestamp: serverTimestamp() }); 
};

export const updateVideo = async (id: string, data: Partial<Video>) => { await updateDoc(doc(db, 'videos', id), data); };
export const deleteVideo = async (id: string) => { await deleteDoc(doc(db, 'videos', id)); };

export const fetchExclusiveContent = async (): Promise<ExclusiveItem[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'exclusiveContent'));
        const dbItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExclusiveItem));
        const all = [...dbItems, ...initialExclusiveContent.filter(i => !dbItems.find(di => di.id === i.id))];
        return sortByLatest(all);
    } catch { return initialExclusiveContent; }
};

export const addExclusiveContent = async (data: Omit<ExclusiveItem, 'id'>) => { await addDoc(collection(db, 'exclusiveContent'), data); };
export const updateExclusiveContent = async (id: string, data: Partial<ExclusiveItem>) => { await updateDoc(doc(db, 'exclusiveContent', id), data); };
export const deleteExclusiveContent = async (id: string) => { await deleteDoc(doc(db, 'exclusiveContent', id)); };

export const fetchTeamYamVideos = async (): Promise<TeamYamVideo[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'teamYamVideos'));
        const dbItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamYamVideo));
        const all = [...dbItems, ...initialTeamYamVideos.filter(i => !dbItems.find(di => di.id === i.id))];
        return sortByLatest(all);
    } catch { return initialTeamYamVideos; }
};

export const addTeamYamVideo = async (data: Omit<TeamYamVideo, 'id'>) => { await addDoc(collection(db, 'teamYamVideos'), data); };
export const updateTeamYamVideo = async (id: string, data: Partial<TeamYamVideo>) => { await updateDoc(doc(db, 'teamYamVideos', id), data); };
export const deleteTeamYamVideo = async (id: string) => { await deleteDoc(doc(db, 'teamYamVideos', id)); };

export const fetchCoachingContent = async (): Promise<CoachingContent[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'coaching'));
        const dbItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoachingContent));
        return [...dbItems, ...mockCoachingContent.filter(i => !dbItems.find(di => i.id === i.id))];
    } catch { return mockCoachingContent; }
};

export const addCoachingContent = async (data: Omit<CoachingContent, 'id'>) => { await addDoc(collection(db, 'coaching'), data); };
export const updateCoachingContent = async (id: string, data: Partial<CoachingContent>) => { await updateDoc(doc(db, 'coaching', id), data); };
export const deleteCoachingContent = async (id: string) => { await deleteDoc(doc(db, 'coaching', id)); };

export const fetchArchiveData = async (): Promise<ArchiveItem[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'archive'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArchiveItem));
    } catch { return mockArchiveData; }
};

export const addArchiveItem = async (data: Omit<ArchiveItem, 'id'>) => { await addDoc(collection(db, 'archive'), data); };
export const updateArchiveItem = async (id: string, data: Partial<ArchiveItem>) => { await updateDoc(doc(db, 'archive', id), data); };
export const deleteArchiveItem = async (id: string) => { await deleteDoc(doc(db, 'archive', id)); };

export const fetchOnThisDayData = async (): Promise<OnThisDayEvent[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'onThisDay'));
        return snapshot.docs.map(doc => ({ id: parseInt(doc.id) || 0, ...doc.data() } as OnThisDayEvent));
    } catch { return mockOnThisDayData; }
};

export const fetchPhotoGalleries = async (): Promise<PhotoAlbum[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'photoGalleries'));
        return snapshot.docs.map(doc => ({ id: parseInt(doc.id) || Date.now(), ...doc.data() } as PhotoAlbum));
    } catch { return []; }
};

export const fetchBehindTheScenesData = async (): Promise<BehindTheScenesContent[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'behind_the_scenes'));
        return snapshot.docs.map(doc => ({ id: parseInt(doc.id) || Date.now(), ...doc.data() } as BehindTheScenesContent));
    } catch { return []; }
};

export const addBehindTheScenesContent = async (data: Omit<BehindTheScenesContent, 'id'>) => { await addDoc(collection(db, 'behind_the_scenes'), data); };
export const updateBehindTheScenesContent = async (id: string, data: Partial<BehindTheScenesContent>) => { await updateDoc(doc(db, 'behind_the_scenes', id), data); };
export const deleteBehindTheScenesContent = async (id: string) => { await deleteDoc(doc(db, 'behind_the_scenes', id)); };

export const fetchYouthData = async (): Promise<YouthLeague[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'youth'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as YouthLeague));
    } catch { return mockYouthData; }
};

export const fetchCups = async (): Promise<Tournament[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'cups'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
    } catch { return []; }
};

export const addCup = async (data: Omit<Tournament, 'id'>) => { await addDoc(collection(db, 'cups'), data); };
export const updateCup = async (id: string, data: Partial<Tournament>) => { await updateDoc(doc(db, 'cups', id), data); };
export const deleteCup = async (id: string) => { await deleteDoc(doc(db, 'cups', id)); };

export const fetchHybridTournaments = async (): Promise<HybridTournament[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'hybrid_tournaments'));
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as HybridTournament));
    } catch (error) { return internationalData; }
};

export const addHybridTournament = async (data: Omit<HybridTournament, 'id'>) => { await addDoc(collection(db, 'hybrid_tournaments'), data); };
export const updateHybridTournament = async (id: string, data: Partial<HybridTournament>) => { await updateDoc(doc(db, 'hybrid_tournaments', id), data); };
export const deleteHybridTournament = async (id: string) => { await deleteDoc(doc(db, 'hybrid_tournaments', id)); };

export const fetchRefereesData = async (): Promise<{ referees: Referee[], ruleOfTheWeek: Rule }> => {
    try {
        const docRef = doc(db, 'referees', 'main');
        const snap = await getDoc(docRef);
        if (snap.exists()) return snap.data() as { referees: Referee[], ruleOfTheWeek: Rule };
        return defaultRefereeData;
    } catch { return defaultRefereeData; }
};

export const updateRefereesData = async (data: { referees: Referee[], ruleOfTheWeek: Rule }) => {
    await setDoc(doc(db, 'referees', 'main'), data, { merge: true });
};

export const fetchAd = async (placement: string): Promise<Ad | null> => {
    try {
        const docRef = doc(db, 'ads', 'main');
        const snap = await getDoc(docRef);
        if (snap.exists()) return (snap.data() as any)[placement] || null;
        return null;
    } catch { return null; }
};

export const fetchAllAds = async (): Promise<Record<string, Ad>> => {
    try {
        const docRef = doc(db, 'ads', 'main');
        const snap = await getDoc(docRef);
        if (snap.exists()) return snap.data() as Record<string, Ad>;
        return {};
    } catch { return {}; }
};

export const updateAd = async (placementId: string, data: Ad) => {
    await updateDoc(doc(db, 'ads', 'main'), { [placementId]: data });
};

export const fetchSponsors = async (): Promise<{ spotlight: Sponsor, kitPartner: KitPartner }> => {
    try {
        const docRef = doc(db, 'sponsors', 'main');
        const snap = await getDoc(docRef);
        if (snap.exists()) return snap.data() as { spotlight: Sponsor, kitPartner: KitPartner };
        return defaultSponsors;
    } catch { return defaultSponsors; }
};

export const submitSponsorRequest = async (data: any) => { await addDoc(collection(db, 'sponsorRequests'), { ...data, status: 'pending', submittedAt: serverTimestamp() }); };
export const submitAdvertiserRequest = async (data: any) => { await addDoc(collection(db, 'advertiserRequests'), { ...data, status: 'pending', submittedAt: serverTimestamp() }); };
export const submitClubRequest = async (data: any) => { await addDoc(collection(db, 'clubRequests'), { ...data, status: 'pending', submittedAt: serverTimestamp() }); };

export const fetchSponsorRequests = async (): Promise<SponsorRequest[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'sponsorRequests'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SponsorRequest));
    } catch { return []; }
};

export const fetchAdvertiserRequests = async (): Promise<AdvertiserRequest[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'advertiserRequests'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdvertiserRequest));
    } catch { return []; }
};

export const fetchPendingChanges = async (): Promise<PendingChange[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'pending_changes'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PendingChange));
    } catch { return []; }
};

export const deletePendingChange = async (id: string) => { await deleteDoc(doc(db, 'pending_changes', id)); };
export const fetchClubRequests = async (): Promise<ClubRegistrationRequest[]> => {
    const q = query(collection(db, 'clubRequests'), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClubRegistrationRequest));
};

export const rejectClubRequest = async (id: string) => {
    await updateDoc(doc(db, 'clubRequests', id), { status: 'rejected' });
};

export const fetchLeagueRequests = async (): Promise<LeagueRegistrationRequest[]> => {
    const q = query(collection(db, 'leagueRequests'), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeagueRegistrationRequest));
};

export const approveLeagueRequest = async (request: LeagueRegistrationRequest) => {
    const batch = writeBatch(db);
    
    // 1. Create the competition doc if it's a 'create' request
    if (request.requestType === 'create') {
        const slug = request.leagueName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const compRef = doc(db, 'competitions', slug);
        batch.set(compRef, {
            name: request.leagueName,
            region: request.region, // Explicitly capture the region for hub mapping
            categoryId: request.categoryId || 'regional-leagues',
            teams: [], fixtures: [], results: []
        }, { merge: true });
    }

    // 2. Update manager permissions
    if (request.managerId && request.managerId !== 'new_user') {
        const userRef = doc(db, 'users', request.managerId);
        batch.update(userRef, { role: 'league_admin' });
    }

    // 3. Mark request as approved
    const reqRef = doc(db, 'leagueRequests', request.id);
    batch.update(reqRef, { status: 'approved' });
    
    await batch.commit();

    await addNotification({ userId: request.managerId, title: 'League Registration Approved', message: `Your request for ${request.leagueName} has been approved. You are now a League Admin.`, type: 'success' });
};

export const rejectLeagueRequest = async (id: string) => {
    await updateDoc(doc(db, 'leagueRequests', id), { status: 'rejected' });
};

export const addNotification = async (data: Omit<InAppNotification, 'id' | 'read' | 'timestamp'>) => {
    await addDoc(collection(db, 'in_app_notifications'), { ...data, read: false, timestamp: serverTimestamp() });
};

export const listenToNotifications = (userId: string, callback: (notifications: InAppNotification[]) => void): (() => void) => {
    const q = query(collection(db, "in_app_notifications"), where("userId", "==", userId), limit(100));
    return onSnapshot(q, (querySnapshot) => {
        const notifications: InAppNotification[] = [];
        querySnapshot.forEach((doc) => { notifications.push({ id: doc.id, ...doc.data() } as InAppNotification); });
        notifications.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
        callback(notifications.reverse().slice(0, 20));
    }, (error) => {
        handleFirestoreError(error, 'listen to notifications');
        callback([]);
    });
};

export const markNotificationRead = async (id: string) => { await updateDoc(doc(db, 'in_app_notifications', id), { read: true }); };

export const approveClubRequest = async (request: ClubRegistrationRequest) => {
    const batch = writeBatch(db);

    if (request.userId && request.userId !== 'pending-auth') {
        const userRef = doc(db, 'users', request.userId);
        batch.update(userRef, { 
            role: 'club_admin', 
            club: request.clubName,
            managedTeams: arrayUnion(...(request.managedTeams || []))
        });
    }

    const reqRef = doc(db, 'clubRequests', request.id);
    batch.update(reqRef, { status: 'approved' });

    await batch.commit();

    await addNotification({ userId: request.userId, title: 'Club Management Approved', message: `Welcome! Your request for ${request.clubName} has been approved. You now have full access to the Club Portal.`, type: 'success' });
};

export const fetchCategories = async (): Promise<Category[]> => {
    const snapshot = await getDocs(collection(db, 'categories'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)).sort((a,b) => a.order - b.order);
};

export const updateCategory = async (id: string, data: Partial<Category>) => { await updateDoc(doc(db, 'categories', id), data); };
export const deleteCategory = async (id: string) => { await deleteDoc(doc(db, 'categories', id)); };

export const fetchAllUsers = async (): Promise<User[]> => {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
};

export const updateUserRole = async (userId: string, role: User['role']) => { await updateDoc(doc(db, 'users', userId), { role }); };

export const fetchRegionConfigs = async (): Promise<RegionConfig[]> => {
    const snapshot = await getDocs(collection(db, 'region_configs'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RegionConfig));
};

export const updateRegionConfig = async (id: string, data: Partial<RegionConfig>) => { await setDoc(doc(db, 'region_configs', id), data, { merge: true }); };

export const resetAllCompetitionData = async () => {
    const comps = await getDocs(collection(db, 'competitions'));
    const batch = writeBatch(db);
    comps.forEach(c => {
        batch.update(c.ref, { teams: [], fixtures: [], results: [] });
    });
    await batch.commit();
};

export const fetchFootballDataOrg = async (apiId: string, key: string, season: string, type: 'fixtures' | 'results', proxy: boolean, officialNames: string[]): Promise<CompetitionFixture[]> => {
    const statusParam = type === 'results' ? 'FINISHED' : 'SCHEDULED';
    const endpoint = `https://api.football-data.org/v4/competitions/${apiId}/matches?status=${statusParam}&season=${season}`;
    
    // Switched to corsproxy.io which is more reliable for Vercel production deployments
    const url = proxy ? `https://corsproxy.io/?url=${encodeURIComponent(endpoint)}` : endpoint;
    
    const response = await fetchWithRetry(url, { 
        method: 'GET', 
        headers: { 
            'X-Auth-Token': key,
            'Accept': 'application/json' 
        } 
    });
    
    if (!response.ok) throw new Error(`Football-Data Error (${response.status})`);
    const data = await response.json();
    return (data.matches || []).map((m: any) => {
        const dateObj = new Date(m.utcDate);
        return {
            id: m.id,
            teamA: normalizeTeamName(m.homeTeam.name, officialNames) || m.homeTeam.name,
            teamB: normalizeTeamName(m.awayTeam.name, officialNames) || m.awayTeam.name,
            scoreA: m.score?.fullTime?.home ?? undefined,
            scoreB: m.score?.fullTime?.away ?? undefined,
            fullDate: dateObj.toISOString().split('T')[0],
            date: dateObj.getDate().toString(),
            day: dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
            time: dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            status: m.status === 'FINISHED' ? 'finished' : 'scheduled',
            matchday: m.matchday,
            venue: m.venue
        };
    });
};

export const fetchApiFootball = async (apiId: string, key: string, season: string, type: 'fixtures' | 'results', proxy: boolean, officialNames: string[], isRapidApi: boolean = false): Promise<CompetitionFixture[]> => {
    const host = isRapidApi ? 'api-football-v1.p.rapidapi.com' : 'v3.football.api-sports.io';
    const statusParam = type === 'results' ? 'FT' : 'NS';
    const endpoint = `https://${ host }/v3/fixtures?league=${apiId}&season=${season}&status=${statusParam}`;
    
    // Switched to corsproxy.io which is more reliable for Vercel production deployments
    const url = proxy ? `https://corsproxy.io/?url=${encodeURIComponent(endpoint)}` : endpoint;
    
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (isRapidApi) { headers['x-rapidapi-key'] = key; headers['x-rapidapi-host'] = host; } else { headers['x-apisports-key'] = key; }
    const response = await fetchWithRetry(url, { method: 'GET', headers });
    if (!response.ok) throw new Error(`API-Football Error (${response.status})`);
    const data = await response.json();
    return (data.response || []).map((item: any) => {
        const f = item.fixture;
        const teams = item.teams;
        const goals = item.goals;
        const dateObj = new Date(f.date);
        return {
            id: f.id,
            teamA: normalizeTeamName(teams.home.name, officialNames) || teams.home.name,
            teamB: normalizeTeamName(teams.away.name, officialNames) || teams.away.name,
            scoreA: goals.home ?? undefined,
            scoreB: goals.away ?? undefined,
            fullDate: dateObj.toISOString().split('T')[0],
            date: dateObj.getDate().toString(),
            day: dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
            time: dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            status: f.status.short === 'FT' ? 'finished' : 'scheduled',
            matchday: item.league.round.match(/\d+/) ? parseInt(item.league.round.match(/\d+/)[0]) : undefined,
            venue: f.venue.name
        };
    });
};

export const fetchCommunityEvents = async (): Promise<CommunityEvent[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'community_events'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityEvent));
    } catch { return []; }
};

export const fetchAllCommunityEvents = async (): Promise<CommunityEvent[]> => {
    const snapshot = await getDocs(collection(db, 'community_events'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityEvent));
};

export const submitCommunityEvent = async (data: any) => {
    await addDoc(collection(db, 'community_events'), { ...data, status: 'pending', likes: 0, likedBy: [], createdAt: serverTimestamp() });
};

export const updateCommunityEvent = async (id: string, data: any) => {
    await updateDoc(doc(db, 'community_events', id), data);
};

export const updateCommunityEventStatus = async (id: string, status: CommunityEvent['status']) => {
    await updateDoc(doc(db, 'community_events', id), { status });
};

export const deleteCommunityEvent = async (id: string) => {
    await deleteDoc(doc(db, 'community_events', id));
};

export const submitCommunityResult = async (id: string, summary: string) => {
    await updateDoc(doc(db, 'community_events', id), { resultsSummary: summary });
};

export const toggleCommunityEventLike = async (eventId: string, userId: string, isLiked: boolean) => {
    const docRef = doc(db, 'community_events', eventId);
    await updateDoc(docRef, { likes: increment(isLiked ? -1 : 1), likedBy: isLiked ? arrayRemove(userId) : arrayUnion(userId) });
};

export const addCommunityEventComment = async (eventId: string, text: string, user: User) => {
    await addDoc(collection(db, 'community_event_comments'), { eventId, text, userId: user.id, userName: user.name, userAvatar: user.avatar, timestamp: serverTimestamp() });
};

export const listenToCommunityEventComments = (eventId: string, callback: (comments: CommunityEventComment[]) => void): (() => void) => {
    const q = query(collection(db, "community_event_comments"), where("eventId", "==", eventId));
    return onSnapshot(q, (querySnapshot) => {
        const comments: CommunityEventComment[] = [];
        querySnapshot.forEach((doc) => { comments.push({ id: doc.id, ...doc.data() } as CommunityEventComment); });
        comments.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
        callback(comments);
    });
};

export const addYouthArticleComment = async (articleId: string, text: string, user: User) => {
    await addDoc(collection(db, 'youth_article_comments'), { articleId, text, userId: user.id, userName: user.name, userAvatar: user.avatar, timestamp: serverTimestamp() });
};

export const listenToYouthArticleComments = (articleId: string, callback: (comments: YouthArticleComment[]) => void): (() => void) => {
    const q = query(collection(db, "youth_article_comments"), where("articleId", "==", articleId));
    return onSnapshot(q, (querySnapshot) => {
        const comments: YouthArticleComment[] = [];
        querySnapshot.forEach((doc) => { comments.push({ id: doc.id, ...doc.data() } as YouthArticleComment); });
        comments.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
        callback(comments);
    });
};

export const submitContactInquiry = async (data: Omit<ContactInquiry, 'id' | 'submittedAt'>) => {
    await addDoc(collection(db, 'contact_inquiries'), { ...data, submittedAt: serverTimestamp() });
};

export const fetchContactInquiries = async (): Promise<ContactInquiry[]> => {
    const q = query(collection(db, 'contact_inquiries'), orderBy('submittedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactInquiry));
};