import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Immediate Telegram initialization
if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
}

const renderError = (message: string, stack?: string) => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="background: #000; color: #fff; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; font-family: sans-serif; text-align: center;">
        <h1 style="color: #E50914; font-size: 24px; margin-bottom: 10px;">Initialization Error</h1>
        <p style="color: #ccc; margin-bottom: 20px;">${message}</p>
        <pre style="background: #111; padding: 10px; border-radius: 5px; font-size: 10px; text-align: left; overflow: auto; max-width: 100%; color: #888;">${stack || 'No stack trace available'}</pre>
        <button onclick="window.location.reload()" style="background: #E50914; color: white; border: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; cursor: pointer;">Retry</button>
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
  renderError(message.toString(), error?.stack);
  return false;
};

// Start application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}