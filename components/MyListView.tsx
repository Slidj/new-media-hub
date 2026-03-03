
import React, { useState } from 'react';
import { Movie } from '../types';
import { Language, translations } from '../utils/translations';
import { SkeletonCard } from './SkeletonCard';
import { Star, Tv, Clock, Bookmark } from 'lucide-react';
import { MovieCard } from './MovieCard';

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
    <div className="fixed inset-0 z-30 w-full pt-[calc(110px+env(safe-area-inset-top))] pb-32 md:pb-12 overflow-y-auto overflow-x-hidden overscroll-contain no-scrollbar bg-black">
      
      {/* Header & Tabs */}
      <div className="px-4 md:px-12 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6 uppercase">{t.myList}</h2>
          
          <div className="flex p-1 rounded-lg w-full max-w-sm bg-[#222]">
             <button 
                onClick={() => handleTabChange('saved')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all duration-300 ${
                    activeTab === 'saved' 
                    ? 'bg-[#E50914] text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white'
                }`}
             >
                 <Bookmark className="w-4 h-4" />
                 {t.saved}
             </button>
             <button 
                onClick={() => handleTabChange('history')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all duration-300 ${
                    activeTab === 'history' 
                    ? 'bg-[#E50914] text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white'
                }`}
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
                <MovieCard
                    key={`${movie.id}-${activeTab}`}
                    movie={movie}
                    index={index}
                    activeCategory="movies"
                    onClick={onMovieSelect}
                />
            ))}
          </div>
      )}
    </div>
  );
};
