
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { app, db } from '../services/firebase';
import { 
    getAuth,
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import Spinner from '../components/ui/Spinner';
import { handleFirestoreError } from '../services/api';

const auth = getAuth(app);

const getAuthorizedEmails = () => {
    const envVal = process.env.ADMIN_EMAIL || 'admin@footballeswatini.com';
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
  role: 'user' | 'club_admin' | 'league_admin' | 'super_admin' | 'journalist';
  club?: string;
  managedTeams: ManagedTeam[]; // Support for multiple divisions
  managedLeagues?: string[]; 
  favoriteTeamIds: number[];
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
        level: 1
    };

    try {
        await setDoc(doc(db, "users", firebaseUser.uid), newUserProfile);
    } catch (error) {
        console.warn("Firestore error during signup:", error);
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            try {
                const docSnap = await getDoc(userDocRef);
                const authorizedEmails = getAuthorizedEmails();
                const isAuthorized = authorizedEmails.includes(firebaseUser.email?.toLowerCase() || '');
                
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
                        level: 1
                    };
                    await setDoc(userDocRef, initial);
                    setUser({ id: firebaseUser.uid, ...initial } as User);
                }
            } catch (err) {
                console.error("Auth state logic error:", err);
            }
        } else {
            setUser(null);
        }
        setLoading(false);
    });
    return () => unsubscribe();
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
        await updateDoc(doc(db, 'users', user.id), updatedFields);
    } catch(error) {
        handleFirestoreError(error, 'update user profile');
    }
  };

  const login = async (credentials: LoginCredentials) => {
    await signInWithEmailAndPassword(auth, credentials.email, credentials.password!);
    closeAuthModal();
  };

  const logout = async () => {
    await signOut(auth);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;

  return (
    <AuthContext.Provider value={{ 
        isLoggedIn: !!user, 
        user, 
        isAuthModalOpen, 
        openAuthModal, 
        closeAuthModal, 
        login, 
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
