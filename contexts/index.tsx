
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext'; 
import { terminate, clearIndexedDbPersistence } from 'firebase/firestore';
import { db } from './services/firebase';

// Emergency Cache Purge Function for Console Access
(window as any).purgeCache = async () => {
    console.log("Starting nuclear cache and database purge...");
    
    try {
        // 1. Terminate and clear Firestore persistence safely
        console.log("Shutting down database link...");
        await terminate(db).catch(() => {});
        // Note: clearIndexedDbPersistence only works if using disk persistence, 
        // but safe to call even with memoryLocalCache.
        await clearIndexedDbPersistence(db).catch(() => {});
    } catch (e) {
        console.warn("Firestore cleanup skipped or already closed", e);
    }

    // 2. Clear All Storage
    console.log("Wiping local session data...");
    localStorage.clear();
    sessionStorage.clear();

    // 3. Clear Caches API
    if ('caches' in window) {
        console.log("Invalidating service worker cache...");
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
    }

    // 4. Unregister Service Workers
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
    }

    // 5. Clear Cookies for this domain
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }

    console.log("Purge complete. Reloading in 1 second...");
    setTimeout(() => window.location.reload(), 1000);
};

// Auto-reload when new service worker takes over
if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
);
