import { Team, Player, CompetitionFixture, Competition } from '../data/teams';
import { NewsItem, newsData } from '../data/news';
import { db } from './firebase';
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
import { calculateStandings, normalizeTeamName } from './utils';
import { User } from '../contexts/AuthContext';
import { ExclusiveItem, TeamYamVideo, initialExclusiveContent, initialTeamYamVideos } from '../data/features';
import { HybridTournament, internationalData } from '../data/international';

// NOTE: All data fetching functions now use Firebase Firestore with failover to local mock data.

export { type Competition }; // Re-export to maintain compatibility
export { type ExclusiveItem, type TeamYamVideo }; // Re-export feature types

export const handleFirestoreError = (error: any, operation: string) => {
    const firebaseError = error as { code?: string, message?: string };
    
    // Gracefully handle offline/unavailable errors
    if (firebaseError.code === 'unavailable' || firebaseError.message?.includes('offline') || firebaseError.message?.includes('Backend')) {
        console.warn(`[Offline/Error] Operation '${operation}' failed. Using fallback/cached data.`);
        return;
    }

    console.error(`Firestore error during '${operation}':`, error);
    
    if (firebaseError.code === 'permission-denied' || firebaseError.code === 'failed-precondition') {
        console.warn(`Permission Denied for '${operation}'. Check security rules.`);
    }
};


// Ad interface and related API functions for advertisement management.
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
  date: string; // YYYY-MM-DD
  time: string;
  venue: string;
  price: number;
  status: 'available' | 'sold_out';
}

export interface PendingChange {
  id: string; // Firestore doc ID
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
    promoCode?: string; // New field for discounts
}

export interface AdvertiserRequest {
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    industry: string;
    interestedPlacements: string[];
    budgetRange: string;
    status: 'pending' | 'contacted' | 'closed';
    submittedAt: any;
    promoCode?: string; // New field for discounts
}

export interface SponsorRequest {
    brandName: string;
    contactName: string;
    email: string;
    phone: string;
    sponsorshipTier: string; // Bronze, Silver, etc.
    goals: string;
    status: 'pending' | 'contacted' | 'closed';
    submittedAt: any;
    promoCode?: string; // New field for discounts
}

export interface Category {
    id: string;
    name: string;
    order: number;
}

export interface NationalTeam {
    id: string;
    name: string;
    crestUrl: string;
    players: Player[];
    fixtures: CompetitionFixture[];
    logs: Team[];
    competitionsParticipatedIn: string[];
}

export interface FixtureComment {
    id: string;
    fixtureId: number;
    userId: string;
    userName: string;
    userAvatar: string;
    text: string;
    timestamp: { seconds: number, nanoseconds: number }; // Firestore Timestamp
}

export interface YouthArticleComment {
    id: string;
    articleId: string;
    userId: string;
    userName: string;
    userAvatar: string;
    text: string;
    timestamp: { seconds: number, nanoseconds: number };
}

export interface NewsComment {
    id: string;
    articleId: string;
    userId: string;
    userName: string;
    userAvatar: string;
    text: string;
    timestamp: { seconds: number, nanoseconds: number };
}

