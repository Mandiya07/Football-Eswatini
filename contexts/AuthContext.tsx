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

// Initialize auth here
const auth = getAuth(app);

export interface User {
  id: string; // Firebase UID
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'club_admin' | 'super_admin';
  club?: string; // Club they manage
  favoriteTeamIds: number[];
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const signup = async (credentials: RegisterCredentials) => {
    const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password!);
    const firebaseUser = userCredential.user;
    
    let userRole: User['role'] = 'user';
    let userClub: string | undefined = undefined;

    // Special rule for demo purposes to create admin/club users
    if (firebaseUser.email === 'admin@eswatini.football') {
        userRole = 'super_admin';
    } else if (firebaseUser.email === 'club@eswatini.football') {
        userRole = 'club_admin';
        userClub = 'Mbabane Swallows'; // Assign a default club for the demo
    }

    // Create user profile in Firestore
    const newUserProfile: Omit<User, 'id'> = {
        name: credentials.name,
        email: firebaseUser.email!,
        avatar: `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
        role: userRole,
        club: userClub,
        favoriteTeamIds: [],
    };

    await setDoc(doc(db, "users", firebaseUser.uid), newUserProfile);
    setUser({ id: firebaseUser.uid, ...newUserProfile });
    closeAuthModal();
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            // Enforce roles for special demo accounts on every login to self-correct potential DB errors
            let expectedRole: User['role'] | null = null;
            let expectedClub: string | undefined = undefined;

            if (firebaseUser.email === 'admin@eswatini.football') {
                expectedRole = 'super_admin';
            } else if (firebaseUser.email === 'club@eswatini.football') {
                expectedRole = 'club_admin';
                expectedClub = 'Mbabane Swallows';
            }

            if (userDocSnap.exists()) {
                const userDataFromDb = userDocSnap.data();
                let needsUpdate = false;
                const updates: Partial<User> = {};

                if (expectedRole && userDataFromDb.role !== expectedRole) {
                    updates.role = expectedRole;
                    needsUpdate = true;
                }
                if (expectedClub && userDataFromDb.club !== expectedClub) {
                    updates.club = expectedClub;
                    needsUpdate = true;
                }

                const plainUser = {
                    name: userDataFromDb.name,
                    email: userDataFromDb.email,
                    avatar: userDataFromDb.avatar,
                    role: userDataFromDb.role,
                    club: userDataFromDb.club,
                    favoriteTeamIds: userDataFromDb.favoriteTeamIds || [],
                };
                
                // Immediately set the user state with the corrected role
                const finalUser = { id: firebaseUser.uid, ...plainUser, ...updates } as User;
                setUser(finalUser);
                
                // Asynchronously update the database if a correction was needed
                if (needsUpdate) {
                    try {
                        await updateDoc(userDocRef, updates);
                    } catch (error) {
                        handleFirestoreError(error, 'auto-correct user role');
                    }
                }
            } else {
                // This block handles first-time sign-in if a user exists in Auth but not Firestore
                const newUserProfile: Omit<User, 'id'> = {
                    name: firebaseUser.displayName || 'New User',
                    email: firebaseUser.email!,
                    avatar: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
                    role: expectedRole || 'user',
                    club: expectedClub,
                    favoriteTeamIds: [],
                };
                await setDoc(userDocRef, newUserProfile);
                setUser({ id: firebaseUser.uid, ...newUserProfile });
            }
        } else {
            setUser(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const updateUser = async (updatedFields: Partial<User>) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.id);
    try {
        await updateDoc(userDocRef, updatedFields);
        setUser(prevUser => prevUser ? { ...prevUser, ...updatedFields } : null);
    } catch(error) {
        handleFirestoreError(error, 'update user profile');
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
        await signInWithEmailAndPassword(auth, credentials.email, credentials.password!);
        closeAuthModal();
    } catch (error) {
        const firebaseError = error as { code?: string };
        const isSpecialUser = credentials.email === 'admin@eswatini.football' || credentials.email === 'club@eswatini.football';

        // If user not found and it's a special demo email, create the account on-the-fly (upsert logic)
        if (firebaseError.code === 'auth/user-not-found' && isSpecialUser) {
            console.log(`Special user ${credentials.email} not found. Creating account...`);
            const name = credentials.email === 'admin@eswatini.football' ? 'Admin User' : 'Club Admin';
            // The signup function handles role assignment and closing the modal
            await signup({
                name: name,
                email: credentials.email,
                password: credentials.password,
            });
        } else {
            // Re-throw other errors to be handled by the UI
            throw error;
        }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen bg-eswatini-pattern">
            <Spinner />
        </div>
    );
  }
  
  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, isAuthModalOpen, openAuthModal, closeAuthModal, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
