
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// FORCE CACHE CLEAR v6.1
const CURRENT_VERSION = '6.1';

const clearCacheSafe = async () => {
  try {
    const savedVersion = localStorage.getItem('app_version');
    if (savedVersion !== CURRENT_VERSION) {
      console.log(`New version detected: ${CURRENT_VERSION}. Clearing cache...`);
      
      // 1. Clear LocalStorage
      localStorage.clear();
      localStorage.setItem('app_version', CURRENT_VERSION);
      
      // 2. Unregister Service Workers (Aggressive Cache Killing) - SAFER IMPLEMENTATION
      if ('serviceWorker' in navigator) {
         try {
            navigator.serviceWorker.getRegistrations()
                .then(function(registrations) {
                    for(let registration of registrations) {
                        registration.unregister().catch(e => console.warn("SW unregister warn:", e));
                    }
                })
                .catch(err => {
                    console.warn("ServiceWorker cleanup skipped (environment restriction):", err);
                });
         } catch (e) {
             console.warn("ServiceWorker access denied:", e);
         }
      }

      // 3. Clear Session Storage
      sessionStorage.clear();
    }
  } catch (e) {
    console.error("Cache clear failed", e);
  }
};

// Run cache clear
clearCacheSafe();

// Immediate Telegram initialization
if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
  try {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
  } catch (e) {
      console.warn("Telegram Init Warning:", e);
  }
}

const renderError = (message: string, stack?: string) => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="background: #000; color: #fff; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; font-family: sans-serif; text-align: center;">
        <h1 style="color: #E50914; font-size: 24px; margin-bottom: 10px;">Initialization Error v6.1</h1>
        <p style="color: #ccc; margin-bottom: 20px;">${message}</p>
        <pre style="background: #111; padding: 10px; border-radius: 5px; font-size: 10px; text-align: left; overflow: auto; max-width: 100%; color: #888;">${stack || 'No stack trace available'}</pre>
        <button onclick="localStorage.clear(); window.location.reload()" style="background: #E50914; color: white; border: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; cursor: pointer;">Force Reset</button>
      </div>
    `;
  }
};

const init = () => {
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error("Target container 'root' not found in HTML.");
    }

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error: any) {
    console.error("Critical boot error:", error);
    renderError(error.message, error.stack);
  }
};

// Global error listener for unhandled exceptions
window.onerror = (message, source, lineno, colno, error) => {
  // Suppress specific resize loop errors or harmless warnings
  if (message.toString().includes('ResizeObserver')) return true;
  
  renderError(message.toString(), error?.stack);
  return false;
};

// Handle Unhandled Rejections globally to prevent white screen crashes
window.onunhandledrejection = (event) => {
    console.warn("Unhandled Promise Rejection:", event.reason);
    // Prevent default console error logging if desired, but keeping it usually helps debugging.
    // We do NOT render the error screen here because usually these are non-fatal (like the SW error).
};

// Start application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
