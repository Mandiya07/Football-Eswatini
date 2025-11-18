
import { Team, Player, CompetitionFixture } from '../data/teams';
import { NewsItem } from '../data/news';
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, query, orderBy, addDoc, updateDoc, deleteDoc, setDoc, onSnapshot, runTransaction, deleteField, writeBatch, where, serverTimestamp, limit } from 'firebase/firestore';
import { Product } from '../data/shop';
import { ScoutedPlayer } from '../data/scouting';
import { DirectoryEntity } from '../data/directory';
import { Video } from '../data/videos';
import { YouthLeague } from '../data/youth';
import { Tournament } from '../data/cups';
import { CoachingContent } from '../data/coaching';
import { OnThisDayEvent, ArchiveItem } from '../data/memoryLane';
import { Sponsor, KitPartner, sponsors as defaultSponsors } from '../data/sponsors';
import { PhotoAlbum, BehindTheScenesContent } from '../data/media';
import { Referee, Rule, refereeData as defaultRefereeData } from '../data/referees';
import { calculateStandings } from './utils';
import { User } from '../contexts/AuthContext';

// NOTE: All data fetching functions now use Firebase Firestore.
// For this to work, you must seed your Firestore database with collections
// ('competitions', 'news', 'users', etc.) that match the structure of your mock data.

export const handleFirestoreError = (error: any, operation: string) => {
    const firebaseError = error as { code?: string, message?: string };
    console.error(`Firestore error during '${operation}':`, error);
    
    let userMessage = `Operation '${operation}' failed. Please try again.`;
    
    if (firebaseError.code === 'permission-denied' || firebaseError.code === 'failed-precondition') {
        userMessage = `Permission Denied: You do not have the required permissions to perform the '${operation}' operation. This can be caused by database security rules or a missing database index. Please check the developer console for more details.`;
    } else if (firebaseError.code === 'unavailable') {
        userMessage = `Could not connect to the database for '${operation}'. Please check your internet connection.`;
    } else {
        userMessage = `An unexpected error occurred during '${operation}'. Check the console for more details. Message: ${firebaseError.message}`;
    }
    
    alert(userMessage);
};


// Ad interface and related API functions for advertisement management.
export interface Ad {
  imageUrl: string;
  link: string;
  altText: string;
}

export interface PendingChange {
  id: string; // Firestore doc ID
  type: 'Score Update' | 'New Player' | 'Squad Removal';
  description: string;
  author: string;
}

export interface Category {
    id: string;
    name: string;
    order: number;
}

export interface Competition {
    name: string;
    displayName?: string;
    description?: string;
    logoUrl?: string;
    fixtures: CompetitionFixture[];
    results: CompetitionFixture[];
    teams?: Team[]; // Only for leagues with standings
    categoryId?: string;
    externalApiId?: string;
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

export interface LiveUpdate {
    id: string;
    fixture_id: string;
    competition: string;
    home_team: string;
    away_team: string;
    minute: number;
    type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'full_time' | 'half_time';
    player: string;
    description: string;
    score_home: number;
    score_away: number;
    timestamp: { seconds: number, nanoseconds: number };
}

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
    console.log(`API: Setting up listener for live updates.`);
    // Query for the 50 most recent updates, ordered by timestamp.
    // This requires a Firestore index on the 'timestamp' field (descending).
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
        // The data is already sorted and limited by Firestore.
        callback(updates);
    }, (error) => {
        console.error(`Error listening to live updates:`, error);
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
    console.log(`API: Setting up listener for comments on fixture '${fixtureId}'.`);
    const q = query(
        collection(db, "fixture_comments"),
        where("fixtureId", "==", fixtureId)
        // orderBy("timestamp", "asc") // Removed to prevent needing a composite index
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const comments: FixtureComment[] = [];
        querySnapshot.forEach((doc) => {
            comments.push({ id: doc.id, ...doc.data() } as FixtureComment);
        });
        // Sort comments on the client-side
        comments.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
        callback(comments);
    }, (error) => {
        console.error(`Error listening to comments for fixture '${fixtureId}':`, error);
        handleFirestoreError(error, `listen to comments for fixture ${fixtureId}`);
        callback([]);
    });

    return unsubscribe;
};

export const fetchNationalTeams = async (): Promise<NationalTeam[]> => {
    console.log("API: Fetching all national teams from Firestore.");
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
    console.log(`API: Setting up listener for competition '${competitionId}'.`);
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
            callback(undefined);
        }
    }, (error) => {
        console.error(`Error listening to competition '${competitionId}':`, error);
        callback(undefined);
    });

    return unsubscribe; // Return the unsubscribe function for cleanup
};

