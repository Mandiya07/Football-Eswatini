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
import { calculateStandings, normalizeTeamName, superNormalize } from './utils';
import { User } from '../contexts/AuthContext';
import { ExclusiveItem, TeamYamVideo, initialExclusiveContent, initialTeamYamVideos } from '../data/features';
import { internationalData, youthHybridData, HybridTournament } from '../data/international';

// NOTE: All data fetching functions now use Firebase Firestore with failover to local mock data.

export { type Competition, type HybridTournament }; 
export { type ExclusiveItem, type TeamYamVideo }; 

/**
 * Global Firestore error handler.
 */
export const handleFirestoreError = (error: any, operation: string) => {
    const firebaseError = error as { code?: string, message?: string };
    
    // Connection issue / Timeout
    if (
        firebaseError.code === 'unavailable' || 
        firebaseError.code === 'deadline-exceeded' ||
        firebaseError.message?.includes('Could not reach Cloud Firestore') ||
        firebaseError.message?.includes('Backend didn\'t respond')
    ) {
        console.warn(`[Firestore Connectivity] '${operation}' failed to reach server. Operating in offline/cached mode.`);
        return;
    }
    
    if (firebaseError.code === 'permission-denied') {
        console.error(`[Firestore Permission Denied] '${operation}' failed. Check security rules.`);
        return;
    }

    if (firebaseError.code === 'not-found') {
        console.warn(`[Firestore Data Missing] '${operation}' item not found in DB.`);
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
    promoCode?: string;
}

export interface SponsorRequest {
    brandName: string;
    contactName: string;
    email: string;
    phone: string;
    sponsorshipTier: string;
    goals: string;
    status: 'pending' | 'contacted' | 'closed';
    submittedAt: any;
    promoCode?: string;
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
    fixtureId: number | string;
    userId: string;
    userName: string;
    userAvatar: string;
    text: string;
    timestamp: { seconds: number, nanoseconds: number };
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
    posterUrl?: string;
    status: 'pending' | 'approved';
    isSpotlight?: boolean;
    resultsSummary?: string;
    fees?: string;
    prizes?: string;
    createdAt?: any;
    likes?: number;
    likedBy?: string[];
}

export interface PromoCode {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    isActive: boolean;
}

export const addLiveUpdate = async (data: Omit<LiveUpdate, 'id' | 'timestamp'>) => {
    try {
        await addDoc(collection(db, 'live_updates'), {
            ...data,
            timestamp: serverTimestamp(),
            verified: true,
            confidence: 0.95,
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

    return onSnapshot(q, (querySnapshot) => {
        const updates: LiveUpdate[] = [];
        querySnapshot.forEach((doc) => {
            updates.push({ id: doc.id, ...doc.data() } as LiveUpdate);
        });
        callback(updates);
    }, (error) => {
        handleFirestoreError(error, `listen to live updates`);
        callback([]);
    });
};

export const addFixtureComment = async (fixtureId: number | string, text: string, user: User) => {
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

export const listenToFixtureComments = (fixtureId: number | string, callback: (comments: FixtureComment[]) => void): (() => void) => {
    const q = query(
        collection(db, "fixture_comments"),
        where("fixtureId", "==", fixtureId)
    );

    return onSnapshot(q, (querySnapshot) => {
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

    return onSnapshot(q, (querySnapshot) => {
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

    return onSnapshot(q, (querySnapshot) => {
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

    return onSnapshot(q, (querySnapshot) => {
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
};

export const toggleCommunityEventLike = async (eventId: string, userId: string, isLiked: boolean) => {
    try {
        const eventRef = doc(db, 'community_events', eventId);
        if (isLiked) {
            await updateDoc(eventRef, {
                likes: increment(-1),
                likedBy: arrayRemove(userId)
            });
        } else {
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
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data() as Competition);
        } else {
            callback(undefined);
        }
    }, (error) => {
        handleFirestoreError(error, `listen to competition ${competitionId}`);
        callback(undefined);
    });
};

/**
 * Real-time listener for ALL competitions.
 */
export const listenToAllCompetitions = (callback: (data: Record<string, Competition>) => void): (() => void) => {
    const q = query(collection(db, "competitions"));
    return onSnapshot(q, (snapshot) => {
        const comps: Record<string, Competition> = {};
        snapshot.forEach(doc => {
            comps[doc.id] = doc.data() as Competition;
        });
        callback(comps);
    }, (error) => {
        handleFirestoreError(error, 'listen to all competitions');
    });
};

export const fetchNews = async (): Promise<NewsItem[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'news'));
        const dbItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsItem));
        const dbUrls = new Set(dbItems.map(i => i.url));
        const fallbacks = newsData.filter(i => !dbUrls.has(i.url));
        const allItems = [...dbItems, ...fallbacks];
        return allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

export const fetchDirectoryEntries = async (): Promise<DirectoryEntity[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'directory'));
        const dbItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DirectoryEntity));
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
    await deleteDoc(collection(db, 'match_tickets', id));
};

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

export const fetchYouthData = async (): Promise<YouthLeague[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'youth'));
        const dbItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as YouthLeague));
        const dbIds = new Set(dbItems.map(i => i.id));
        const fallbacks = mockYouthData.filter(i => !dbIds.has(i.id));
        return [...dbItems, ...fallbacks];
    } catch { return mockYouthData; }
};

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
    await setDoc(doc(db, 'cups', id), data, { merge: true }); 
};
export const deleteCup = async (id: string) => {
    await deleteDoc(doc(db, 'cups', id));
};

