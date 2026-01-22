
import React from 'react';
import { Play, Info } from 'lucide-react';
import { Movie } from '../types';
import { Language, translations } from '../utils/translations';

interface HeroProps {
  movie: Movie;
  onMoreInfo: () => void;
  onPlay: () => void;
  lang: Language;
}

export const Hero: React.FC<HeroProps> = ({ movie, onMoreInfo, onPlay, lang }) => {
  const t = translations[lang];

  return (
    <div className="relative h-[75vh] md:h-[90vh] w-full text-white overflow-hidden bg-black">
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0">
        
        {/* Mobile: Vertical Poster */}
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="block md:hidden w-full h-full object-cover object-center"
        />

        {/* Desktop: Horizontal Banner */}
        <img
          src={movie.bannerUrl}
          alt={movie.title}
          className="hidden md:block w-full h-full object-cover object-top"
        />
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
        
        {/* Desktop Side Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent hidden md:block pointer-events-none"></div>

        {/* BOTTOM GRADIENT: Small, just to blend into the list below */}
        <div className="absolute bottom-0 left-0 w-full h-28 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none z-10"></div>
      </div>

      {/* Content Area - Z-20 ensures it is above the gradients */}
      <div className="relative z-20 h-full flex flex-col justify-end items-center md:items-start pb-12 px-4 md:px-12 w-full">
            
            {/* Title / Logo */}
            <div className="mb-6 flex justify-center md:justify-start w-full">
                {movie.logoUrl ? (
                    <img 
                        src={movie.logoUrl} 
                        alt={movie.title} 
                        className="w-64 md:w-[500px] max-h-40 md:max-h-64 object-contain drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]"
                    />
                ) : (
                    <h1 className="text-4xl md:text-7xl font-black text-center md:text-left drop-shadow-2xl uppercase tracking-tighter leading-none">
                      {movie.title}
                    </h1>
                )}
            </div>
            
            {/* Buttons - Fully clickable */}
            <div className="flex items-center justify-center md:justify-start gap-4 w-full md:w-auto">
              <button 
                onClick={onPlay}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-white text-black font-bold rounded-[4px] hover:bg-white/90 transition active:scale-95 shadow-[0_4px_15px_rgba(0,0,0,0.5)] z-30"
              >
                <Play className="w-6 h-6 md:w-8 md:h-8 fill-black" />
                <span className="text-lg md:text-xl">{t.play}</span>
              </button>
              
              <button 
                onClick={onMoreInfo}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-gray-500/40 text-white font-bold rounded-[4px] hover:bg-gray-500/30 transition active:scale-95 backdrop-blur-md border border-white/10 z-30"
              >
                <Info className="w-6 h-6 md:w-8 md:h-8" />
                <span className="text-lg md:text-xl">{t.moreInfo}</span>
              </button>
            </div>
      </div>
    </div>
  );
};
