
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// FORCE CACHE CLEAR v9.0
const CURRENT_VERSION = '9.0';

const clearCacheSafe = async () => {
  try {
    const savedVersion = localStorage.getItem('app_version');
    if (savedVersion !== CURRENT_VERSION) {
      console.log(`New version detected: ${CURRENT_VERSION}. Clearing cache...`);
      localStorage.clear();
      localStorage.setItem('app_version', CURRENT_VERSION);
      if ('serviceWorker' in navigator) {
         try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for(let registration of registrations) {
                await registration.unregister();
            }
         } catch (e) {
             console.debug("SW cleanup skipped (restricted environment)");
         }
      }
      sessionStorage.clear();
    }
  } catch (e) {
    console.error("Cache clear failed", e);
  }
};

clearCacheSafe();

if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
  try {
      window.Telegram.WebApp.ready();
      
      // Request Fullscreen if supported (v8.0+), otherwise expand
      if (window.Telegram.WebApp.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('8.0') && window.Telegram.WebApp.requestFullscreen) {
          window.Telegram.WebApp.requestFullscreen();
      } else if (window.Telegram.WebApp.expand) {
          window.Telegram.WebApp.expand();
      }
  } catch (e) {
      console.warn("Telegram Init Warning:", e);
  }
}

const renderError = (message: string, stack?: string) => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="background: #000; color: #fff; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; font-family: sans-serif; text-align: center;">
        <h1 style="color: #E50914; font-size: 24px; margin-bottom: 10px;">Initialization Error v9.0</h1>
        <p style="color: #ccc; margin-bottom: 20px;">${message}</p>
        <pre style="background: #111; padding: 10px; border-radius: 5px; font-size: 10px; text-align: left; overflow: auto; max-width: 100%; color: #888;">${stack || 'No stack trace available'}</pre>
        <button onclick="localStorage.clear(); window.location.reload()" style="background: #E50914; color: white; border: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; cursor: pointer;">Force Reset</button>
      </div>
    `;
  }
};

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("React ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: '#000', color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 99999 }}>
          <h1 style={{ color: '#E50914', fontSize: '24px', marginBottom: '10px' }}>React Render Error</h1>
          <p style={{ color: '#ccc', marginBottom: '20px' }}>{this.state.error?.message}</p>
          <pre style={{ background: '#111', padding: '10px', borderRadius: '5px', fontSize: '10px', textAlign: 'left', overflow: 'auto', maxWidth: '100%', color: '#888' }}>
            {this.state.error?.stack || 'No stack trace'}
          </pre>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ background: '#E50914', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>
            Force Reset
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const init = () => {
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error("Target container 'root' not found in HTML.");
    }

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );

    console.log("App initialized successfully");
  } catch (error: any) {
    console.error("Critical boot error:", error);
    renderError(error.message, error.stack);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
