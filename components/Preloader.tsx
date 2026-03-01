
import React, { useState, useEffect } from 'react';

export const Preloader: React.FC = () => {
  const [logoIcon, setLogoIcon] = useState('');

  useEffect(() => {
    let unsubscribe = () => {};
    import('../services/firebase').then(({ subscribeToGlobalSettings }) => {
        unsubscribe = subscribeToGlobalSettings((settings) => {
            if (settings?.logoIcon !== undefined) {
                setLogoIcon(settings.logoIcon);
            }
        });
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center overflow-hidden">
      <div className="animate-splash-zoom text-center">
        <h1 className="text-6xl md:text-8xl font-bebas tracking-normal text-transparent bg-clip-text bg-gradient-to-b from-[#E50914] to-[#B20710] uppercase drop-shadow-logo flex items-center justify-center gap-3">
          MEDIA HUB
          {logoIcon && <span className="text-5xl md:text-7xl drop-shadow-none">{logoIcon}</span>}
        </h1>
      </div>
    </div>
  );
};
