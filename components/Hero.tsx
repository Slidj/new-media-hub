
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
    <div className="relative h-screen w-full text-white overflow-hidden">
      {/* Background Image Container */}
      <div className="absolute top-0 left-0 w-full h-full">
        <img
          src={movie.bannerUrl}
          alt={movie.title}
          className="w-full h-full object-cover object-top"
        />
        
        {/* Dynamic Gradients (Netflix Style) */}
        {/* Left Side Shadow for Text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent opacity-90"></div>
        
        {/* Bottom Fade to main content */}
        <div className="absolute bottom-0 left-0 w-full h-[60%] bg-gradient-to-t from-black via-black/20 to-transparent"></div>
      </div>

      {/* Content Area */}
      <div className="relative z-40 h-full flex flex-col justify-end pb-[15vh] px-4 md:px-12 lg:max-w-3xl">
        
        {/* Genre Tags (Compact) */}
        <div className="flex items-center gap-2 text-sm md:text-base text-gray-200 mb-4 font-semibold drop-shadow-md">
            {movie.genre.slice(0, 3).map((g, i) => (
                <React.Fragment key={i}>
                    {i > 0 && <span className="text-gray-400 text-[8px] mx-1">●</span>}
                    <span className="uppercase tracking-widest">{g}</span>
                </React.Fragment>
            ))}
        </div>

        {/* Title / Logo */}
        <div className="mb-6">
            {movie.logoUrl ? (
                <img 
                    src={movie.logoUrl} 
                    alt={movie.title} 
                    className="w-full max-w-[400px] lg:max-w-[500px] max-h-[120px] lg:max-h-[220px] object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]"
                />
            ) : (
                <h1 className="text-5xl lg:text-8xl font-black drop-shadow-2xl tracking-tighter uppercase leading-none">
                  {movie.title}
                </h1>
            )}
        </div>
        
        {/* Info Row */}
        <div className="flex items-center gap-4 text-sm md:text-xl font-bold mb-6 drop-shadow-lg">
            <span className="text-[#46d369]">{movie.match}% {t.match}</span>
            <span className="text-gray-100">{movie.year}</span>
            <span className="bg-[#333]/80 px-2 py-0.5 rounded text-xs border border-gray-400/40 uppercase tracking-tighter">
              {movie.rating}
            </span>
            <span className="text-gray-100">{movie.duration}</span>
        </div>

        {/* Description - Clearly separated and limited width */}
        <p className="text-base md:text-lg lg:text-xl text-gray-200 line-clamp-3 md:line-clamp-4 drop-shadow-lg font-medium max-w-2xl leading-relaxed mb-8">
          {movie.description}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onPlay}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-white text-black font-bold rounded-[4px] hover:bg-white/80 transition-all active:scale-95 shadow-xl"
          >
            <Play className="w-6 h-6 fill-black" />
            <span className="text-lg uppercase tracking-tight">{t.play}</span>
          </button>
          
          <button 
            onClick={onMoreInfo}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-gray-500/40 text-white font-bold rounded-[4px] hover:bg-gray-500/60 transition-all active:scale-95 backdrop-blur-md border border-gray-400/20 shadow-xl"
          >
            <Info className="w-6 h-6" />
            <span className="text-lg uppercase tracking-tight">{t.moreInfo}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