export interface CommunityEventComment {
    id: string;
    eventId: string;
    userId: string;
    userName: string;
    userAvatar: string;
    text: string;
    timestamp: { seconds: number, nanoseconds: number };
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

// Interface for Community Football Hub
export interface CommunityEvent {
    id: string;
    userId?: string; // ID of the user who submitted
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
    posterUrl?: string; // Base64 or URL
    status: 'pending' | 'approved';
    isSpotlight?: boolean;
    resultsSummary?: string; // For past events
    fees?: string;
    prizes?: string;
    createdAt?: any;
    likes?: number;
    likedBy?: string[]; // Array of user IDs
}

export interface PromoCode {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    isActive: boolean;
}

// --- Fallback Helpers ---
// Generate minimal Competition object if offline
const generateMockCompetition = (id: string, name: string): Competition => ({
    name: name,
    displayName: name,
    fixtures: [],
    results: [],
    teams: [],
    categoryId: 'mock',
    logoUrl: `https://via.placeholder.com/150?text=${name.charAt(0)}`
});


export const addLiveUpdate = async (data: Omit<LiveUpdate, 'id' | 'timestamp'>) => {
    try {
        await addDoc(collection(db, 'live_updates'), {
            ...data,
            timestamp: serverTimestamp(),
            verified: true, // Defaulting as per model
            confidence: 0.95, // Defaulting as per model
        });
    } catch (error) {
        handleFirestoreError(error, 'add live update');
        throw error;
    }
};

export const listenToLiveUpdates = (callback: (updates: LiveUpdate[]) => void): (() => void) => {
    const q = query(
        collection(db, "live_updates"),
        orderBy("timestamp", "desc"),
        limit(50)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const updates: LiveUpdate[] = [];
        querySnapshot.forEach((doc) => {
            updates.push({ id: doc.id, ...doc.data() } as LiveUpdate);
        });
        callback(updates);
    }, (error) => {
        handleFirestoreError(error, `listen to live updates`);
        callback([]);
    });

    return unsubscribe;
};

export const addFixtureComment = async (fixtureId: number, text: string, user: User) => {
    try {
        const commentData = {
            fixtureId,
            text,
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            timestamp: serverTimestamp(),
        };
        await addDoc(collection(db, 'fixture_comments'), commentData);
    } catch (error) {
        handleFirestoreError(error, 'add comment');
        throw error;
    }
};

export const listenToFixtureComments = (fixtureId: number, callback: (comments: FixtureComment[]) => void): (() => void) => {
    const q = query(
        collection(db, "fixture_comments"),
        where("fixtureId", "==", fixtureId)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const comments: FixtureComment[] = [];
        querySnapshot.forEach((doc) => {
            comments.push({ id: doc.id, ...doc.data() } as FixtureComment);
        });
        comments.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
        callback(comments);
    }, (error) => {
        handleFirestoreError(error, `listen to comments for fixture ${fixtureId}`);
        callback([]);
    });

    return unsubscribe;
};

export const addYouthArticleComment = async (articleId: string, text: string, user: User) => {
    try {
        const commentData = {
            articleId,
            text,
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            timestamp: serverTimestamp(),
        };
        await addDoc(collection(db, 'youth_article_comments'), commentData);
    } catch (error) {
        handleFirestoreError(error, 'add youth article comment');
        throw error;
    }
};

export const listenToYouthArticleComments = (articleId: string, callback: (comments: YouthArticleComment[]) => void): (() => void) => {
    const q = query(
        collection(db, "youth_article_comments"),
        where("articleId", "==", articleId)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const comments: YouthArticleComment[] = [];
        querySnapshot.forEach((doc) => {
            comments.push({ id: doc.id, ...doc.data() } as YouthArticleComment);
        });
        comments.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
        callback(comments);
    }, (error) => {
        handleFirestoreError(error, `listen to comments for article ${articleId}`);
        callback([]);
    });

    return unsubscribe;
};

export const addNewsComment = async (articleId: string, text: string, user: User) => {
    try {
        const commentData = {
            articleId,
            text,
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            timestamp: serverTimestamp(),
        };
        await addDoc(collection(db, 'news_comments'), commentData);
    } catch (error) {
        handleFirestoreError(error, 'add news comment');
        throw error;
    }
};

export const listenToNewsComments = (articleId: string, callback: (comments: NewsComment[]) => void): (() => void) => {
    const q = query(
        collection(db, "news_comments"),
        where("articleId", "==", articleId)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const comments: NewsComment[] = [];
        querySnapshot.forEach((doc) => {
            comments.push({ id: doc.id, ...doc.data() } as NewsComment);
        });
        comments.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
        callback(comments);
    }, (error) => {
        handleFirestoreError(error, `listen to comments for news article ${articleId}`);
        callback([]);
    });

    return unsubscribe;
};

