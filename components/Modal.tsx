
import React, { useState, useEffect } from 'react';
import { X, Play, Plus, ThumbsUp, Share2 } from 'lucide-react';
import { Movie } from '../types';
import { Language, translations } from '../utils/translations';
import { API } from '../services/tmdb';

interface ModalProps {
  movie: Movie | null;
  onClose: () => void;
  onPlay: (movie: Movie) => void;
  lang: Language;
}

export const Modal: React.FC<ModalProps> = ({ movie, onClose, onPlay, lang }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [tagline, setTagline] = useState<string | null>(null);
  const t = translations[lang];

  useEffect(() => {
    if (movie) {
      if (window.Telegram?.WebApp) {
        setPlatform(window.Telegram.WebApp.platform);
      }
      
      const loadDetails = async () => {
        // 1. Logo
        if (movie.logoUrl) {
            setLogoUrl(movie.logoUrl);
        } else {
            const fetchedLogo = await API.fetchMovieLogo(movie.id, movie.mediaType === 'tv');
            if (fetchedLogo) setLogoUrl(fetchedLogo);
            else setLogoUrl(null);
        }

        // 2. Details (Duration & Tagline)
        const details = await API.fetchMovieDetails(movie.id, movie.mediaType);
        
        if (movie.duration && movie.duration !== 'N/A') {
            setDuration(movie.duration);
        } else {
            if (details.duration) setDuration(details.duration);
        }

        if (details.tagline) {
            setTagline(details.tagline);
        } else {
            setTagline(null);
        }
      };
      loadDetails();

      const animId = requestAnimationFrame(() => {
          setIsVisible(true);
      });

      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        if (tg.isVersionAtLeast && tg.isVersionAtLeast('6.1')) {
            tg.BackButton.show();
            tg.BackButton.onClick(handleClose);
            tg.HapticFeedback.impactOccurred('light');
        }
      }

      return () => {
        cancelAnimationFrame(animId);
        if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          if (tg.isVersionAtLeast && tg.isVersionAtLeast('6.1')) {
            tg.BackButton.offClick(handleClose);
            tg.BackButton.hide();
          }
        }
      };
    }
  }, [movie]);

  if (!movie) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 400);
  };

  const handlePlayClick = () => {
    onPlay(movie);
  };

  const isMobile = platform === 'ios' || platform === 'android' || platform === 'weba';

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center pointer-events-auto">
      {/* Overlay */}
      <div 
        className={`
          absolute inset-0 bg-black/90 backdrop-blur-md
          transition-opacity duration-300 ease-in-out
          ${isVisible ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div 
        className={`
          relative w-full h-[98vh] md:h-auto md:max-h-[90vh] md:max-w-4xl 
          bg-[#0a0a0a] md:bg-[#141414] rounded-t-xl md:rounded-lg overflow-hidden shadow-2xl 
          transform-gpu transition-transform duration-300 cubic-bezier(0.2, 0, 0.2, 1)
          flex flex-col will-change-transform ring-1 ring-white/10
          ${isVisible 
            ? 'translate-y-0 scale-100' 
            : 'translate-y-full md:translate-y-12 md:scale-95'
          }
        `}
      >
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className={`
            absolute z-50 h-8 w-8 md:h-10 md:w-10 rounded-full bg-black/50 backdrop-blur-md
            grid place-items-center hover:bg-[#2a2a2a]
            transition-all duration-300
            ${isMobile ? 'top-3 right-3' : 'top-4 right-4'}
            ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
          `}
        >
          <X className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </button>

        <div className="overflow-y-auto overflow-x-hidden h-full no-scrollbar overscroll-contain pb-safe">
            
            {/* 1. HERO IMAGE AREA */}
            <div className="relative w-full h-[65vh] md:h-[60vh]">
                {/* 
                   MOBILE IMAGE STRATEGY:
                   Use 'posterUrl' (Vertical) for mobile. 
                   Because mobile screens are tall, using a wide banner (16:9) creates massive cropping (zooming).
                   The vertical poster fits the screen ratio, showing all characters/context.
                */}
                <img 
                  src={movie.posterUrl} 
                  alt={movie.title} 
                  className="block md:hidden w-full h-full object-cover object-center"
                  loading="eager"
                />

                {/* DESKTOP IMAGE STRATEGY:
                   Use 'bannerUrl' (Horizontal) for desktop screens.
                */}
                <img 
                  src={movie.bannerUrl} 
                  alt={movie.title} 
                  className="hidden md:block w-full h-full object-cover object-top"
                  loading="eager"
                />
                
                {/* === CINEMATIC GRADIENT STACK === */}
                
                {/* Top Shade: Ensures close button is visible */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent"></div>

                {/* Layer 1: The Long Soft Fade (Starts high, very subtle) */}
                <div className="absolute bottom-0 left-0 right-0 h-[80%] bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent"></div>

                {/* Layer 2: The Medium Blend (Where content sits) */}
                <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent"></div>

                {/* Layer 3: The Solid Base (Connects seamlessly to content div) */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#0a0a0a]"></div>
            </div>

            {/* 2. CONTENT AREA */}
            <div className={`
                relative z-20 px-4 md:px-10 pb-8 space-y-4 -mt-24 md:-mt-32
                transition-opacity duration-500 delay-100
                ${isVisible ? 'opacity-100' : 'opacity-0'}
            `}>
                
                {/* Logo & Tagline Container */}
                <div className="flex flex-col items-center justify-end gap-3 mb-2">
                    {logoUrl ? (
                        <img 
                            src={logoUrl} 
                            alt={movie.title} 
                            className="w-2/3 md:w-1/3 max-h-28 md:max-h-36 object-contain drop-shadow-xl animate-fade-in-up"
                        />
                    ) : (
                        <h2 className="text-3xl md:text-5xl font-black text-white text-center drop-shadow-lg uppercase tracking-tighter leading-none">
                            {movie.title}
                        </h2>
                    )}

                    {/* Tagline */}
                    {tagline && (
                        <p className="text-white/70 text-sm md:text-lg italic font-medium animate-fade-in-up text-center drop-shadow-md" style={{ animationDelay: '100ms' }}>
                            {tagline}
                        </p>
                    )}
                </div>

                {/* Metadata Row */}
                <div className="flex items-center justify-center gap-3 text-sm font-medium text-gray-300 drop-shadow-md">
                    <span className="text-[#46d369] font-bold">{movie.match}% {t.match}</span>
                    <span>{movie.year}</span>
                    <span className="bg-[#262626] text-white px-1.5 py-0.5 rounded-[2px] text-xs border border-white/20 uppercase">{movie.rating}</span>
                    {duration && duration !== 'N/A' && (
                        <span>{duration}</span>
                    )}
                    <span className="border border-white/40 px-1 rounded-[2px] text-[10px] uppercase">HD</span>
                </div>

                {/* BIG ACTION BUTTONS */}
                <div className="flex flex-col gap-3 pt-2">
                    <button 
                        onClick={handlePlayClick}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-bold rounded-[4px] hover:bg-white/90 active:scale-[0.98] transition shadow-xl"
                    >
                        <Play className="w-7 h-7 fill-black" />
                        <span className="text-lg font-bold">{t.play}</span>
                    </button>

                    {/* Secondary Actions */}
                    <div className="grid grid-cols-3 gap-3">
                        <button className="flex items-center justify-center h-12 bg-[#1a1a1a] text-white/90 rounded-[4px] hover:bg-[#262626] active:scale-[0.98] transition border border-white/10">
                            <Plus className="w-6 h-6" />
                        </button>
                        
                        <button className="flex items-center justify-center h-12 bg-[#1a1a1a] text-white/90 rounded-[4px] hover:bg-[#262626] active:scale-[0.98] transition border border-white/10">
                            <ThumbsUp className="w-6 h-6" />
                        </button>

                        <button className="flex items-center justify-center h-12 bg-[#1a1a1a] text-white/90 rounded-[4px] hover:bg-[#262626] active:scale-[0.98] transition border border-white/10">
                            <Share2 className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm md:text-base leading-relaxed text-gray-300 pt-2">
                    {movie.description}
                </p>

            </div>
        </div>
      </div>
    </div>
  );
};
