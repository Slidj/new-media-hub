
import React from 'react';

export const Preloader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-black">
      <div className="text-center flex flex-col items-center">
        <h1 className="text-6xl md:text-8xl font-bebas tracking-widest uppercase drop-shadow-logo cinematic-text mb-4">
          MEDIA HUB
        </h1>
        <div className="w-48 md:w-64">
          <div className="cinematic-progress"></div>
        </div>
      </div>
    </div>
  );
};
