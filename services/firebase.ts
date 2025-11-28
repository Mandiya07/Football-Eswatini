
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";

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

// Initialize Firestore with persistent local cache settings.
// Removed experimentalForceLongPolling to allow auto-detection (WebSockets preferred) 
// which resolves "Backend didn't respond within 10 seconds" errors.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
});
