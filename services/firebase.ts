// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// This side-effect import is CRUCIAL. It registers the Firestore service.
import "firebase/firestore";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

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

// Initialize and export other services
export const db = getFirestore(app);

// Enable offline persistence for Firestore.
// This must be done after getFirestore() is called.
enableIndexedDbPersistence(db)
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            // This can happen if you have multiple tabs open, as persistence can only be
            // enabled in one tab at a time.
            console.warn("Firestore persistence failed: multiple tabs open or other initialization issue.");
        } else if (err.code === 'unimplemented') {
            // The current browser does not support all of the features required to enable persistence
            console.warn("Firestore persistence is not supported in this browser.");
        }
    });