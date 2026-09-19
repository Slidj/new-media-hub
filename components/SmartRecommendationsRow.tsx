import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Star, ChevronRight, Play } from 'lucide-react';
import { Movie } from '../types';
import { Haptics } from '../utils/haptics';
import { Audio } from '../utils/audio';

interface SmartRecommendationsRowProps {
  title: string;
  subtitle?: string;
  movies: Movie[];
  loading?: boolean;
  onMovieClick: (movie: Movie) => void;
  lang: string;
}

export const SmartRecommendationsRow: React.FC<SmartRecommendationsRowProps> = ({
  title,
  subtitle,
  movies,
  loading = false,
  onMovieClick,
  lang
}) => {
  const rowRef = useRef<HTMLDivElement>(null);

  if (!loading && movies.length === 0) return null;

  const handleCardClick = (movie: Movie) => {
    Haptics.medium();
    Audio.playPop();
    onMovieClick(movie);
  };

  return (
    <div className="mb-6 px-4 md:px-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-3.5 gap-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-red-600/20 text-[#E50914] border border-red-500/30">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </span>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-wide flex items-center gap-2">
              {title}
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-red-600/30 to-amber-600/20 text-red-300 border border-red-500/20">
              Smart AI
            </span>
          </div>

          {subtitle && (
            <p className="text-xs text-gray-400 mt-1 pl-7 line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>

        <div className="hidden sm:flex items-center text-xs text-gray-400 hover:text-white transition-colors cursor-pointer self-end">
          <span>{lang === 'uk' ? 'Гортайте' : lang === 'ru' ? 'Листайте' : 'Scroll for more'}</span>
          <ChevronRight className="w-4 h-4 ml-0.5" />
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative group">
        <div
          ref={rowRef}
          className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-3 pt-1 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`smart-skeleton-${i}`}
                  className="flex-none w-[140px] sm:w-[165px] md:w-[185px] snap-start"
                >
                  <div className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse border border-white/10" />
                  <div className="h-3 bg-white/10 rounded mt-2.5 w-3/4 animate-pulse" />
                  <div className="h-2.5 bg-white/5 rounded mt-1.5 w-1/2 animate-pulse" />
                </div>
              ))
            : movies.map((movie, index) => (
                <motion.div
                  key={`${movie.id}-${index}`}
                  className="flex-none w-[140px] sm:w-[165px] md:w-[185px] snap-start group/card cursor-pointer"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.3 }}
                  onClick={() => handleCardClick(movie)}
                >
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden border border-white/10 group-hover/card:border-red-500/50 group-hover/card:shadow-[0_8px_25px_rgba(229,9,20,0.3)] transition-all duration-300">
                    <img
                      src={movie.posterUrl || movie.smallPosterUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />

                    {/* Gradient Overlay for badges */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60 pointer-events-none" />

                    {/* Top Badges Row */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
                      {/* Match Badge */}
                      <span className="bg-gradient-to-r from-emerald-600 to-green-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded shadow-md tracking-tight">
                        {movie.match || 95}% {lang === 'uk' ? 'збіг' : lang === 'ru' ? 'совп' : 'match'}
                      </span>

                      {/* Year Badge */}
                      {movie.year && (
                        <span className="bg-black/75 text-gray-200 text-[9px] font-semibold px-1.5 py-0.5 rounded border border-white/10 backdrop-blur-sm">
                          {movie.year}
                        </span>
                      )}
                    </div>

                    {/* Bottom Recommendation Reason Pill */}
                    {movie.recommendationReason && (
                      <div className="absolute bottom-2 left-2 right-2 z-10 pointer-events-none">
                        <div className="bg-black/85 text-amber-300 text-[9px] sm:text-[10px] font-semibold px-2 py-1 rounded-md border border-amber-500/30 backdrop-blur-md truncate shadow-lg">
                          {movie.recommendationReason}
                        </div>
                      </div>
                    )}

                    {/* Play Hover Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 bg-black/40 z-20">
                      <div className="w-10 h-10 rounded-full bg-[#E50914] flex items-center justify-center shadow-lg transform scale-0 group-hover/card:scale-100 transition-transform duration-300">
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Title and Metadata below card */}
                  <div className="mt-2 px-0.5">
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover/card:text-[#E50914] transition-colors">
                      {movie.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-gray-400 mt-0.5">
                      <span className="text-amber-400 font-bold flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        {movie.rating}
                      </span>
                      <span>•</span>
                      <span className="truncate">
                        {movie.genre && movie.genre[0] ? movie.genre[0] : (movie.mediaType === 'tv' ? 'Серіал' : 'Фільм')}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
        </div>

        {/* Right Gradient fade */}
        <div className="absolute top-0 right-0 h-full w-12 bg-gradient-to-l from-black to-transparent pointer-events-none" />
      </div>
    </div>
  );
};
