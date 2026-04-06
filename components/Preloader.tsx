
import React from 'react';

export const Preloader: React.FC = () => {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'black' }}>
      <h1 style={{ color: '#E50914', fontSize: '48px', fontWeight: 'bold', fontFamily: 'sans-serif' }}>
        MEDIA HUB
      </h1>
    </div>
  );
};
