
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
    <div className="relative h-[80vh] md:h-screen w-full text-white overflow-hidden bg-black">
      {/* Background Image Container */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-10">
        <img
          src={movie.bannerUrl}
          alt={movie.title}
          className="w-full h-full object-cover object-top md:scale-105"
        />
        
        {/* Dynamic Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-[70%] bg-gradient-to-t from-black via-black/40 to-transparent"></div>
      </div>

      {/* Content Area - Adjusted pt for standard header */}
      <div className="relative z-40 h-full flex flex-col justify-end items-center pb-24 md:pb-[20vh] px-4 md:px-12 w-full max-w-full pointer-events-none pt-32">
        
        {/* Wrapper for centered content */}
        <div className="pointer-events-auto flex flex-col items-center text-center max-w-xl">
            {/* Title / Logo */}
            <div className="mb-6 md:mb-10 flex justify-center transform transition-transform duration-700 hover:scale-105">
                {movie.logoUrl ? (
                    <img 
                        src={movie.logoUrl} 
                        alt={movie.title} 
                        className="w-full max-w-[260px] md:max-w-[500px] max-h-[140px] md:max-h-[260px] object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)]"
                    />
                ) : (
                    <h1 className="text-4xl md:text-8xl font-black drop-shadow-2xl tracking-tighter uppercase leading-none">
                      {movie.title}
                    </h1>
                )}
            </div>
            
            {/* Minimal Info Row */}
            <div className="flex items-center justify-center gap-3 md:gap-5 text-sm md:text-xl font-bold mb-8 md:mb-10 drop-shadow-lg">
                <span className="text-[#46d369]">{movie.match}% {t.match}</span>
                <span className="text-gray-200">{movie.year}</span>
                <span className="bg-[#333]/90 px-2 py-0.5 rounded text-[10px] md:text-xs border border-gray-500/50 uppercase tracking-widest">
                  {movie.rating}
                </span>
                <span className="text-gray-200">{movie.duration}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 md:gap-4 w-full">
              <button 
                onClick={onPlay}
                className="flex items-center justify-center gap-2 px-8 md:px-12 py-3 md:py-4 bg-white text-black font-bold rounded-[4px] hover:bg-white/90 transition-all active:scale-95 shadow-xl min-w-[140px] md:min-w-[180px]"
              >
                <Play className="w-5 h-5 md:w-6 md:h-6 fill-black" />
                <span className="text-base md:text-lg uppercase tracking-tight">{t.play}</span>
              </button>
              
              <button 
                onClick={onMoreInfo}
                className="flex items-center justify-center gap-2 px-8 md:px-12 py-3 md:py-4 bg-gray-500/40 text-white font-bold rounded-[4px] hover:bg-gray-500/60 transition-all active:scale-95 backdrop-blur-md border border-gray-400/20 shadow-xl min-w-[140px] md:min-w-[180px]"
              >
                <Info className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-base md:text-lg uppercase tracking-tight">{t.moreInfo}</span>
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};
