
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
  const t = translations[lang];

  useEffect(() => {
    if (movie) {
      if (window.Telegram?.WebApp) {
        setPlatform(window.Telegram.WebApp.platform);
      }
      
      // Load logo specifically for the modal if not present
      const loadLogo = async () => {
        if (movie.logoUrl) {
            setLogoUrl(movie.logoUrl);
        } else {
            const fetchedLogo = await API.fetchMovieLogo(movie.id, movie.mediaType === 'tv');
            if (fetchedLogo) setLogoUrl(fetchedLogo);
            else setLogoUrl(null);
        }
      };
      loadLogo();

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
          absolute inset-0 bg-black/80
          transition-opacity duration-300 ease-in-out
          ${isVisible ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div 
        className={`
          relative w-full h-[95vh] md:h-auto md:max-h-[90vh] md:max-w-4xl 
          bg-[#141414] rounded-t-xl md:rounded-lg overflow-hidden shadow-2xl 
          transform-gpu transition-transform duration-300 cubic-bezier(0.2, 0, 0.2, 1)
          flex flex-col will-change-transform
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
            absolute z-50 h-8 w-8 md:h-10 md:w-10 rounded-full bg-[#181818] 
            grid place-items-center hover:bg-[#2a2a2a]
            transition-all duration-300
            ${isMobile ? 'top-3 right-3' : 'top-4 right-4'}
            ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
          `}
        >
          <X className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </button>

        <div className="overflow-y-auto overflow-x-hidden h-full no-scrollbar overscroll-contain pb-safe">
            
            {/* 1. HERO IMAGE AREA - Only Image & Logo */}
            <div className="relative w-full aspect-video md:aspect-[2.4/1]">
                <img 
                  src={movie.bannerUrl} 
                  alt={movie.title} 
                  className="w-full h-full object-cover"
                  loading="eager"
                />
                {/* Gradient overlay for smooth transition to black */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent"></div>
                
                {/* LOGO Only - Centered bottom or slightly left */}
                <div className="absolute bottom-4 md:bottom-8 left-0 right-0 px-4 md:px-10 flex justify-center md:justify-start">
                    {logoUrl ? (
                        <img 
                            src={logoUrl} 
                            alt={movie.title} 
                            className="w-2/3 md:w-1/3 max-h-24 md:max-h-32 object-contain drop-shadow-xl animate-fade-in-up"
                        />
                    ) : (
                        <h2 className="text-3xl md:text-5xl font-black text-white text-center md:text-left drop-shadow-lg uppercase tracking-tighter leading-none">
                            {movie.title}
                        </h2>
                    )}
                </div>
            </div>

            {/* 2. CONTENT AREA - Buttons moved below */}
            <div className={`
                px-4 md:px-10 py-2 space-y-5
                transition-opacity duration-500 delay-100
                ${isVisible ? 'opacity-100' : 'opacity-0'}
            `}>
                
                {/* Metadata Row */}
                <div className="flex items-center gap-3 text-sm font-medium text-gray-300">
                    <span className="text-[#46d369] font-bold">{movie.match}% {t.match}</span>
                    <span>{movie.year}</span>
                    <span className="bg-[#333] text-white px-1.5 py-0.5 rounded-[2px] text-xs border border-white/20 uppercase">{movie.rating}</span>
                    <span>{movie.duration}</span>
                    <span className="border border-white/40 px-1 rounded-[2px] text-[10px] uppercase">HD</span>
                </div>

                {/* BIG ACTION BUTTONS */}
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={handlePlayClick}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-bold rounded-[4px] hover:bg-white/90 active:scale-[0.98] transition shadow"
                    >
                        <Play className="w-7 h-7 fill-black" />
                        <span className="text-lg font-bold">{t.play}</span>
                    </button>

                    {/* Secondary Actions Grid - Icon Only Buttons */}
                    <div className="grid grid-cols-3 gap-3">
                        <button className="flex items-center justify-center h-12 bg-[#262626] text-white/90 rounded-[4px] hover:bg-[#333] active:scale-[0.98] transition">
                            <Plus className="w-6 h-6" />
                        </button>
                        
                        <button className="flex items-center justify-center h-12 bg-[#262626] text-white/90 rounded-[4px] hover:bg-[#333] active:scale-[0.98] transition">
                            <ThumbsUp className="w-6 h-6" />
                        </button>

                        <button className="flex items-center justify-center h-12 bg-[#262626] text-white/90 rounded-[4px] hover:bg-[#333] active:scale-[0.98] transition">
                            <Share2 className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm md:text-base leading-relaxed text-white/90 pt-1 pb-6">
                    {movie.description}
                </p>

            </div>
        </div>
      </div>
    </div>
  );
};