export const addCommunityEventComment = async (eventId: string, text: string, user: User) => {
    try {
        const commentData = {
            eventId,
            text,
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            timestamp: serverTimestamp(),
        };
        await addDoc(collection(db, 'community_event_comments'), commentData);
    } catch (error) {
        handleFirestoreError(error, 'add community event comment');
        throw error;
    }
};

export const listenToCommunityEventComments = (eventId: string, callback: (comments: CommunityEventComment[]) => void): (() => void) => {
    const q = query(
        collection(db, "community_event_comments"),
        where("eventId", "==", eventId)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const comments: CommunityEventComment[] = [];
        querySnapshot.forEach((doc) => {
            comments.push({ id: doc.id, ...doc.data() } as CommunityEventComment);
        });
        comments.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
        callback(comments);
    }, (error) => {
        handleFirestoreError(error, `listen to comments for community event ${eventId}`);
        callback([]);
    });

    return unsubscribe;
};

export const toggleCommunityEventLike = async (eventId: string, userId: string, isLiked: boolean) => {
    try {
        const eventRef = doc(db, 'community_events', eventId);
        if (isLiked) {
            // Unlike
            await updateDoc(eventRef, {
                likes: increment(-1),
                likedBy: arrayRemove(userId)
            });
        } else {
            // Like
            await updateDoc(eventRef, {
                likes: increment(1),
                likedBy: arrayUnion(userId)
            });
        }
    } catch (error) {
        handleFirestoreError(error, 'toggle community event like');
        throw error;
    }
};


export const fetchNationalTeams = async (): Promise<NationalTeam[]> => {
    const items: NationalTeam[] = [];
    try {
        const querySnapshot = await getDocs(collection(db, "national_teams"));
        querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() } as NationalTeam);
        });
    } catch (error) {
        handleFirestoreError(error, 'fetch national teams');
    }
    return items;
};

export const listenToCompetition = (competitionId: string, callback: (data: Competition | undefined) => void): (() => void) => {
    const docRef = doc(db, "competitions", competitionId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const competitionData: Competition = {
                name: data.name,
                displayName: data.displayName,
                description: data.description,
                logoUrl: data.logoUrl,
                fixtures: data.fixtures || [],
                results: data.results || [],
                teams: data.teams || [],
                categoryId: data.categoryId,
                externalApiId: data.externalApiId,
            };
            callback(competitionData);
        } else {
            console.warn(`No such competition document in Firestore: ${competitionId}`);
            // Fallback for demo
            callback(generateMockCompetition(competitionId, 'Offline Competition'));
        }
    }, (error) => {
        handleFirestoreError(error, `listen to competition ${competitionId}`);
        callback(generateMockCompetition(competitionId, 'Offline Competition'));
    });

    return unsubscribe; 
};

// --- News API ---

export const fetchNews = async (): Promise<NewsItem[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'news'));
        const dbItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsItem));
        
        // Merge with local news if they don't already exist (based on URL as unique slug)
        const dbUrls = new Set(dbItems.map(i => i.url));
        const fallbacks = newsData.filter(i => !dbUrls.has(i.url));
        
        const allItems = [...dbItems, ...fallbacks];
        
        return allItems.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            const valA = isNaN(dateA) ? 0 : dateA;
            const valB = isNaN(dateB) ? 0 : dateB;
            return valB - valA; 
        });
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
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() } as NewsItem;
        }
        return newsData.find(n => n.url === url) || null;
    } catch (error) {
        handleFirestoreError(error, 'fetch news article');
        return newsData.find(n => n.url === url) || null;
    }
};

export const fetchAllCompetitions = async (): Promise<Record<string, Competition>> => {
    const comps: Record<string, Competition> = {};
    try {
        const snapshot = await getDocs(collection(db, 'competitions'));
        snapshot.forEach(doc => {
            comps[doc.id] = doc.data() as Competition;
        });
    } catch (error) {
        handleFirestoreError(error, 'fetch all competitions');
    }
    return comps;
};

