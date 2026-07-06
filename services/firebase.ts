
import { initializeApp } from "firebase/app";
import { getFirestore, Firestore, setLogLevel, initializeFirestore } from "firebase/firestore";
import { getAuth, inMemoryPersistence, browserLocalPersistence, setPersistence, Auth } from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";

// Silence Firebase internal offline errors in test modes
setLogLevel('silent');

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

export const dbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = initializeFirestore(app, { experimentalForceLongPolling: true }, dbId); /* CRITICAL: The app will break without this line */

// Test connection
import('firebase/firestore').then(({ doc, getDocFromServer }) => {
  getDocFromServer(doc(db, 'test', 'connection')).catch((error) => {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration.");
    }
  });
}).catch(console.warn);

let authInstance: Auth | null = null;
try {
  authInstance = getAuth(app);
  // Attempt to set local persistence but fallback to memory if iframe blocks it
  setPersistence(authInstance, browserLocalPersistence).catch(() => {
    console.warn("Local persistence blocked (likely iframe restrictions), falling back to memory.");
    if (authInstance) setPersistence(authInstance, inMemoryPersistence).catch((err: any) => console.error(err?.message || String(err)));
  });
} catch (error: any) {
  console.error("Failed to initialize Auth", error?.message || String(error));
}

export const auth: Auth | null = authInstance;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export const handleFirestoreError = (error: any, operation: OperationType | string, path?: string | null) => {
    // Only log actual errors, ignore benign connection resets
    if (error?.code === 'unavailable' || error?.code === 'deadline-exceeded') return;
    
    // Pick safe properties to avoid circular reference crashes in the environment log handle
    const safeError = {
        code: error?.code || 'unknown',
        message: error?.message || String(error),
        operation,
        path: path || 'n/a'
    };
    
    console.error(`[Firestore Error] ${operation}:`, safeError);
};

