
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
    <div className="min-h-screen bg-black pt-32 md:pt-40 pb-24 px-4 md:px-12 pt-safe">
      {/* Search Input Bar */}
      <div className="sticky top-24 md:top-32 z-30 mb-10 pt-2">
        <div className="relative max-w-2xl mx-auto shadow-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type="text"
                className="block w-full pl-12 pr-12 py-4 border border-gray-700/50 rounded-lg leading-5 bg-[#1a1a1a] text-gray-100 placeholder-gray-500 focus:outline-none focus:bg-[#222] focus:border-gray-500 sm:text-sm transition-all shadow-inner"
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

      {/* Results Container */}
      <div className="relative z-10">
          {loading ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                    <SkeletonCard key={`skeleton-search-${i}`} />
                ))}
            </div>
          ) : results.length > 0 ? (
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
                ))}
              </div>
          ) : query.length > 1 ? (
             <div className="flex flex-col items-center justify-center pt-20 text-gray-500">
                <p className="text-lg font-medium">No results found for "{query}"</p>
             </div>
          ) : (
             <div className="flex flex-col items-center justify-center pt-20 text-gray-500">
                <Search className="w-16 h-16 mb-4 opacity-10" />
                <p className="text-lg font-medium tracking-tight">{t.search}</p>
                <p className="text-sm opacity-40">Find your next favorite story</p>
             </div>
          )}
      </div>
    </div>
  );
};
