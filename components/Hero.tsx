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
    <div className="relative h-[80vh] md:h-[95vh] w-full text-white">
      {/* Background Image - Mobile (Poster) - Fallback to banner if poster fails or design pref */}
      <div className="absolute top-0 left-0 w-full h-full md:hidden">
        <img
          src={movie.posterUrl || movie.bannerUrl}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        {/* Mobile Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent via-60% to-black"></div>
      </div>

      {/* Background Image - Desktop (Banner) */}
      <div className="hidden md:block absolute top-0 left-0 w-full h-full">
        <img
          src={movie.bannerUrl}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        {/* Desktop Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent opacity-90"></div>
        <div className="absolute bottom-0 left-0 w-full h-44 bg-gradient-to-t from-black to-transparent"></div>
      </div>

      {/* Content - Increased Z-Index to 40 to ensure it sits ABOVE the negative margin list section */}
      <div className="absolute bottom-0 left-0 w-full p-6 lg:top-[25%] lg:left-14 lg:bottom-auto lg:max-w-xl flex flex-col items-center lg:items-start text-center lg:text-left space-y-4 pb-14 md:pb-0 z-40 pointer-events-none">
        
        {/* Genre Tags (Mobile Only - visible below LG) */}
        <div className="flex lg:hidden items-center gap-2 text-sm text-gray-200 mb-2 pointer-events-auto">
            {movie.genre.slice(0, 3).map((g, i) => (
                <React.Fragment key={i}>
                    {i > 0 && <span className="text-gray-400 text-[8px] mx-1">●</span>}
                    <span>{g}</span>
                </React.Fragment>
            ))}
        </div>

        {/* Title or Logo */}
        <div className="pointer-events-auto">
            {movie.logoUrl ? (
                <img 
                    src={movie.logoUrl} 
                    alt={movie.title} 
                    className="w-[80%] lg:w-full max-h-[150px] lg:max-h-[200px] object-contain mb-4 lg:mb-6 drop-shadow-2xl mx-auto lg:mx-0"
                />
            ) : (
                <h1 className="text-5xl lg:text-7xl font-bold drop-shadow-lg tracking-tight mb-2 lg:mb-4">{movie.title}</h1>
            )}
        </div>
        
        {/* Info Row */}
        <div className="flex items-center gap-4 text-sm md:text-lg font-medium drop-shadow-md justify-center lg:justify-start pointer-events-auto">
            <span className="text-[#46d369] font-bold">{movie.match}% {t.match}</span>
            <span className="text-gray-200">{movie.year}</span>
            <span className="bg-[#333]/60 px-2 py-0.5 rounded text-xs border border-gray-400/40">{movie.rating}</span>
            {movie.duration !== 'N/A' && <span className="text-gray-200">{movie.duration}</span>}
        </div>

        {/* Desktop Description - Hidden on Mobile and Landscape Phones (LG and up only) */}
        <p className="hidden lg:block text-lg text-gray-200 line-clamp-3 drop-shadow-md font-light shadow-black pointer-events-auto">
          {movie.description}
        </p>

        {/* Action Buttons - pointer-events-auto ensures they catch clicks even if container passes them through */}
        <div className="flex items-center gap-3 mt-4 lg:mt-6 w-full lg:w-auto px-4 lg:px-0 pointer-events-auto">
          <button 
            onClick={onPlay}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-black font-bold rounded-[4px] hover:bg-white/90 transition-transform active:scale-95 touch-manipulation cursor-pointer"
          >
            <Play className="w-6 h-6 fill-black" />
            <span className="text-base font-bold">{t.play}</span>
          </button>
          
          <button 
            onClick={onMoreInfo}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[#6d6d6eb3] text-white font-bold rounded-[4px] hover:bg-[#6d6d6e66] transition-transform active:scale-95 backdrop-blur-sm touch-manipulation cursor-pointer"
          >
            <Info className="w-6 h-6" />
            <span className="text-base font-bold">{t.moreInfo}</span>
          </button>
        </div>
      </div>
    </div>
  );
};