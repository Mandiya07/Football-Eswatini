
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { app, db, auth } from '../services/firebase';
import { 
    onAuthStateChanged, 
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import Spinner from '../components/ui/Spinner';
import { handleFirestoreError } from '../services/firebase';
import { makePlain } from '../services/utils';

const getAuthorizedEmails = () => {
    let envVal = 'admin@footballeswatini.com';
    try {
        envVal = import.meta.env.VITE_ADMIN_EMAIL || 'admin@footballeswatini.com';
    } catch (e) {}
    return envVal.toLowerCase().split(',').map(e => e.trim());
};

export interface NotificationPreferences {
    matchAlerts: boolean;
    news: boolean;
    announcements: boolean;
}

export interface SubscriptionInfo {
    tier: 'Basic' | 'Professional' | 'Elite' | 'Enterprise';
    status: 'active' | 'expiring' | 'past_due' | 'canceled';
    startDate: string;
    nextRenewalDate: string;
    autoRenew: boolean;
    lastTransactionId?: string;
}

export interface ManagedTeam {
    teamName: string;
    competitionId: string;
    role: 'club_admin' | 'coach';
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'club_admin' | 'league_admin' | 'super_admin' | 'journalist' | 'referee_admin';
  club?: string;
  managedTeams: ManagedTeam[]; // Support for multiple divisions
  managedLeagues?: string[]; 
  favoriteTeamIds: string[];
  notificationPreferences: NotificationPreferences;
  subscription?: SubscriptionInfo;
  xp: number; 
  level: number; 
  journalismCredentials?: {
      outlet: string;
      verified: boolean;
      bio: string;
      accreditations: string[];
      portfolioCount: number;
  };
  canAccessEFADashboard: boolean;
}

export type LoginCredentials = { email: string; password?: string; };
export type RegisterCredentials = { name: string; email: string; password?: string; };

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (updatedFields: Partial<User>) => void;
  addXP: (amount: number) => Promise<void>;
  bootstrapAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const DEFAULT_PREFERENCES: NotificationPreferences = {
      matchAlerts: true,
      news: true,
      announcements: true
  };

  const signup = async (credentials: RegisterCredentials) => {
    if (!auth) throw new Error("Authentication is not available in this environment.");
    const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password!);
    const firebaseUser = userCredential.user;
    
    const authorizedEmails = getAuthorizedEmails();
    const isInitialAdmin = authorizedEmails.includes(credentials.email.toLowerCase());

    const newUserProfile: Omit<User, 'id'> = {
        name: credentials.name,
        email: firebaseUser.email!,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
        role: isInitialAdmin ? 'super_admin' : 'user',
        favoriteTeamIds: [],
        notificationPreferences: DEFAULT_PREFERENCES,
        managedTeams: [],
        xp: 0,
        level: 1,
        canAccessEFADashboard: false
    };

    try {
        if (db) {
            await setDoc(doc(db, "users", firebaseUser.uid), makePlain(newUserProfile));
        } else {
            console.warn("Firestore not initialized, skipping setDoc");
        }
    } catch (error: any) {
        console.warn("Firestore error during signup:", { message: error.message, code: error.code });
    }
    setUser({ id: firebaseUser.uid, ...newUserProfile });
    closeAuthModal();
  };

  const bootstrapAdmin = async () => {
      const authorizedEmails = getAuthorizedEmails();
      const isAuthorized = authorizedEmails.includes(user?.email.toLowerCase() || '');
      if (user && isAuthorized && user.role !== 'super_admin') {
          await updateUser({ role: 'super_admin' });
      }
  };

  useEffect(() => {
    // Robustness: Add a timeout to force loading to false if Firebase hangs
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn("AuthProvider startup timeout hit. Forcing loading state to false.");
        setLoading(false);
      }
    }, 10000); // 10 seconds should be plenty

    if (!auth) {
        setLoading(false);
        clearTimeout(timeoutId);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        try {
            if (firebaseUser) {
                if (db) {
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    const authorizedEmails = getAuthorizedEmails();
                    const isAuthorized = authorizedEmails.includes(firebaseUser.email?.toLowerCase() || '');
                    
                    try {
                        // Try to get cached doc first to show something immediately if offline
                        const docSnap = await getDoc(userDocRef);
                        
                        if (docSnap.exists()) {
                            const data = docSnap.data() as User;
                            if (isAuthorized && data.role !== 'super_admin') {
                                 await updateDoc(userDocRef, { role: 'super_admin' });
                                 setUser({ id: firebaseUser.uid, ...data, role: 'super_admin' });
                            } else {
                                 setUser({ id: firebaseUser.uid, ...data, managedTeams: data.managedTeams || [] } as User);
                            }
                        } else {
                            const initial: Omit<User, 'id'> = {
                                name: firebaseUser.displayName || 'Administrator',
                                email: firebaseUser.email!,
                                avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
                                role: isAuthorized ? 'super_admin' : 'user',
                                favoriteTeamIds: [],
                                managedTeams: [],
                                notificationPreferences: DEFAULT_PREFERENCES,
                                xp: 0,
                                level: 1,
                                canAccessEFADashboard: false
                            };
                            await setDoc(userDocRef, initial);
                            setUser({ id: firebaseUser.uid, ...initial } as User);
                        }
                    } catch (err: any) {
                        console.warn("User profile fetch failed (possible offline mode):", { message: err.message, code: err.code });
                        // Fallback to minimal user info from auth object
                        setUser({
                            id: firebaseUser.uid,
                            name: firebaseUser.displayName || 'User',
                            email: firebaseUser.email || '',
                            avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
                            role: isAuthorized ? 'super_admin' : 'user',
                            managedTeams: [],
                            favoriteTeamIds: [],
                            notificationPreferences: DEFAULT_PREFERENCES,
                            xp: 0,
                            level: 1,
                            canAccessEFADashboard: false
                        });
                    }
                } else {
                     console.warn("Firestore not initialized, skipping Firestore user fetch");
                }
            } else {
                setUser(null);
            }
        } catch (globalErr: any) {
            console.error("Critical error in auth state transition:", { 
                message: globalErr?.message || String(globalErr), 
                // Don't log full stack/object to avoid circular references
            });
        } finally {
            setLoading(false);
            clearTimeout(timeoutId);
        }
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const addXP = async (amount: number) => {
      if (!user) return;
      const newXP = (user.xp || 0) + amount;
      const newLevel = Math.floor(newXP / 100) + 1; 
      updateUser({ xp: newXP, level: newLevel });
  };

  const updateUser = async (updatedFields: Partial<User>) => {
    if (!user) return;
    setUser(prev => prev ? { ...prev, ...updatedFields } : null);
    try {
        if (db) {
            await updateDoc(doc(db, 'users', user.id), makePlain(updatedFields));
        } else {
            console.warn("Firestore not initialized, skipping updateDoc");
        }
    } catch(error: any) {
        // Only report errors if they aren't common connectivity issues
        if (!error.message?.includes('offline') && error.code !== 'unavailable') {
            handleFirestoreError(error, 'update user profile');
        }
    }
  };

  const login = async (credentials: LoginCredentials) => {
    if (!auth) throw new Error("Authentication is not available in this environment.");
    await signInWithEmailAndPassword(auth, credentials.email, credentials.password!);
    closeAuthModal();
  };

  const loginWithGoogle = async () => {
    if (!auth) throw new Error("Authentication is not available in this environment.");
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    closeAuthModal();
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  // if (loading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;

  return (
    <AuthContext.Provider value={{ 
        isLoggedIn: !!user, 
        user, 
        isAuthModalOpen, 
        openAuthModal, 
        closeAuthModal, 
        login, 
        loginWithGoogle,
        signup, 
        logout, 
        updateUser,
        addXP,
        bootstrapAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
