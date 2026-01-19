
import React, { useState, useEffect } from 'react';
import { X, Play, Plus } from 'lucide-react';
import { Movie } from '../types';
import { Language, translations } from '../utils/translations';

interface ModalProps {
  movie: Movie | null;
  onClose: () => void;
  onPlay: (movie: Movie) => void;
  lang: Language;
}

export const Modal: React.FC<ModalProps> = ({ movie, onClose, onPlay, lang }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState('');
  const t = translations[lang];

  useEffect(() => {
    if (movie) {
      if (window.Telegram?.WebApp) {
        setPlatform(window.Telegram.WebApp.platform);
      }
      
      const timer = setTimeout(() => setIsVisible(true), 50);

      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        if (tg.isVersionAtLeast && tg.isVersionAtLeast('6.1')) {
            tg.BackButton.show();
            tg.BackButton.onClick(handleClose);
            tg.HapticFeedback.impactOccurred('light');
        }
      }

      return () => {
        clearTimeout(timer);
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
    setTimeout(onClose, 500);
  };

  const handlePlayClick = () => {
    onPlay(movie);
    // Ми не закриваємо модалку автоматично, плеєр відкриється поверх неї.
    // Або можна закрити: handleClose();
  };

  const isMobile = platform === 'ios' || platform === 'android' || platform === 'weba';

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center pointer-events-auto">
      <div 
        className={`
          absolute inset-0 bg-black/90 md:bg-black/80 backdrop-blur-sm 
          transition-opacity duration-500 ease-in-out
          ${isVisible ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={handleClose}
      />

      <div 
        className={`
          relative w-full h-[98vh] md:h-auto md:max-h-[90vh] md:max-w-4xl 
          bg-[#141414] rounded-t-3xl md:rounded-lg overflow-hidden shadow-2xl 
          transform transition-all duration-500 cubic-bezier(0.33, 1, 0.68, 1)
          flex flex-col
          ${isVisible 
            ? 'translate-y-0 scale-100 opacity-100' 
            : 'translate-y-full md:translate-y-12 md:scale-95 opacity-0'
          }
        `}
      >
        <button 
          onClick={handleClose}
          className={`
            absolute z-50 h-12 w-12 rounded-full bg-black/50 md:bg-black/60 
            grid place-items-center hover:bg-[#2a2a2a] backdrop-blur-md shadow-2xl
            transition-all duration-500 delay-200 border border-white/10
            ${isMobile ? 'top-20 right-5' : 'top-5 right-5'}
            ${isVisible ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}
          `}
        >
          <X className="w-7 h-7 text-white" />
        </button>

        <div className="overflow-y-auto overflow-x-hidden h-full no-scrollbar">
            <div className="relative pt-[80%] md:pt-[56.25%] shrink-0 overflow-hidden bg-[#0a0a0a]">
              <div className="absolute top-0 left-0 w-full h-full">
                <img 
                  src={movie.bannerUrl} 
                  alt={movie.title} 
                  className={`
                    w-full h-full object-cover transition-transform duration-1000 ease-out
                    ${isVisible ? 'scale-100' : 'scale-115'}
                  `} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent opacity-90"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/40 to-transparent"></div>
              </div>
              
              <div 
                className={`
                    absolute bottom-0 left-0 w-full p-6 md:p-10 space-y-4 md:space-y-6
                    transition-all duration-700 delay-100 ease-out
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                `}
              >
                <h2 className="text-3xl md:text-5xl font-bold text-white drop-shadow-2xl uppercase tracking-tighter">
                    {movie.title}
                </h2>
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                  <button 
                    onClick={handlePlayClick}
                    className="flex-shrink-0 flex items-center justify-center gap-2 px-8 py-2.5 bg-white text-black font-extrabold rounded-[4px] hover:bg-white/90 transition active:scale-95 shadow-lg"
                  >
                    <Play className="w-6 h-6 fill-black" />
                    {t.play}
                  </button>
                  <button className="flex-shrink-0 flex items-center justify-center w-11 h-11 border-2 border-gray-500 rounded-full hover:border-white text-gray-300 hover:text-white transition bg-black/40 backdrop-blur-sm">
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            <div className={`
                px-6 md:px-10 py-8 md:py-10 pb-32 md:pb-12 bg-[#141414]
                transition-all duration-700 delay-200 ease-out
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `}>
                <div className="space-y-6">
                    <div className="flex items-center gap-4 text-sm md:text-lg flex-wrap font-medium">
                        <span className="text-[#46d369] font-bold">{movie.match}% {t.match}</span>
                        <span className="text-gray-400">{movie.year}</span>
                        <span className="bg-[#333] px-2 rounded text-xs border border-gray-600/50 uppercase">{movie.rating}</span>
                        <span className="text-gray-400">{movie.duration}</span>
                        <span className="border border-gray-600 px-1.5 rounded text-[10px] text-gray-400">4K HDR</span>
                    </div>
                    <p className="text-base md:text-xl leading-relaxed text-gray-200">
                        {movie.description}
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