export const fetchCompetition = async (id: string): Promise<Competition | undefined> => {
    try {
        const docRef = doc(db, 'competitions', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) return docSnap.data() as Competition;
        return undefined;
    } catch (error) {
        handleFirestoreError(error, 'fetch competition');
        return undefined;
    }
};

export const fetchAllTeams = async (): Promise<Team[]> => {
    try {
        const comps = await fetchAllCompetitions();
        return Object.values(comps).flatMap(c => c.teams || []);
    } catch (error) {
        handleFirestoreError(error, 'fetch all teams');
        return [];
    }
};

export const fetchTeamByIdGlobally = async (teamId: number): Promise<{ team: Team, competitionId: string } | null> => {
    try {
        const comps = await fetchAllCompetitions();
        for (const [compId, comp] of Object.entries(comps)) {
            const team = comp.teams?.find(t => t.id === teamId);
            if (team) return { team, competitionId: compId };
        }
        return null;
    } catch (error) {
        handleFirestoreError(error, 'fetch team by id');
        return null;
    }
};

export const fetchPlayerById = async (playerId: number): Promise<{ player: Player, team: Team, competitionId: string } | null> => {
     try {
        const comps = await fetchAllCompetitions();
        for (const [compId, comp] of Object.entries(comps)) {
            for (const team of comp.teams || []) {
                const player = team.players?.find(p => p.id === playerId);
                if (player) return { player, team, competitionId: compId };
            }
        }
        return null;
    } catch (error) {
        handleFirestoreError(error, 'fetch player by id');
        return null;
    }
};

// Directory
export const fetchDirectoryEntries = async (): Promise<DirectoryEntity[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'directory'));
        const dbItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DirectoryEntity));
        
        // Merge with local directory data if they don't already exist (based on Name as unique key)
        const dbNames = new Set(dbItems.map(i => i.name.toLowerCase().trim()));
        const fallbacks = mockDirectoryData.filter(i => !dbNames.has(i.name.toLowerCase().trim()));
        
        return [...dbItems, ...fallbacks];
    } catch (error) {
        handleFirestoreError(error, 'fetch directory');
        return mockDirectoryData;
    }
};
export const addDirectoryEntry = async (entry: Omit<DirectoryEntity, 'id'>) => {
    await addDoc(collection(db, 'directory'), entry);
};
export const updateDirectoryEntry = async (id: string, data: Partial<DirectoryEntity>) => {
    await updateDoc(doc(db, 'directory', id), data);
};
export const deleteDirectoryEntry = async (id: string) => {
    await deleteDoc(doc(db, 'directory', id));
};

// Shop
export const fetchProducts = async (): Promise<Product[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'products'));
        const dbItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        
        const dbNames = new Set(dbItems.map(i => i.name.toLowerCase().trim()));
        const fallbacks = mockProducts.filter(i => !dbNames.has(i.name.toLowerCase().trim()));
        
        return [...dbItems, ...fallbacks];
    } catch (error) {
        handleFirestoreError(error, 'fetch products');
        return mockProducts;
    }
};
export const addProduct = async (data: Omit<Product, 'id'>) => {
    await addDoc(collection(db, 'products'), data);
};
export const updateProduct = async (id: string, data: Partial<Product>) => {
    await updateDoc(doc(db, 'products', id), data);
};
export const deleteProduct = async (id: string) => {
    await deleteDoc(doc(db, 'products', id));
};
export const validatePromoCode = async (code: string): Promise<PromoCode | null> => {
     try {
        const q = query(collection(db, 'promo_codes'), where('code', '==', code), where('isActive', '==', true));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) return snapshot.docs[0].data() as PromoCode;
        return null;
    } catch (error) {
        handleFirestoreError(error, 'validate promo code');
        return null;
    }
};

// Match Tickets
export const fetchMatchTickets = async (): Promise<MatchTicket[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'match_tickets'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MatchTicket));
    } catch (error) {
        handleFirestoreError(error, 'fetch match tickets');
        return [];
    }
};
export const addMatchTicket = async (data: Omit<MatchTicket, 'id'>) => {
    await addDoc(collection(db, 'match_tickets'), data);
};
export const deleteMatchTicket = async (id: string) => {
    await deleteDoc(doc(db, 'match_tickets', id));
};

