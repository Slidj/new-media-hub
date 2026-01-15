import React from 'react';

export const Preloader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
      <div className="animate-splash-zoom text-center">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-[#E50914] uppercase drop-shadow-2xl font-sans">
          MEDIA HUB
        </h1>
      </div>
    </div>
  );
};