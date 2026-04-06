
import React from 'react';

export const Preloader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-black">
      <div className="text-center">
        <h1 className="text-6xl md:text-8xl font-bebas tracking-normal text-[#E50914] uppercase drop-shadow-logo flex items-center justify-center gap-3" style={{ color: '#E50914' }}>
          MEDIA HUB
        </h1>
      </div>
    </div>
  );
};