// Scouting
export const fetchScoutedPlayers = async (): Promise<ScoutedPlayer[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'scouting'));
        const dbItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScoutedPlayer));
        
        const dbNames = new Set(dbItems.map(i => i.name.toLowerCase().trim()));
        const fallbacks = mockScoutingData.filter(i => !dbNames.has(i.name.toLowerCase().trim()));
        
        return [...dbItems, ...fallbacks];
    } catch (error) {
        handleFirestoreError(error, 'fetch scouting');
        return mockScoutingData;
    }
};
export const addScoutedPlayer = async (data: Omit<ScoutedPlayer, 'id'>) => {
    await addDoc(collection(db, 'scouting'), data);
};
export const updateScoutedPlayer = async (id: string, data: Partial<ScoutedPlayer>) => {
    await updateDoc(doc(db, 'scouting', id), data);
};
export const deleteScoutedPlayer = async (id: string) => {
    await deleteDoc(doc(db, 'scouting', id));
};

// Videos
export const fetchVideos = async (): Promise<Video[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'videos'));
        const dbItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video));
        
        const dbIds = new Set(dbItems.map(i => i.id));
        const fallbacks = mockVideoData.filter(i => !dbIds.has(i.id));
        
        return [...dbItems, ...fallbacks];
    } catch (error) {
        handleFirestoreError(error, 'fetch videos');
        return mockVideoData;
    }
};
export const addVideo = async (data: Omit<Video, 'id'>) => {
    await addDoc(collection(db, 'videos'), data);
};
export const updateVideo = async (id: string, data: Partial<Video>) => {
    await updateDoc(doc(db, 'videos', id), data);
};
export const deleteVideo = async (id: string) => {
    await deleteDoc(doc(db, 'videos', id));
};

// Features
export const fetchExclusiveContent = async (): Promise<ExclusiveItem[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'exclusiveContent'));
        const dbItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExclusiveItem));
        
        const dbIds = new Set(dbItems.map(i => i.id));
        const fallbacks = initialExclusiveContent.filter(i => !dbIds.has(i.id));
        
        return [...dbItems, ...fallbacks];
    } catch { return initialExclusiveContent; }
};
export const addExclusiveContent = async (data: Omit<ExclusiveItem, 'id'>) => { await addDoc(collection(db, 'exclusiveContent'), data); };
export const updateExclusiveContent = async (id: string, data: Partial<ExclusiveItem>) => { await updateDoc(doc(db, 'exclusiveContent', id), data); };
export const deleteExclusiveContent = async (id: string) => { await deleteDoc(doc(db, 'exclusiveContent', id)); };

export const fetchTeamYamVideos = async (): Promise<TeamYamVideo[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'teamYamVideos'));
        const dbItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamYamVideo));
        
        const dbIds = new Set(dbItems.map(i => i.id));
        const fallbacks = initialTeamYamVideos.filter(i => !dbIds.has(i.id));
        
        return [...dbItems, ...fallbacks];
    } catch { return initialTeamYamVideos; }
};
export const addTeamYamVideo = async (data: Omit<TeamYamVideo, 'id'>) => { await addDoc(collection(db, 'teamYamVideos'), data); };
export const updateTeamYamVideo = async (id: string, data: Partial<TeamYamVideo>) => { await updateDoc(doc(db, 'teamYamVideos', id), data); };
export const deleteTeamYamVideo = async (id: string) => { await deleteDoc(doc(db, 'teamYamVideos', id)); };

export const fetchCoachingContent = async (): Promise<CoachingContent[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'coaching'));
        const dbItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoachingContent));
        
        const dbIds = new Set(dbItems.map(i => i.id));
        const fallbacks = mockCoachingContent.filter(i => !dbIds.has(i.id));
        
        return [...dbItems, ...fallbacks];
    } catch { return mockCoachingContent; }
};
export const addCoachingContent = async (data: Omit<CoachingContent, 'id'>) => { await addDoc(collection(db, 'coaching'), data); };
export const updateCoachingContent = async (id: string, data: Partial<CoachingContent>) => { await updateDoc(doc(db, 'coaching', id), data); };
export const deleteCoachingContent = async (id: string) => { await deleteDoc(doc(db, 'coaching', id)); };

