import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Movie, Category } from '../types';
import { Star, Tv } from 'lucide-react';

interface MovieCardProps {
    movie: Movie;
    index: number;
    activeCategory: Category;
    onClick: (movie: Movie) => void;
}

export const MovieCard = memo(({ movie, index, activeCategory, onClick }: MovieCardProps) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const isTop10 = activeCategory === 'trending' && index < 10;
    const ribbonPath = "M0 0H28V36C28 36 14 26 0 36V0Z";

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: (index % 20) * 0.05, ease: "easeOut" }}
            className="relative"
        >
            <div 
                className="relative cursor-pointer aspect-[2/3] overflow-hidden group transform-gpu ease-out hover:scale-105 hover:z-50 active:scale-95 active:brightness-75 rounded-md bg-[#181818] hover:shadow-2xl hover:shadow-black transition-transform duration-200"
                onClick={() => onClick(movie)}
            >
                {/* Skeleton Overlay - Behind Image */}
                {!imageLoaded && (
                    <div className="absolute inset-0 z-0 bg-[#181818]">
                        <div className="w-full h-full bg-gradient-to-r from-[#181818] via-[#2a2a2a] to-[#181818] animate-shimmer"></div>
                    </div>
                )}

                {/* Image */}
                <img 
                    src={movie.smallPosterUrl || movie.posterUrl}
                    alt={movie.title}
                    className={`
                        relative z-10 w-full h-full object-cover transition-opacity duration-500
                        ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                    `}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setImageLoaded(true)}
                />

                {/* Top 10 Badge */}
                {isTop10 && (
                    <div className="absolute top-0 right-0 z-20 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] w-7 h-9 drop-shadow-[0_2px_4px_rgba(229,9,20,0.5)]">
                        <svg viewBox="0 0 28 36" className="absolute inset-0 w-full h-full text-[#E50914]" fill="currentColor">
                            <path d={ribbonPath} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pb-1">
                            <span className="text-[6px] font-bold leading-none text-white/90 mb-0.5">TOP</span>
                            <span className="text-sm font-black leading-none text-white">10</span>
                        </div>
                    </div>
                )}

                {/* TV Show Badge */}
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

                {/* Rating Badge */}
                <div className="absolute bottom-2 right-2 z-20">
                    <div className="rounded flex items-center gap-1 border px-1 py-0.5 bg-black/80 border-white/10">
                        <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-[10px] font-bold text-white">{movie.rating}</span>
                    </div>
                </div>

                <div className="absolute inset-0 z-20 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
        </motion.div>
    );
});
