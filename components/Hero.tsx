
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
        
        {/* Mobile Image: Vertical Poster */}
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="block md:hidden w-full h-full object-cover object-center animate-in fade-in duration-700"
        />

        {/* Desktop Image: Horizontal Banner */}
        <img
          src={movie.bannerUrl}
          alt={movie.title}
          className="hidden md:block w-full h-full object-cover object-top md:scale-105 animate-in fade-in duration-700"
        />
        
        {/* Dynamic Gradients - Adjusted for better readability on vertical posters */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#000000] opacity-90 md:opacity-100"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/20 to-transparent hidden md:block"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#000000] via-black/60 to-transparent md:hidden"></div>
      </div>

      {/* Content Area - Adjusted pt for standard header */}
      <div className="relative z-40 h-full flex flex-col justify-end items-center md:items-start pb-24 md:pb-[25vh] px-6 md:px-16 w-full max-w-full pointer-events-none pt-32">
        
        {/* Wrapper for content */}
        <div className="pointer-events-auto flex flex-col items-center md:items-start text-center md:text-left max-w-2xl">
            {/* Title / Logo */}
            <div className="mb-4 md:mb-8 flex justify-center md:justify-start transform transition-transform duration-700 hover:scale-105">
                {movie.logoUrl ? (
                    <img 
                        src={movie.logoUrl} 
                        alt={movie.title} 
                        className="w-full max-w-[200px] md:max-w-[500px] max-h-[120px] md:max-h-[260px] object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)]"
                    />
                ) : (
                    <h1 className="text-3xl md:text-7xl font-black drop-shadow-2xl tracking-tighter uppercase leading-none text-balance">
                      {movie.title}
                    </h1>
                )}
            </div>
            
            {/* Minimal Info Row */}
            <div className="flex items-center justify-center md:justify-start gap-3 md:gap-5 text-sm md:text-xl font-bold mb-6 md:mb-8 drop-shadow-lg">
                <span className="text-[#46d369]">{movie.match}% {t.match}</span>
                <span className="text-gray-200">{movie.year}</span>
                <span className="bg-[#333]/90 px-2 py-0.5 rounded text-[10px] md:text-xs border border-gray-500/50 uppercase tracking-widest">
                  {movie.rating}
                </span>
                {/* Duration hidden on mobile to save space, shown on desktop */}
                <span className="text-gray-200 hidden md:inline">{movie.duration}</span>
                {movie.mediaType === 'tv' && (
                  <span className="border border-gray-500 px-1.5 rounded text-[10px] md:text-xs text-gray-300">HD</span>
                )}
            </div>

            {/* Description - Desktop only */}
            <p className="hidden md:block text-lg text-gray-200 drop-shadow-md mb-8 line-clamp-3 max-w-xl">
              {movie.description}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-center md:justify-start gap-3 md:gap-4 w-full">
              <button 
                onClick={onPlay}
                className="flex items-center justify-center gap-2 px-6 md:px-10 py-2.5 md:py-3.5 bg-white text-black font-bold rounded-[4px] hover:bg-white/90 transition-all active:scale-95 shadow-xl w-full md:w-auto"
              >
                <Play className="w-5 h-5 md:w-7 md:h-7 fill-black" />
                <span className="text-base md:text-xl uppercase tracking-tight">{t.play}</span>
              </button>
              
              <button 
                onClick={onMoreInfo}
                className="flex items-center justify-center gap-2 px-6 md:px-10 py-2.5 md:py-3.5 bg-gray-500/40 text-white font-bold rounded-[4px] hover:bg-gray-500/60 transition-all active:scale-95 backdrop-blur-md border border-gray-400/20 shadow-xl w-full md:w-auto"
              >
                <Info className="w-5 h-5 md:w-7 md:h-7" />
                <span className="text-base md:text-xl uppercase tracking-tight">{t.moreInfo}</span>
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};