export const fetchAllCompetitions = async (): Promise<Record<string, Competition>> => {
    console.log("API: Fetching all competitions from Firestore.");
    const firestoreCompetitions: Record<string, Competition> = {};
    try {
        const querySnapshot = await getDocs(collection(db, "competitions"));
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            firestoreCompetitions[doc.id] = {
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
        });
        return firestoreCompetitions;
    } catch (error) {
        handleFirestoreError(error, 'fetch all competitions');
        return {};
    }
};

export const fetchCompetition = async (competitionId: string): Promise<Competition | null> => {
    console.log(`API: Fetching competition '${competitionId}' from Firestore.`);
    try {
        const docRef = doc(db, 'competitions', competitionId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
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
        } else {
            console.warn(`No such competition document: ${competitionId}`);
            return null;
        }
    } catch (error) {
        handleFirestoreError(error, `fetch competition ${competitionId}`);
        return null;
    }
};

export const fetchNews = async (): Promise<NewsItem[]> => {
    console.log("API: Fetching news from Firestore.");
    const items: NewsItem[] = [];
    try {
        const q = query(collection(db, "news"));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() } as NewsItem);
        });
        // Sort on the client to avoid needing a Firestore index
        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
        handleFirestoreError(error, 'fetch news');
    }
    return items;
};

export const fetchNewsArticleByUrl = async (url: string): Promise<NewsItem | null> => {
    console.log(`API: Fetching news article by URL '${url}' from Firestore.`);
    try {
        const q = query(collection(db, "news"), where("url", "==", url), limit(1));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            console.warn(`No news article found with URL: ${url}`);
            return null;
        }
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as NewsItem;
    } catch (error) {
        handleFirestoreError(error, `fetch news article by URL ${url}`);
        return null;
    }
};

export const fetchCategories = async (): Promise<Category[]> => {
    console.log("API: Fetching categories from Firestore.");
    const items: Category[] = [];
    try {
        const q = query(collection(db, "categories")); // Removed orderBy to avoid index requirement
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() } as Category);
        });
        // Sort client-side for resilience
        items.sort((a, b) => (a.order || 99) - (b.order || 99));
    } catch (error) {
        handleFirestoreError(error, 'fetch categories');
    }
    return items;
};

export const fetchDirectoryEntries = async (): Promise<DirectoryEntity[]> => {
    console.log("API: Fetching directory entries from Firestore.");
    const items: DirectoryEntity[] = [];
    try {
        const q = query(collection(db, "directory"));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() } as DirectoryEntity);
        });
        // Sort on the client to avoid needing a Firestore index
        items.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        handleFirestoreError(error, 'fetch directory entries');
    }
    return items;
};

export const fetchVideos = async (): Promise<Video[]> => {
    const items: Video[] = [];
    try {
        const querySnapshot = await getDocs(collection(db, "videos"));
        querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() } as Video);
        });
    } catch (error) {
        handleFirestoreError(error, 'fetch videos');
    }
    return items;
};

export const fetchYouthData = async (): Promise<YouthLeague[]> => {
    const items: YouthLeague[] = [];
    try {
        const querySnapshot = await getDocs(collection(db, "youth"));
        querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() } as YouthLeague);
        });
    } catch (error) {
        handleFirestoreError(error, 'fetch youth data');
    }
    return items;
};

export const fetchTeamById = async (competitionId: string, teamId: number): Promise<Team | null> => {
    try {
        const competition = await fetchCompetition(competitionId);
        return competition?.teams?.find(t => t.id === teamId) || null;
    } catch (error) {
        handleFirestoreError(error, `fetch team by ID ${teamId}`);
        return null;
    }
};

export const fetchPlayerById = async (playerId: number): Promise<{ player: Player; team: Team, competitionId: string } | null> => {
    try {
        const competitions = await fetchAllCompetitions();
        for (const competitionId in competitions) {
            const competition = competitions[competitionId];
            if (competition.teams) {
                for (const team of competition.teams) {
                    const player = team.players?.find(p => p.id === playerId);
                    if (player) {
                        return { player, team, competitionId };
                    }
                }
            }
        }
        return null;
    } catch (error) {
        handleFirestoreError(error, `fetch player by ID ${playerId}`);
        return null;
    }
};

export const fetchTeamByIdGlobally = async (teamId: number): Promise<{ team: Team, competitionId: string } | null> => {
    try {
        const competitions = await fetchAllCompetitions();
        for (const competitionId in competitions) {
            const competition = competitions[competitionId];
            const team = competition.teams?.find(t => t.id === teamId);
            if (team) {
                return { team, competitionId };
            }
        }
        return null;
    } catch (error) {
        handleFirestoreError(error, `fetch team globally by ID ${teamId}`);
        return null;
    }
};

