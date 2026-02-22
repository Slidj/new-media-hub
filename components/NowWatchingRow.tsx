import React, { useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, TrendingUp, Users } from 'lucide-react';
import { Movie, Activity } from '../types';

interface NowWatchingRowProps {
    title: string;
    activities: Activity[];
    onMovieClick: (movie: Movie) => void;
}

export const NowWatchingRow: React.FC<NowWatchingRowProps> = ({ title, activities, onMovieClick }) => {
    const rowRef = useRef<HTMLDivElement>(null);

    // Aggregate and sort activities to find trending content
    const trendingMovies = useMemo(() => {
        if (activities.length === 0) return [];

        const movieMap = new Map<string, { 
            movie: Movie, 
            score: number, 
            viewers: number,
            lastActive: number 
        }>();

        activities.forEach(activity => {
            const movieId = activity.movieId.toString();
            const existing = movieMap.get(movieId);
            
            // Weight: watching = 2, viewing = 1
            const weight = activity.action === 'watching' ? 2 : 1;
            const timestamp = new Date(activity.timestamp).getTime();

            if (existing) {
                existing.score += weight;
                existing.viewers += 1;
                if (timestamp > existing.lastActive) {
                    existing.lastActive = timestamp;
                }
            } else {
                movieMap.set(movieId, {
                    movie: {
                        id: activity.movieId,
                        title: activity.movieTitle,
                        posterUrl: activity.moviePoster,
                        bannerUrl: activity.movieBackdrop,
                        description: '',
                        rating: 'N/A',
                        year: 0,
                        genre: [],
                        mediaType: activity.mediaType || 'movie',
                        match: 0,
                        smallPosterUrl: activity.moviePoster,
                        duration: ''
                    },
                    score: weight,
                    viewers: 1,
                    lastActive: timestamp
                });
            }
        });

        // Convert map to array and sort by score desc, then by recency
        return Array.from(movieMap.values())
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return b.lastActive - a.lastActive;
            })
            .slice(0, 10) // Top 10 only
            .map(item => ({ ...item.movie, viewers: item.viewers }));
    }, [activities]);

    if (trendingMovies.length === 0) return null;

    return (
        <div className="mb-2 px-4 md:px-12">
            <div className="flex items-center justify-between mb-4 group cursor-pointer">
                <h2 className="text-lg md:text-xl font-bold text-white group-hover:text-[#E50914] transition-colors flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    {title}
                </h2>
            </div>

            <div className="relative group">
                <div 
                    ref={rowRef}
                    className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {trendingMovies.map((movie, index) => (
                        <motion.div 
                            key={`${movie.id}-${index}`}
                            className="flex-none w-[200px] md:w-[240px] snap-start"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                        >
                            <div 
                                className="relative aspect-video rounded-lg overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-10 hover:shadow-xl hover:shadow-black/50 border border-white/10 group/card"
                                onClick={() => onMovieClick(movie)}
                            >
                                <img 
                                    src={movie.bannerUrl || movie.posterUrl} 
                                    alt={movie.title}
                                    className="w-full h-full object-cover opacity-90 group-hover/card:opacity-100 transition-opacity duration-500"
                                    loading="lazy"
                                />
                                
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                                {/* Rank Badge */}
                                <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md z-10">
                                    #{index + 1}
                                </div>

                                {/* Viewers Badge */}
                                {(movie as any).viewers > 1 && (
                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white/80 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border border-white/10 z-10">
                                        <Users className="w-2.5 h-2.5" />
                                        {(movie as any).viewers}
                                    </div>
                                )}

                                {/* Title Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-2 z-10">
                                    <h3 className="text-xs md:text-sm font-bold text-white truncate drop-shadow-md leading-tight">
                                        {movie.title}
                                    </h3>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider animate-pulse">
                                            Live
                                        </span>
                                    </div>
                                </div>

                                {/* Play Icon Overlay on Hover */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[1px] z-20">
                                    <div className="w-10 h-10 rounded-full bg-[#E50914] flex items-center justify-center shadow-lg transform scale-0 group-hover/card:scale-100 transition-transform duration-300">
                                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
                
                {/* Fade effect on the right to indicate scroll */}
                <div className="absolute top-0 right-0 h-full w-12 bg-gradient-to-l from-black to-transparent pointer-events-none" />
            </div>
        </div>
    );
};
