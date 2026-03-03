
import React from 'react';

export const Preloader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-black">
      <div className="animate-splash-zoom text-center">
        <h1 className="text-6xl md:text-8xl font-bebas tracking-normal text-transparent bg-clip-text uppercase drop-shadow-logo flex items-center justify-center gap-3 bg-gradient-to-b from-[#E50914] to-[#B20710]">
          MEDIA HUB
        </h1>
      </div>
    </div>
  );
};
