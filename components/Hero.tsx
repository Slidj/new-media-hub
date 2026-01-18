
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
      <div className="absolute top-0 left-0 w-full h-full">
        
        {/* Mobile: Vertical Poster (Smart Adaptability) */}
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
        
        {/* Gradients for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent hidden md:block"></div>
      </div>

      {/* Content Area */}
      <div className="relative z-20 h-full flex flex-col justify-end items-center md:items-start pb-20 md:pb-32 px-4 md:px-12 w-full">
            
            {/* Title / Logo Logic */}
            <div className="mb-4 md:mb-6 flex justify-center md:justify-start w-full transition-transform duration-700 hover:scale-105 origin-bottom">
                {movie.logoUrl ? (
                    <img 
                        src={movie.logoUrl} 
                        alt={movie.title} 
                        className="w-48 md:w-96 max-h-32 md:max-h-48 object-contain drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]"
                    />
                ) : (
                    <h1 className="text-4xl md:text-6xl font-black text-center md:text-left drop-shadow-xl uppercase tracking-tighter">
                      {movie.title}
                    </h1>
                )}
            </div>
            
            {/* Metadata (Tags) */}
            <div className="flex items-center gap-3 text-sm md:text-base font-medium mb-6 drop-shadow-md">
                <span className="text-[#46d369] font-bold">{movie.match}% {t.match}</span>
                <span>{movie.year}</span>
                <span className="bg-[#333] px-1.5 py-0.5 rounded text-xs border border-white/30">{movie.rating}</span>
                {movie.mediaType === 'tv' && (
                   <span className="border border-white/30 px-1.5 rounded text-xs">HD</span>
                )}
            </div>

            {/* Buttons - Compact & Centered on Mobile */}
            <div className="flex items-center justify-center md:justify-start gap-4">
              <button 
                onClick={onPlay}
                className="flex items-center gap-2 px-6 py-2 bg-white text-black font-bold rounded-[4px] hover:bg-white/90 transition active:scale-95"
              >
                <Play className="w-5 h-5 fill-black" />
                {t.play}
              </button>
              
              <button 
                onClick={onMoreInfo}
                className="flex items-center gap-2 px-6 py-2 bg-gray-500/70 text-white font-bold rounded-[4px] hover:bg-gray-500/50 transition active:scale-95 backdrop-blur-sm"
              >
                <Info className="w-5 h-5" />
                {t.moreInfo}
              </button>
            </div>
      </div>
    </div>
  );
};