export const fetchBehindTheScenesData = async (): Promise<BehindTheScenesContent[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'behindTheScenes'));
        return snapshot.docs.map(doc => ({ id: parseInt(doc.id) || Date.now(), ...doc.data() } as BehindTheScenesContent));
    } catch { return []; }
};
export const addBehindTheScenesContent = async (data: Omit<BehindTheScenesContent, 'id'>) => { await addDoc(collection(db, 'behindTheScenes'), data); };
export const updateBehindTheScenesContent = async (id: string, data: Partial<BehindTheScenesContent>) => { await updateDoc(doc(db, 'behindTheScenes', id), data); };
export const deleteBehindTheScenesContent = async (id: string) => { await deleteDoc(doc(db, 'behindTheScenes', id)); };

// Archive
export const fetchArchiveData = async (): Promise<ArchiveItem[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'archive'));
        const dbItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArchiveItem));
        
        const dbIds = new Set(dbItems.map(i => String(i.id)));
        const fallbacks = mockArchiveData.filter(i => !dbIds.has(String(i.id)));
        
        return [...dbItems, ...fallbacks];
    } catch { return mockArchiveData; }
};
export const addArchiveItem = async (data: Omit<ArchiveItem, 'id'>) => { await addDoc(collection(db, 'archive'), data); };
export const updateArchiveItem = async (id: string, data: Partial<ArchiveItem>) => { await updateDoc(doc(db, 'archive', id), data); };
export const deleteArchiveItem = async (id: string) => { await deleteDoc(doc(db, 'archive', id)); };

export const fetchOnThisDayData = async (): Promise<OnThisDayEvent[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'onThisDay'));
        const dbItems = snapshot.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() } as OnThisDayEvent));
        
        const dbIds = new Set(dbItems.map(i => i.id));
        const fallbacks = mockOnThisDayData.filter(i => !dbIds.has(i.id));
        
        return [...dbItems, ...fallbacks];
    } catch { return mockOnThisDayData; }
};

export const fetchPhotoGalleries = async (): Promise<PhotoAlbum[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'photoGalleries'));
        return snapshot.docs.map(doc => ({ id: parseInt(doc.id) || Date.now(), ...doc.data() } as PhotoAlbum));
    } catch { return []; }
};

// Youth
export const fetchYouthData = async (): Promise<YouthLeague[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'youth'));
        const dbItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as YouthLeague));
        
        const dbIds = new Set(dbItems.map(i => i.id));
        const fallbacks = mockYouthData.filter(i => !dbIds.has(i.id));
        
        return [...dbItems, ...fallbacks];
    } catch { return mockYouthData; }
};

// Cups
export const fetchCups = async (): Promise<Tournament[]> => {
     try {
        const snapshot = await getDocs(collection(db, 'cups'));
        const dbItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
        
        const dbIds = new Set(dbItems.map(i => i.id));
        const fallbacks = mockCupData.filter(i => !dbIds.has(i.id));
        
        return [...dbItems, ...fallbacks];
    } catch { return mockCupData; }
};
export const addCup = async (data: any) => { await addDoc(collection(db, 'cups'), data); };
export const updateCup = async (id: string, data: any) => { 
    // Using setDoc with merge:true to handle upsert (fix for fallback data edit issues)
    await setDoc(doc(db, 'cups', id), data, { merge: true }); 
};

