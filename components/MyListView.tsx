
import React, { useState } from 'react';
import { Movie } from '../types';
import { Language, translations } from '../utils/translations';
import { SkeletonCard } from './SkeletonCard';
import { Star, Tv, Clock, Bookmark } from 'lucide-react';

interface MyListViewProps {
  myList: Movie[];
  history: Movie[];
  onMovieSelect: (movie: Movie) => void;
  lang: Language;
}

export const MyListView: React.FC<MyListViewProps> = ({ myList, history, onMovieSelect, lang }) => {
  const [activeTab, setActiveTab] = useState<'saved' | 'history'>('saved');
  const t = translations[lang];
  const ribbonPath = "M0 0H28V36C28 36 14 26 0 36V0Z";

  const movies = activeTab === 'saved' ? myList : history;
  const isEmpty = movies.length === 0;

  const handleTabChange = (tab: 'saved' | 'history') => {
      // FIX: Added strict version check (>= 6.1) to prevent warnings on older Telegram clients
      if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          if (tg.isVersionAtLeast && tg.isVersionAtLeast('6.1') && tg.HapticFeedback) {
              tg.HapticFeedback.impactOccurred('light');
          }
      }
      setActiveTab(tab);
  };

  return (
    // Padding top accounts for navbar + safe area
    <div className="fixed inset-0 z-30 w-full bg-black pt-[calc(110px+env(safe-area-inset-top))] pb-32 md:pb-12 overflow-y-auto overflow-x-hidden overscroll-contain no-scrollbar">
      
      {/* Header & Tabs */}
      <div className="px-4 md:px-12 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6 uppercase">{t.myList}</h2>
          
          <div className="flex p-1 bg-[#222] rounded-lg w-full max-w-sm">
             <button 
                onClick={() => handleTabChange('saved')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all duration-300 ${activeTab === 'saved' ? 'bg-[#E50914] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
             >
                 <Bookmark className="w-4 h-4" />
                 {t.saved}
             </button>
             <button 
                onClick={() => handleTabChange('history')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all duration-300 ${activeTab === 'history' ? 'bg-[#E50914] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
             >
                 <Clock className="w-4 h-4" />
                 {t.history}
             </button>
          </div>
      </div>

      {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500 px-6 text-center animate-fade-in-up">
              {activeTab === 'saved' ? (
                  <>
                    <Bookmark className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">{t.emptyList}</p>
                  </>
              ) : (
                  <>
                    <Clock className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">{t.emptyHistory}</p>
                  </>
              )}
          </div>
      ) : (
          <div className="px-2 md:px-12 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
            {movies.map((movie, index) => (
                <div 
                    key={`${movie.id}-${activeTab}`}
                    className="opacity-0 animate-fade-in-up fill-mode-forwards"
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    <div 
                        className="
                            relative cursor-pointer aspect-[2/3] rounded-md overflow-hidden bg-[#181818] group
                            transform-gpu transition-transform duration-200 ease-out
                            hover:scale-105 hover:z-50 hover:shadow-2xl hover:shadow-black
                            active:scale-95 active:brightness-75
                        "
                        onClick={() => onMovieSelect(movie)}
                    >
                        <img
                            src={movie.smallPosterUrl || movie.posterUrl}
                            className="w-full h-full object-cover bg-[#222]"
                            alt={movie.title}
                            loading="lazy"
                        />

                        {movie.mediaType === 'tv' && (
                            <div className="absolute top-0 left-0 z-20 w-7 h-9 drop-shadow-[0_2px_4px_rgba(229,9,20,0.5)]">
                                    <svg viewBox="0 0 28 36" className="absolute inset-0 w-full h-full text-[#E50914]" fill="currentColor">
                                    <path d={ribbonPath} />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center pb-1">
                                    <Tv className="w-3.5 h-3.5 text-white fill-white/20" strokeWidth={2.5} />
                                    </div>
                            </div>
                        )}

                        <div className="absolute bottom-2 right-2 z-20">
                            <div className="bg-black/80 px-1 py-0.5 rounded flex items-center gap-1 border border-white/10">
                                <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                                <span className="text-[10px] font-bold text-white">{movie.rating}</span>
                            </div>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                </div>
            ))}
          </div>
      )}
    </div>
  );
};
