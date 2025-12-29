
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
// FIX: Corrected import name to CartProvider as it is named in CartContext.tsx to resolve compilation error on line 6.
import { CartProvider } from './contexts/CartContext'; 

// Emergency Cache Purge Function for Console Access
(window as any).purgeCache = async () => {
    console.log("Starting nuclear cache purge...");
    localStorage.clear();
    sessionStorage.clear();
    if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
    }
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
    }
    console.log("Purge complete. Reloading...");
    window.location.reload();
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      {/* FIX: Wrapped App component with CartProvider to provide cart state globally and prevent runtime errors in components using useCart. */}
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
);