export const fetchPhotoGalleries = async (): Promise<PhotoAlbum[]> => {
    const items: PhotoAlbum[] = [];
    try {
        const querySnapshot = await getDocs(collection(db, "photoGalleries"));
        querySnapshot.forEach((doc) => {
            items.push({ id: Number(doc.id), ...doc.data() } as PhotoAlbum);
        });
    } catch (error) {
        handleFirestoreError(error, 'fetch photo galleries');
    }
    return items;
};

export const fetchBehindTheScenesData = async (): Promise<BehindTheScenesContent[]> => {
    const items: BehindTheScenesContent[] = [];
    try {
        const querySnapshot = await getDocs(collection(db, "behindTheScenes"));
        querySnapshot.forEach((doc) => {
            items.push({ id: Number(doc.id), ...doc.data() } as BehindTheScenesContent);
        });
    } catch (error) {
        handleFirestoreError(error, 'fetch behind the scenes data');
    }
    return items;
};

export const fetchSponsors = async (): Promise<{ spotlight: Sponsor; kitPartner: KitPartner; }> => {
    try {
        const docRef = doc(db, "sponsors", "main");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as { spotlight: Sponsor; kitPartner: KitPartner; };
        }
    } catch (error) {
        handleFirestoreError(error, 'fetch sponsors');
    }
    return defaultSponsors;
};

// Implement missing advertisement API functions.
export const fetchAllAds = async (): Promise<Record<string, Ad>> => {
    console.log("API: Fetching all ads from Firestore.");
    try {
        const docRef = doc(db, "ads", "main");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as Record<string, Ad>;
        }
        console.warn("Ads document 'ads/main' not found.");
        return {};
    } catch (error) {
        handleFirestoreError(error, 'fetch all ads');
        return {};
    }
};

export const fetchAd = async (placement: string): Promise<Ad | null> => {
    console.log(`API: Fetching ad for placement '${placement}'.`);
    try {
        const adsData = await fetchAllAds();
        return adsData[placement] || null;
    } catch (error) {
        // fetchAllAds already handles error logging
        return null;
    }
};

export const updateAd = async (placement: string, data: Ad) => {
    console.log(`API: Updating ad for placement '${placement}'.`);
    try {
        const docRef = doc(db, "ads", "main");
        await setDoc(docRef, { [placement]: data }, { merge: true });
    } catch (error) {
        handleFirestoreError(error, `update ad '${placement}'`);
        throw error; // re-throw to be caught by UI
    }
};

export const fetchProducts = async (): Promise<Product[]> => {
    const items: Product[] = [];
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() } as Product);
        });
    } catch (error) {
        handleFirestoreError(error, 'fetch products');
    }
    return items;
};

export const addProduct = (data: Omit<Product, 'id'>) => addDoc(collection(db, 'products'), data);
export const updateProduct = (id: string, data: Partial<Product>) => updateDoc(doc(db, 'products', id), data);
export const deleteProduct = (id: string) => deleteDoc(doc(db, 'products', id));

export const fetchScoutedPlayers = async (): Promise<ScoutedPlayer[]> => {
    const items: ScoutedPlayer[] = [];
    try {
        const querySnapshot = await getDocs(collection(db, "scouting"));
        querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() } as ScoutedPlayer);
        });
    } catch (error) {
        handleFirestoreError(error, 'fetch scouted players');
    }
    return items;
};
export const addScoutedPlayer = (data: Omit<ScoutedPlayer, 'id'>) => addDoc(collection(db, 'scouting'), data);
export const updateScoutedPlayer = (id: string, data: Partial<ScoutedPlayer>) => updateDoc(doc(db, 'scouting', id), data);
export const deleteScoutedPlayer = (id: string) => deleteDoc(doc(db, 'scouting', id));


export const addDirectoryEntry = (data: Omit<DirectoryEntity, 'id'>) => addDoc(collection(db, 'directory'), data);
export const updateDirectoryEntry = (id: string, data: Partial<DirectoryEntity>) => {
    // Explicitly type cleanedData to allow for dynamic property assignment
    // including Firestore's `deleteField()` which is a special FieldValue type.
    const cleanedData: { [key: string]: any } = { ...data };
    Object.keys(cleanedData).forEach(key => {
        if ((cleanedData as any)[key] === null) {
            cleanedData[key] = deleteField();
        }
    });
    return updateDoc(doc(db, 'directory', id), cleanedData);
};
export const deleteDirectoryEntry = (id: string) => deleteDoc(doc(db, 'directory', id));


