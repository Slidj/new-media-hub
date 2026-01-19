
import React, { useState, useEffect } from 'react';
import { Search, X, Star, Tv } from 'lucide-react';
import { Movie } from '../types';
import { API } from '../services/tmdb';
import { Language, translations } from '../utils/translations';
import { SkeletonCard } from './SkeletonCard';

interface SearchViewProps {
  onMovieSelect: (movie: Movie) => void;
  lang: Language;
}

export const SearchView: React.FC<SearchViewProps> = ({ onMovieSelect, lang }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const t = translations[lang];

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 1) {
        setLoading(true);
        const locale = lang === 'uk' ? 'uk-UA' : lang === 'ru' ? 'ru-RU' : 'en-US';
        const data = await API.searchContent(query, locale);
        setResults(data);
        setLoading(false);
      } else if (query.trim().length === 0) {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, lang]);

  return (
    <div className="fixed inset-0 z-40 bg-black flex flex-col pt-[140px] md:pt-[160px] pb-[80px]">
      
      {/* Static Search Bar Area */}
      <div className="w-full px-4 md:px-12 py-2 shrink-0 bg-black z-50">
        <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type="text"
                className="block w-full pl-12 pr-12 py-3.5 border border-gray-800 rounded bg-[#1a1a1a] text-gray-100 placeholder-gray-500 focus:outline-none focus:bg-[#222] focus:border-gray-600 sm:text-sm transition-all"
                placeholder={t.search}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
            />
            {query && (
                <div 
                    className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer"
                    onClick={() => setQuery('')}
                >
                    <X className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
                </div>
            )}
        </div>
      </div>

      {/* Scrollable Results Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-12 pt-4 pb-24 overscroll-contain no-scrollbar">
          {loading ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={`skeleton-search-${i}`} className="opacity-0 animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                        <SkeletonCard />
                    </div>
                ))}
            </div>
          ) : results.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
                {results.map((movie, index) => (
                  <div 
                    key={movie.id} 
                    className="opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div 
                        className="
                            relative cursor-pointer aspect-[2/3] rounded overflow-hidden bg-[#181818] group
                            transition-transform duration-200 ease-out
                            hover:scale-105 hover:z-10 hover:shadow-xl hover:shadow-black/80
                            active:scale-95 active:brightness-75
                        "
                        onClick={() => onMovieSelect(movie)}
                    >
                        <img
                        src={movie.posterUrl || movie.bannerUrl}
                        className="w-full h-full object-cover"
                        alt={movie.title}
                        loading="lazy"
                        />
                        
                        {movie.mediaType === 'tv' && (
                            <div className="absolute top-2 right-2 z-20">
                                <div className="bg-[#E50914] text-white text-[9px] md:text-[10px] font-bold px-2 py-1 rounded shadow-md flex items-center gap-1 border border-white/10 backdrop-blur-sm">
                                    <Tv className="w-3 h-3" />
                                    <span>{translations[lang].series}</span>
                                </div>
                            </div>
                        )}

                        <div className="absolute bottom-2 right-2 z-20">
                            <div className="bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded flex items-center gap-1 border border-white/10 shadow-lg">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-[10px] font-bold text-white">{movie.rating}</span>
                            </div>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
          ) : query.length > 1 ? (
             <div className="flex flex-col items-center justify-center h-64 text-gray-500 animate-fade-in-up">
                <p className="text-lg font-medium">No results found for "{query}"</p>
             </div>
          ) : (
             <div className="flex flex-col items-center justify-center h-full pb-20 text-gray-500 animate-fade-in-up">
                <Search className="w-16 h-16 mb-4 opacity-10" />
                <p className="text-lg font-medium tracking-tight">{t.search}</p>
                <p className="text-sm opacity-40">Find your next favorite story</p>
             </div>
          )}
      </div>
    </div>
  );
};
