
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
    <div className="relative h-screen w-full text-white overflow-hidden bg-black">
      {/* Background Image Container - Forced Full Width */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <img
          src={movie.bannerUrl}
          alt={movie.title}
          className="w-full h-full object-cover object-top scale-105" // scale-105 prevents sub-pixel gaps/borders
        />
        
        {/* Dynamic Gradients (Netflix Style) */}
        {/* Left Side Shadow for Text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent opacity-80"></div>
        
        {/* Bottom Fade to main content - Stronger for better blending */}
        <div className="absolute bottom-0 left-0 w-full h-[70%] bg-gradient-to-t from-black via-black/40 to-transparent"></div>
      </div>

      {/* Content Area */}
      <div className="relative z-40 h-full flex flex-col justify-end pb-[12vh] px-4 md:px-12 w-full max-w-full">
        
        {/* Title / Logo - Positioned higher to look better without description */}
        <div className="mb-8">
            {movie.logoUrl ? (
                <img 
                    src={movie.logoUrl} 
                    alt={movie.title} 
                    className="w-full max-w-[350px] md:max-w-[500px] max-h-[140px] md:max-h-[240px] object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.9)]"
                />
            ) : (
                <h1 className="text-5xl md:text-8xl font-black drop-shadow-2xl tracking-tighter uppercase leading-none italic">
                  {movie.title}
                </h1>
            )}
        </div>
        
        {/* Minimal Info Row */}
        <div className="flex items-center gap-4 text-sm md:text-xl font-bold mb-8 drop-shadow-lg bg-black/10 backdrop-blur-[2px] w-fit px-3 py-1 rounded-sm border border-white/5">
            <span className="text-[#46d369]">{movie.match}% {t.match}</span>
            <span className="text-gray-100">{movie.year}</span>
            <span className="bg-[#333]/80 px-2 py-0.5 rounded text-xs border border-gray-400/40 uppercase tracking-tighter">
              {movie.rating}
            </span>
            <span className="text-gray-100">{movie.duration}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onPlay}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-white text-black font-bold rounded-[4px] hover:bg-white/80 transition-all active:scale-95 shadow-2xl"
          >
            <Play className="w-6 h-6 fill-black" />
            <span className="text-lg uppercase tracking-tight">{t.play}</span>
          </button>
          
          <button 
            onClick={onMoreInfo}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-gray-500/40 text-white font-bold rounded-[4px] hover:bg-gray-500/60 transition-all active:scale-95 backdrop-blur-md border border-gray-400/20 shadow-2xl"
          >
            <Info className="w-6 h-6" />
            <span className="text-lg uppercase tracking-tight">{t.moreInfo}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