// Hybrid Tournaments (International)
export const fetchHybridTournaments = async (): Promise<HybridTournament[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'hybrid_tournaments'));
        const dbItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HybridTournament));
        
        // Merge with local data: Use DB version if it exists, otherwise fallback
        const dbIds = new Set(dbItems.map(i => i.id));
        const fallbacks = internationalData.filter(i => !dbIds.has(i.id));
        
        return [...dbItems, ...fallbacks];
    } catch { return internationalData; }
};
export const addHybridTournament = async (data: Omit<HybridTournament, 'id'>) => { 
    return await addDoc(collection(db, 'hybrid_tournaments'), data); 
};
export const updateHybridTournament = async (id: string, data: Partial<HybridTournament>) => { 
    // Using setDoc with merge:true to handle upsert (fix for fallback data edit issues)
    return await setDoc(doc(db, 'hybrid_tournaments', id), data, { merge: true }); 
};
export const deleteHybridTournament = async (id: string) => { 
    return await deleteDoc(doc(db, 'hybrid_tournaments', id)); 
};

// Referees
export const fetchRefereesData = async (): Promise<{ referees: Referee[], ruleOfTheWeek: Rule }> => {
    try {
        const docRef = doc(db, 'referees', 'main');
        const snap = await getDoc(docRef);
        if (snap.exists()) return snap.data() as { referees: Referee[], ruleOfTheWeek: Rule };
        return defaultRefereeData;
    } catch { return defaultRefereeData; }
};
export const updateRefereesData = async (data: { referees: Referee[], ruleOfTheWeek: Rule }) => {
    await setDoc(doc(db, 'referees', 'main'), data);
};

// Ads
export const fetchAllAds = async (): Promise<Record<string, Ad>> => {
    try {
        const docRef = doc(db, 'ads', 'main');
        const snap = await getDoc(docRef);
        if (snap.exists()) return snap.data() as Record<string, Ad>;
        return {};
    } catch { return {}; }
};
export const fetchAd = async (placement: string): Promise<Ad | null> => {
    const ads = await fetchAllAds();
    return ads[placement] || null;
};
export const updateAd = async (placement: string, ad: Ad) => {
    const docRef = doc(db, 'ads', 'main');
    await updateDoc(docRef, { [placement]: ad });
};

// Sponsors
export const fetchSponsors = async (): Promise<{ spotlight: Sponsor, kitPartner: KitPartner }> => {
    try {
        const docRef = doc(db, 'sponsors', 'main');
        const snap = await getDoc(docRef);
        if (snap.exists()) return snap.data() as { spotlight: Sponsor, kitPartner: KitPartner };
        return defaultSponsors;
    } catch { return defaultSponsors; }
};

export const submitSponsorRequest = async (data: Omit<SponsorRequest, 'status' | 'submittedAt'>) => {
    await addDoc(collection(db, 'sponsorRequests'), { ...data, status: 'pending', submittedAt: serverTimestamp() });
};
export const submitAdvertiserRequest = async (data: Omit<AdvertiserRequest, 'status' | 'submittedAt'>) => {
    await addDoc(collection(db, 'advertiserRequests'), { ...data, status: 'pending', submittedAt: serverTimestamp() });
};

// Admin Requests
export const fetchPendingChanges = async (): Promise<PendingChange[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'pending_changes'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PendingChange));
    } catch { return []; }
};
export const addPendingChange = async (data: Omit<PendingChange, 'id'>) => {
    await addDoc(collection(db, 'pending_changes'), data);
};
export const deletePendingChange = async (id: string) => {
    await deleteDoc(doc(db, 'pending_changes', id));
};
export const fetchClubRequests = async (): Promise<ClubRegistrationRequest[]> => {
     try {
        const q = query(collection(db, 'clubRequests'), where('status', '==', 'pending'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClubRegistrationRequest));
    } catch { return []; }
};
export const submitClubRequest = async (data: Omit<ClubRegistrationRequest, 'id' | 'status' | 'submittedAt'>) => {
     await addDoc(collection(db, 'clubRequests'), { ...data, status: 'pending', submittedAt: serverTimestamp() });
};
export const approveClubRequest = async (request: ClubRegistrationRequest) => {
    // 1. Update user role
    if (request.userId && request.userId !== 'pending-auth') {
        const userRef = doc(db, 'users', request.userId);
        await updateDoc(userRef, { role: 'club_admin', club: request.clubName });
    }
    // 2. Mark request approved
    await updateDoc(doc(db, 'clubRequests', request.id), { status: 'approved' });
};
export const rejectClubRequest = async (id: string) => {
    await updateDoc(doc(db, 'clubRequests', id), { status: 'rejected' });
};

