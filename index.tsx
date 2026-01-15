import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const init = () => {
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error("Could not find root element to mount to");
      return;
    }

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Application failed to start:", error);
    // Display error on screen for debugging if needed
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="color: white; padding: 20px; text-align: center; font-family: sans-serif;">
          <h1>Oops! Something went wrong.</h1>
          <p>The application failed to initialize. Check the browser console for details.</p>
        </div>
      `;
    }
  }
};

// Ensure the DOM is fully loaded before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}