export const fetchHybridTournaments = async (): Promise<HybridTournament[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'hybrid_tournaments'));
        const dbItems = snapshot.docs.map(doc => {
            const data = doc.data();
            return { ...data, id: doc.id } as HybridTournament;
        });
        const dbIds = new Set(dbItems.map(i => i.id));
        const fallbacks = internationalData.filter(i => !dbIds.has(i.id));
        return [...dbItems, ...fallbacks];
    } catch (error) { 
        handleFirestoreError(error, 'fetch hybrid tournaments');
        return internationalData; 
    }
};
export const addHybridTournament = async (data: Omit<HybridTournament, 'id'>) => { 
    return await addDoc(collection(db, 'hybrid_tournaments'), data); 
};
export const updateHybridTournament = async (id: string, data: Partial<HybridTournament>) => { 
    return await setDoc(doc(db, 'hybrid_tournaments', id), data, { merge: true }); 
};
export const deleteHybridTournament = async (id: string) => { 
    return await deleteDoc(doc(db, 'hybrid_tournaments', id)); 
};

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
    if (request.userId && request.userId !== 'pending-auth') {
        const userRef = doc(db, 'users', request.userId);
        await updateDoc(userRef, { role: 'club_admin', club: request.clubName });
    }
    await updateDoc(doc(db, 'clubRequests', request.id), { status: 'approved' });
};
export const rejectClubRequest = async (id: string) => {
    await updateDoc(doc(db, 'clubRequests', id), { status: 'rejected' });
};

// --- League Requests ---
export const fetchLeagueRequests = async (): Promise<LeagueRegistrationRequest[]> => {
    try {
       const q = query(collection(db, 'leagueRequests'), where('status', '==', 'pending'));
       const snapshot = await getDocs(q);
       return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeagueRegistrationRequest));
   } catch { return []; }
};
export const approveLeagueRequest = async (request: LeagueRegistrationRequest) => {
    // 1. Upgrade the user to league_admin
    if (request.managerId && request.managerId !== 'new_user') {
        const userRef = doc(db, 'users', request.managerId);
        await updateDoc(userRef, { 
            role: 'league_admin', 
            managedLeagues: arrayUnion(request.leagueName.toLowerCase().replace(/\s+/g, '-')) 
        });
    }

    // 2. Create the actual competition document
    const leagueId = request.leagueName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const compRef = doc(db, 'competitions', leagueId);
    await setDoc(compRef, {
        name: request.leagueName,
        description: request.description,
        region: request.region,
        teams: [],
        fixtures: [],
        results: [],
        categoryId: 'regional-leagues'
    });

    // 3. Mark request as approved
    await updateDoc(doc(db, 'leagueRequests', request.id), { status: 'approved' });
};
export const rejectLeagueRequest = async (id: string) => {
   await updateDoc(doc(db, 'leagueRequests', id), { status: 'rejected' });
};