export const addVideo = (data: Omit<Video, 'id'>) => addDoc(collection(db, 'videos'), data);
export const updateVideo = (id: string, data: Partial<Video>) => updateDoc(doc(db, 'videos', id), data);
export const deleteVideo = (id: string) => deleteDoc(doc(db, 'videos', id));


export const fetchPendingChanges = async (): Promise<PendingChange[]> => {
    const items: PendingChange[] = [];
    try {
        const querySnapshot = await getDocs(collection(db, "pendingChanges"));
        querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() } as PendingChange);
        });
    } catch (error) {
        handleFirestoreError(error, 'fetch pending changes');
    }
    return items;
};

export const deletePendingChange = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'pendingChanges', id));
    } catch (error) {
        handleFirestoreError(error, `delete pending change ${id}`);
        throw error;
    }
};

export const addCup = (data: Omit<Tournament, 'id'>) => addDoc(collection(db, 'cups'), data);
export const updateCup = (id: string, data: Partial<Tournament>) => updateDoc(doc(db, 'cups', id), data);


export const fetchCoachingContent = async (): Promise<CoachingContent[]> => {
    const items: CoachingContent[] = [];
    try {
        const querySnapshot = await getDocs(collection(db, "coaching"));
        querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() } as CoachingContent);
        });
    } catch (error) {
        handleFirestoreError(error, 'fetch coaching content');
    }
    return items;
};

export const fetchOnThisDayData = async (): Promise<OnThisDayEvent[]> => {
    const items: OnThisDayEvent[] = [];
    try {
        const querySnapshot = await getDocs(collection(db, "onThisDay"));
        querySnapshot.forEach((doc) => {
            items.push({ id: Number(doc.id), ...doc.data() } as OnThisDayEvent);
        });
    } catch (error) {
        handleFirestoreError(error, 'fetch on this day data');
    }
    return items;
};

export const fetchArchiveData = async (): Promise<ArchiveItem[]> => {
    const items: ArchiveItem[] = [];
    try {
        const querySnapshot = await getDocs(collection(db, "archive"));
        querySnapshot.forEach((doc) => {
            items.push({ id: Number(doc.id), ...doc.data() } as ArchiveItem);
        });
    } catch (error) {
        handleFirestoreError(error, 'fetch archive data');
    }
    return items;
};

export const fetchCups = async (): Promise<Tournament[]> => {
    const items: Tournament[] = [];
    try {
        const querySnapshot = await getDocs(collection(db, "cups"));
        querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() } as Tournament);
        });
    } catch (error) {
        handleFirestoreError(error, 'fetch cups');
    }
    return items;
};

export const fetchAllTeams = async (): Promise<Team[]> => {
    const allTeams: Team[] = [];
    try {
        const competitions = await fetchAllCompetitions();
        for (const compId in competitions) {
            allTeams.push(...(competitions[compId].teams || []));
        }
    } catch (error) {
        handleFirestoreError(error, 'fetch all teams');
    }
    return allTeams;
};

export const deleteCategory = (id: string) => deleteDoc(doc(db, 'categories', id));

export const resetAllCompetitionData = async () => {
    try {
        const batch = writeBatch(db);

        // 1. Reset documents in the 'competitions' collection
        const competitionsSnapshot = await getDocs(collection(db, "competitions"));
        competitionsSnapshot.forEach(doc => {
            batch.update(doc.ref, {
                teams: [],
                fixtures: [],
                results: []
            });
        });

        // 2. Reset documents in the 'cups' collection
        const cupsSnapshot = await getDocs(collection(db, "cups"));
        cupsSnapshot.forEach(doc => {
            // Cups have a different structure, they have 'rounds'
            batch.update(doc.ref, {
                rounds: []
            });
        });

        // 3. Delete all documents in 'live_updates' collection
        const liveUpdatesSnapshot = await getDocs(collection(db, "live_updates"));
        liveUpdatesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // 4. Delete all documents in 'fixture_comments' collection
        const commentsSnapshot = await getDocs(collection(db, "fixture_comments"));
        commentsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // 5. Commit all batched writes at once
        await batch.commit();
    } catch (error) {
        handleFirestoreError(error, 'reset all competition data');
        throw error;
    }
};

export const fetchRefereesData = async (): Promise<{ referees: Referee[], ruleOfTheWeek: Rule }> => {
    try {
        const docRef = doc(db, "referees", "main");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as { referees: Referee[], ruleOfTheWeek: Rule };
        }
    } catch (error) {
        handleFirestoreError(error, 'fetch referees data');
    }
    return defaultRefereeData;
};
