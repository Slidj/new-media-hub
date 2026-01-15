
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
    <div className="relative h-[75vh] md:h-screen w-full text-white overflow-hidden bg-black">
      {/* Background Image Container */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-10">
        <img
          src={movie.bannerUrl}
          alt={movie.title}
          className="w-full h-full object-cover object-top md:scale-105"
        />
        
        {/* Dynamic Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent opacity-80"></div>
        <div className="absolute bottom-0 left-0 w-full h-[70%] bg-gradient-to-t from-black via-black/60 to-transparent"></div>
      </div>

      {/* Content Area - Higher z-index than the grid to ensure buttons are on top */}
      <div className="relative z-40 h-full flex flex-col justify-end pb-24 md:pb-[35vh] px-4 md:px-12 w-full max-w-full pointer-events-none">
        
        {/* All interactive elements inside need pointer-events-auto */}
        <div className="pointer-events-auto">
            {/* Title / Logo */}
            <div className="mb-6 md:mb-8">
                {movie.logoUrl ? (
                    <img 
                        src={movie.logoUrl} 
                        alt={movie.title} 
                        className="w-full max-w-[260px] md:max-w-[500px] max-h-[100px] md:max-h-[240px] object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.9)]"
                    />
                ) : (
                    <h1 className="text-4xl md:text-8xl font-black drop-shadow-2xl tracking-tighter uppercase leading-none italic">
                      {movie.title}
                    </h1>
                )}
            </div>
            
            {/* Minimal Info Row */}
            <div className="flex items-center gap-3 md:gap-4 text-xs md:text-xl font-bold mb-6 md:mb-8 drop-shadow-lg bg-black/10 backdrop-blur-[2px] w-fit px-3 py-1 rounded-sm border border-white/5">
                <span className="text-[#46d369]">{movie.match}% {t.match}</span>
                <span className="text-gray-100">{movie.year}</span>
                <span className="bg-[#333]/80 px-2 py-0.5 rounded text-[10px] md:text-xs border border-gray-400/40 uppercase tracking-tighter">
                  {movie.rating}
                </span>
                <span className="text-gray-100">{movie.duration}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 md:gap-4">
              <button 
                onClick={onPlay}
                className="flex items-center justify-center gap-2 px-5 md:px-8 py-2 md:py-3 bg-white text-black font-bold rounded-[4px] hover:bg-white/80 transition-all active:scale-95 shadow-2xl"
              >
                <Play className="w-5 h-5 md:w-6 md:h-6 fill-black" />
                <span className="text-sm md:text-lg uppercase tracking-tight">{t.play}</span>
              </button>
              
              <button 
                onClick={onMoreInfo}
                className="flex items-center justify-center gap-2 px-5 md:px-8 py-2 md:py-3 bg-gray-500/40 text-white font-bold rounded-[4px] hover:bg-gray-500/60 transition-all active:scale-95 backdrop-blur-md border border-gray-400/20 shadow-2xl"
              >
                <Info className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-sm md:text-lg uppercase tracking-tight">{t.moreInfo}</span>
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};
