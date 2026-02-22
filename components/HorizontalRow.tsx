import React, { useRef } from 'react';
import { Movie } from '../types';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface HorizontalRowProps {
    title: string;
    movies: Movie[];
    onMovieClick: (movie: Movie) => void;
}

export const HorizontalRow: React.FC<HorizontalRowProps> = ({ title, movies, onMovieClick }) => {
    const rowRef = useRef<HTMLDivElement>(null);

    if (movies.length === 0) return null;

    return (
        <div className="mb-8 px-4 md:px-12">
            <div className="flex items-center justify-between mb-4 group cursor-pointer">
                <h2 className="text-lg md:text-xl font-bold text-white group-hover:text-[#E50914] transition-colors">
                    {title}
                </h2>
                <div className="flex items-center text-xs text-gray-400 group-hover:text-white transition-colors">
                    See All <ChevronRight className="w-4 h-4" />
                </div>
            </div>

            <div 
                className="relative group"
            >
                <div 
                    ref={rowRef}
                    className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {movies.map((movie, index) => (
                        <motion.div 
                            key={`${movie.id}-${index}`}
                            className="flex-none w-[140px] md:w-[200px] snap-start"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                        >
                            <div 
                                className="relative aspect-[2/3] rounded-lg overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-10 hover:shadow-xl hover:shadow-black/50"
                                onClick={() => onMovieClick(movie)}
                            >
                                <img 
                                    src={movie.posterUrl} 
                                    alt={movie.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                                {/* Progress Bar (Fake for now, but visual) */}
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                                    <div className="h-full bg-[#E50914]" style={{ width: `${Math.random() * 80 + 10}%` }}></div>
                                </div>
                                
                                <div className="absolute inset-0 bg-black/20 hover:bg-transparent transition-colors" />
                            </div>
                            <h3 className="mt-2 text-sm font-medium text-gray-200 truncate">{movie.title}</h3>
                        </motion.div>
                    ))}
                </div>
                
                {/* Fade effect on the right to indicate scroll */}
                <div className="absolute top-0 right-0 h-full w-12 bg-gradient-to-l from-black to-transparent pointer-events-none" />
            </div>
        </div>
    );
};
