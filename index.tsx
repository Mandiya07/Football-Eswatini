
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
        // 1. Terminate and clear Firestore persistence
        await terminate(db);
        await clearIndexedDbPersistence(db);
    } catch (e) {
        console.warn("Firestore cleanup skipped or already closed", e);
    }

    // 2. Clear Browser Storage
    localStorage.clear();
    sessionStorage.clear();

    // 3. Clear Caches API
    if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
    }

    // 4. Unregister Service Workers
    if ('serviceWorker' in navigator) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(reg => reg.unregister()));
        } catch (e) {
            console.warn("Service worker unregistration failed or document state invalid", e);
        }
    }

    console.log("Purge complete. Reloading...");
    window.location.reload();
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
