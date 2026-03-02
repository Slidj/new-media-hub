import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Play, Info } from 'lucide-react';
import { Movie } from '../types';
import { Language, translations } from '../utils/translations';
import { Haptics } from '../utils/haptics';
import { Audio } from '../utils/audio';

interface GlassHeroCarouselProps {
  movies: Movie[];
  onPlay: (movie: Movie) => void;
  onMoreInfo: (movie: Movie) => void;
  lang: Language;
}

export const GlassHeroCarousel: React.FC<GlassHeroCarouselProps> = ({ movies, onPlay, onMoreInfo, lang }) => {
  const t = translations[lang];
  const [activeIndex, setActiveIndex] = useState(2);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Take top 5 movies
  const carouselMovies = movies.slice(0, 5);
  const activeMovie = carouselMovies[activeIndex];

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold) {
      // Swipe Left -> Next
      if (activeIndex < carouselMovies.length - 1) {
        setActiveIndex(prev => prev + 1);
        Haptics.selection();
        Audio.playSwipe();
      }
    } else if (info.offset.x > threshold) {
      // Swipe Right -> Prev
      if (activeIndex > 0) {
        setActiveIndex(prev => prev - 1);
        Haptics.selection();
        Audio.playSwipe();
      }
    }
  };

  if (!activeMovie) return null;

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden">
      
      {/* Background Blur - Dynamic based on active movie */}
      <AnimatePresence mode="wait">
        {hasInteracted && (
            <motion.div 
            key={activeMovie.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-0"
            >
            <img 
                src={activeMovie.posterUrl} 
                alt="bg" 
                className="w-full h-full object-cover blur-2xl opacity-60 scale-110" 
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-[#0f172a]/30" />
            </motion.div>
        )}
      </AnimatePresence>

      {/* Carousel Container */}
      <div className="relative z-10 w-full h-[400px] flex items-center justify-center perspective-1000">
        <div className="relative w-full h-full flex items-center justify-center">
            {carouselMovies.map((movie, index) => {
                const offset = index - activeIndex;
                const isActive = offset === 0;
                
                // Calculate styles based on offset
                const x = offset * 60 + '%'; // 60% spacing
                const scale = isActive ? 1 : 0.8;
                const opacity = isActive ? 1 : Math.abs(offset) > 1 ? 0 : 0.4;
                const zIndex = isActive ? 20 : 10 - Math.abs(offset);
                const rotateY = offset * 25;

                return (
                    <motion.div
                        key={movie.id}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragStart={() => !hasInteracted && setHasInteracted(true)}
                        onDragEnd={handleDragEnd}
                        initial={false}
                        animate={{
                            x: `calc(${offset * 220}px)`, // Increased spacing for larger cards
                            scale,
                            opacity,
                            zIndex,
                            rotateY,
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={`
                            absolute w-[280px] h-[420px] md:w-[340px] md:h-[510px] rounded-3xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing
                            ${isActive ? 'ring-1 ring-white/20 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)]' : 'grayscale-[50%]'}
                        `}
                        style={{
                            transformStyle: 'preserve-3d',
                        }}
                    >
                        <img 
                            src={movie.posterUrl} 
                            alt={movie.title} 
                            className="w-full h-full object-cover pointer-events-none"
                        />
                        
                        {/* Glass Reflection Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />

                        {/* Play Button Overlay (Always rendered) */}
                        <motion.div 
                            animate={{ 
                                opacity: isActive ? 1 : 0, 
                                scale: isActive ? 1 : 0.8 
                            }}
                            className="absolute inset-0 flex items-center justify-center z-30"
                            style={{ pointerEvents: isActive ? 'auto' : 'none' }}
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPlay(movie);
                                }}
                                className={`
                                    group relative flex items-center justify-center w-20 h-20 rounded-full 
                                    backdrop-blur-md border transition-all duration-300
                                    ${isActive 
                                        ? 'bg-black/20 border-white/30 shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:scale-110 hover:bg-black/40 hover:shadow-[0_0_50px_rgba(34,211,238,0.6)]' 
                                        : 'bg-black/10 border-white/10 shadow-none'
                                    }
                                `}
                            >
                                <Play className={`w-8 h-8 ml-1 transition-colors ${isActive ? 'text-cyan-300 fill-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'text-white/50 fill-white/10'}`} />
                                
                                {/* Ripple Effect Ring - Active Only */}
                                {isActive && (
                                    <div className="absolute inset-0 rounded-full border border-cyan-300/30 animate-ping opacity-20" />
                                )}
                            </button>
                        </motion.div>
                    </motion.div>
                );
            })}
        </div>
      </div>

    </div>
  );
};
