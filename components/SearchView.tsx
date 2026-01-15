
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
        // Map language
        const locale = lang === 'uk' ? 'uk-UA' : lang === 'ru' ? 'ru-RU' : 'en-US';
        const data = await API.searchContent(query, locale);
        setResults(data);
        setLoading(false);
      } else if (query.trim().length === 0) {
        setResults([]);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [query, lang]);

  return (
    <div className="min-h-screen bg-black pt-24 md:pt-28 pb-24 px-4 md:px-12 pt-safe">
      {/* Search Input Bar */}
      <div className="sticky top-20 md:top-24 z-30 mb-8 pt-2">
        <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type="text"
                className="block w-full pl-10 pr-10 py-3 border border-transparent rounded-sm leading-5 bg-[#333] text-gray-100 placeholder-gray-400 focus:outline-none focus:bg-[#444] focus:border-gray-500 sm:text-sm transition-colors"
                placeholder={t.search}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
            />
            {query && (
                <div 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                    onClick={() => setQuery('')}
                >
                    <X className="h-5 w-5 text-gray-400 hover:text-white" />
                </div>
            )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
                 <SkeletonCard key={`skeleton-search-${i}`} />
            ))}
        </div>
      )}

      {/* Results Grid */}
      {!loading && results.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {results.map((movie) => (
              <div 
                key={movie.id} 
                className="
                    relative cursor-pointer aspect-[2/3] rounded-md overflow-hidden bg-[#181818] group
                    transition-all duration-300 ease-out
                    hover:scale-105 hover:z-10 hover:shadow-xl hover:shadow-black/80
                    active:scale-90 active:brightness-75
                "
                onClick={() => onMovieSelect(movie)}
              >
                <img
                  src={movie.posterUrl || movie.bannerUrl}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  alt={movie.title}
                  loading="lazy"
                />
                
                {/* Series Badge (Top Right) */}
                {movie.mediaType === 'tv' && (
                    <div className="absolute top-2 right-2 z-20">
                    <div className="bg-[#E50914] text-white text-[9px] md:text-[10px] font-bold px-2 py-1 rounded shadow-md flex items-center gap-1 border border-white/10 backdrop-blur-sm">
                        <Tv className="w-3 h-3" />
                        <span>{translations[lang].series}</span>
                    </div>
                    </div>
                )}

                {/* Rating Badge (Bottom Right) */}
                <div className="absolute bottom-2 right-2 z-20">
                    <div className="bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded flex items-center gap-1 border border-white/10 shadow-lg">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-[10px] font-bold text-white">{movie.rating}</span>
                    </div>
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-20">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center transform scale-50 group-hover:scale-100 transition-transform duration-300 delay-75 shadow-lg">
                        <div className="w-0 h-0 border-l-[6px] md:border-l-[8px] border-l-transparent border-t-[10px] md:border-t-[14px] border-t-white border-r-[6px] md:border-r-[8px] border-r-transparent transform rotate-[-90deg] ml-1"></div>
                    </div>
                </div>
              </div>
            ))}
          </div>
      )}

      {/* Empty State / Initial State */}
      {!loading && results.length === 0 && query.length === 0 && (
         <div className="flex flex-col items-center justify-center pt-20 text-gray-500">
            <Search className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">{t.search}</p>
            <p className="text-sm opacity-60">Find your next favorite story</p>
         </div>
      )}

        {!loading && results.length === 0 && query.length > 1 && (
         <div className="flex flex-col items-center justify-center pt-20 text-gray-500">
            <p className="text-lg font-medium">No results found for "{query}"</p>
         </div>
      )}
    </div>
  );
};
