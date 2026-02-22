
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeFirestore, memoryLocalCache, setLogLevel } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCXyZ65n3Tk120LcvVY0MH1XgvAVu4Qk3Y",
  authDomain: "football-eswatini.firebaseapp.com",
  projectId: "football-eswatini",
  storageBucket: "football-eswatini.firebasestorage.app",
  messagingSenderId: "5006077401",
  appId: "1:5006077401:web:75e9ae4f364f2132703dc8"
};

// Initialize Firebase and export the app instance
export const app = initializeApp(firebaseConfig);

/**
 * Initialize Firestore with settings optimized for web-based development environments
 * and potentially restricted network conditions.
 * 
 * 1. memoryLocalCache: Bypasses IndexedDB initialization which can hang or timeout in sandboxed frames.
 * 2. experimentalForceLongPolling: Ensures connectivity even if WebSockets are blocked by proxies.
 * 3. experimentalAutoDetectLongPolling: Set to false to strictly enforce the long polling protocol.
 * 4. useFetchStreams: false. Disables Fetch Streams, which can cause hangs in certain browser configurations.
 * 5. host: Explicitly set to ensure the global endpoint is targeted.
 */
setLogLevel('error');

export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
  host: 'firestore.googleapis.com',
  ssl: true,
  experimentalForceLongPolling: true,
  experimentalAutoDetectLongPolling: false,
  ignoreUndefinedProperties: true,
  // @ts-ignore - useFetchStreams is valid but might not be in the current type definition
  useFetchStreams: false
} as any);