// Categories
export const fetchCategories = async (): Promise<Category[]> => {
     try {
        const snapshot = await getDocs(collection(db, 'categories'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)).sort((a,b) => a.order - b.order);
    } catch { return []; }
};
export const deleteCategory = async (id: string) => {
    await deleteDoc(doc(db, 'categories', id));
};

// Utils
export const resetAllCompetitionData = async () => {
    const comps = await fetchAllCompetitions();
    for (const [id, comp] of Object.entries(comps)) {
        await updateDoc(doc(db, id), {
            fixtures: [], results: [], teams: []
        });
    }
};

export const fetchFootballDataOrg = async (externalId: string, apiKey: string, season: string, type: 'fixtures' | 'results', useProxy: boolean, officialTeamNames: string[]): Promise<CompetitionFixture[]> => {
    if (!apiKey) throw new Error("API Key required");
    
    // Football-Data.org uses year for season (e.g. 2023)
    const seasonYear = season.split('-')[0] || new Date().getFullYear().toString();
    
    let url = `https://api.football-data.org/v4/competitions/${externalId}/matches?season=${seasonYear}`;
    if (type === 'fixtures') url += `&status=SCHEDULED,LIVE,IN_PLAY,PAUSED`;
    else url += `&status=FINISHED`;

    if (useProxy) url = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    
    const response = await fetch(url, {
        headers: { 'X-Auth-Token': apiKey }
    });
    
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || response.statusText);
    }
    
    const data = await response.json();
    if (!data.matches) return [];

    return data.matches.map((m: any) => {
        const matchDate = new Date(m.utcDate);
        return {
            id: m.id,
            teamA: normalizeTeamName(m.homeTeam.name, officialTeamNames) || m.homeTeam.name,
            teamB: normalizeTeamName(m.awayTeam.name, officialTeamNames) || m.awayTeam.name,
            fullDate: m.utcDate.split('T')[0],
            date: matchDate.getDate().toString(),
            day: matchDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
            time: matchDate.toTimeString().substring(0, 5),
            status: m.status === 'FINISHED' ? 'finished' : 'scheduled',
            scoreA: m.score?.fullTime?.home,
            scoreB: m.score?.fullTime?.away,
            matchday: m.matchday,
            venue: 'Unknown' // FD.org doesn't always provide venue in matches list
        } as CompetitionFixture;
    });
};

export const fetchAllCommunityEvents = async (): Promise<CommunityEvent[]> => {
     try {
        const snapshot = await getDocs(collection(db, 'community_events'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityEvent));
    } catch { return []; }
};

export const fetchCommunityEvents = async (): Promise<CommunityEvent[]> => {
    try {
        // Fetch approved events only for public display
        const q = query(collection(db, 'community_events'), where('status', '==', 'approved'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityEvent));
    } catch { return []; }
};

export const submitCommunityEvent = async (data: Omit<CommunityEvent, 'id' | 'status' | 'createdAt'> & { userId?: string }) => {
    await addDoc(collection(db, 'community_events'), { ...data, status: 'pending', createdAt: serverTimestamp(), likes: 0 });
};

export const updateCommunityEvent = async (id: string, data: Partial<CommunityEvent>) => {
    await updateDoc(doc(db, 'community_events', id), data);
};

export const updateCommunityEventStatus = async (id: string, status: CommunityEvent['status']) => {
    await updateDoc(doc(db, 'community_events', id), { status });
};

export const deleteCommunityEvent = async (id: string) => {
    await deleteDoc(doc(db, 'community_events', id));
};

export const submitCommunityResult = async (eventId: string, result: string) => {
    await updateDoc(doc(db, 'community_events', eventId), { resultsSummary: result });
};
