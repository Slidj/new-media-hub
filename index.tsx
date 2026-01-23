
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// FORCE CACHE CLEAR v6.2
const CURRENT_VERSION = '6.2';

const clearCacheSafe = async () => {
  try {
    const savedVersion = localStorage.getItem('app_version');
    // Always clear if version mismatch OR if no version stored
    if (savedVersion !== CURRENT_VERSION) {
      console.log(`New version detected: ${CURRENT_VERSION}. Clearing cache...`);
      
      // 1. Clear LocalStorage
      localStorage.clear();
      localStorage.setItem('app_version', CURRENT_VERSION);
      
      // 2. Unregister Service Workers (Silent Mode)
      if ('serviceWorker' in navigator) {
         try {
            // We use await here inside try/catch to silently handle "invalid state" errors
            // typical in restricted iframe/webview environments like Telegram
            const registrations = await navigator.serviceWorker.getRegistrations();
            for(let registration of registrations) {
                await registration.unregister();
            }
         } catch (e) {
             // Intentionally empty or debug only - this error is expected in WebApps
             console.debug("SW cleanup skipped (restricted environment)");
         }
      }

      // 3. Clear Session Storage
      sessionStorage.clear();
      
      // Optional: Force reload if we just cleared cache to ensure clean state
      // window.location.reload(); 
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
        <h1 style="color: #E50914; font-size: 24px; margin-bottom: 10px;">Initialization Error v6.2</h1>
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
    // Just log warning, do not crash app for background promise failures
    console.warn("Unhandled Promise Rejection:", event.reason);
};

// Start application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