export const fetchCategories = async (): Promise<Category[]> => {
     try {
        const snapshot = await getDocs(collection(db, 'categories'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)).sort((a,b) => a.order - b.order);
    } catch { return []; }
};
export const deleteCategory = async (id: string) => {
    await deleteDoc(doc(db, 'categories', id));
};

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
    // Improvement: Parse season better for football-data.org (usually expects the start year)
    const seasonYear = season.includes('-') ? season.split('-')[0] : (season || new Date().getFullYear().toString());
    
    let url = `https://api.football-data.org/v4/competitions/${externalId}/matches?season=${seasonYear}`;
    if (type === 'fixtures') url += `&status=SCHEDULED,LIVE,IN_PLAY,PAUSED`;
    else url += `&status=FINISHED`;
    
    if (useProxy) url = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    
    const response = await fetch(url, { headers: { 'X-Auth-Token': apiKey } });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || response.statusText);
    }
    const data = await response.json();
    if (!data.matches) return [];
    
    return data.matches.map((m: any) => {
        const matchDate = new Date(m.utcDate);
        // Robust normalization logic: If official names exist, try matching. Otherwise allow through.
        const normalizedA = officialTeamNames.length > 0 ? normalizeTeamName(m.homeTeam.name, officialTeamNames) : m.homeTeam.name;
        const normalizedB = officialTeamNames.length > 0 ? normalizeTeamName(m.awayTeam.name, officialTeamNames) : m.awayTeam.name;

        return {
            id: m.id,
            teamA: normalizedA || m.homeTeam.name,
            teamB: normalizedB || m.awayTeam.name,
            fullDate: m.utcDate.split('T')[0],
            date: matchDate.getDate().toString(),
            day: matchDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
            time: matchDate.toTimeString().substring(0, 5),
            status: m.status === 'FINISHED' ? 'finished' : 'scheduled',
            scoreA: m.score?.fullTime?.home,
            scoreB: m.score?.fullTime?.away,
            matchday: m.matchday,
            venue: 'Unknown'
        } as CompetitionFixture;
    });
};

/**
 * Fetch data from api-football.com (v3.football.api-sports.io)
 */
export const fetchApiFootball = async (externalId: string, apiKey: string, season: string, type: 'fixtures' | 'results', useProxy: boolean, officialTeamNames: string[]): Promise<CompetitionFixture[]> => {
    if (!apiKey) throw new Error("API Key required");
    
    // Season handles both YYYY and YYYY-YYYY, api-football expects starting year YYYY
    const seasonYear = season.includes('-') ? season.split('-')[0] : season;
    
    let url = `https://v3.football.api-sports.io/fixtures?league=${externalId}&season=${seasonYear}`;
    if (useProxy) url = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    
    const response = await fetch(url, {
        headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': 'v3.football.api-sports.io'
        }
    });
    
    if (!response.ok) {
        throw new Error(response.statusText);
    }
    
    const data = await response.json();
    if (!data.response) return [];
    
    return data.response.filter((item: any) => {
        // Simple filtering based on internal status mapping if needed, 
        // or just return all and let client handle grouping
        const statusShort = item.fixture.status.short;
        const isFinished = ['FT', 'AET', 'PEN', 'ABD'].includes(statusShort);
        return type === 'fixtures' ? !isFinished : isFinished;
    }).map((item: any) => {
        const matchDate = new Date(item.fixture.date);
        const normalizedA = officialTeamNames.length > 0 ? normalizeTeamName(item.teams.home.name, officialTeamNames) : item.teams.home.name;
        const normalizedB = officialTeamNames.length > 0 ? normalizeTeamName(item.teams.away.name, officialTeamNames) : item.teams.away.name;

        // Map short statuses to internal
        let internalStatus: CompetitionFixture['status'] = 'scheduled';
        const s = item.fixture.status.short;
        if (['FT', 'AET', 'PEN'].includes(s)) internalStatus = 'finished';
        else if (s === 'NS') internalStatus = 'scheduled';
        else if (s === 'PST') internalStatus = 'postponed';
        else if (s === 'CANC') internalStatus = 'cancelled';
        else if (s === 'ABD') internalStatus = 'abandoned';
        else if (s === 'SUSP') internalStatus = 'suspended';
        else if (['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'].includes(s)) internalStatus = 'live';

        return {
            id: item.fixture.id,
            teamA: normalizedA || item.teams.home.name,
            teamB: normalizedB || item.teams.away.name,
            fullDate: item.fixture.date.split('T')[0],
            date: matchDate.getDate().toString(),
            day: matchDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
            time: matchDate.toTimeString().substring(0, 5),
            status: internalStatus,
            scoreA: item.goals.home,
            scoreB: item.goals.away,
            matchday: item.league.round ? parseInt(item.league.round.replace(/[^0-9]/g, '')) : undefined,
            venue: item.fixture.venue?.name || 'TBA'
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