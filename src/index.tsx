import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { makePlain } from '../services/utils';

// Intercept console functions to prevent passing circular objects to the environment logger
['log', 'warn', 'error', 'info'].forEach(method => {
  const original = (console as any)[method];
  (console as any)[method] = (...args: any[]) => {
    try {
      const sanitizedArgs = args.map(arg => {
        if (arg instanceof Error) {
          // Flatten generic error objects rather than using makePlain which might turn it into '[Object: TypeError]'
          return { name: arg.name, message: arg.message, stack: arg.stack, ...(arg as any) };
        }
        return makePlain(arg);
      });
      original.apply(console, sanitizedArgs);
    } catch (e) {
      original("Logging error interception failed.", e);
      original.apply(console, args); // Fallback
    }
  };
});

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: any, info: any) { console.error("CRASH:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#fee2e2', color: '#991b1b', fontFamily: 'sans-serif' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Application Error</h1>
          <p>The application crashed. This is the Error Boundary catching it.</p>
          <pre style={{ marginTop: '10px', background: '#fef2f2', padding: '10px', borderRadius: '4px', overflowX: 'auto' }}>
            {this.state.error?.message}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px', padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
} else {
  console.error("ROOT NOT FOUND");
}

// Register PWA Service Worker
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.error('[PWA] Service Worker registration failed:', err);
      });
  });
}

// Global PWA Installation Prompt Capture
let deferredPrompt: any = null;

window.addEventListener('beforeinstallprompt', (e: any) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
  // Dispatch custom event so React components can listen
  window.dispatchEvent(new CustomEvent('pwa-prompt-available', { detail: e }));
});

// Expose install function globally
(window as any).installPWA = async () => {
  if (deferredPrompt) {
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] User response to install prompt: ${outcome}`);
      deferredPrompt = null;
      window.dispatchEvent(new CustomEvent('pwa-prompt-used'));
      return outcome === 'accepted';
    } catch (err) {
      console.error('[PWA] Error showing install prompt:', err);
      return false;
    }
  }
  return false;
};

// Expose installable status check
(window as any).isPWAInstallable = () => {
  return !!deferredPrompt;
};


