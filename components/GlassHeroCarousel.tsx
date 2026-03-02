import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Play } from 'lucide-react';
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
      if (activeIndex < carouselMovies.length - 1) {
        setActiveIndex(prev => prev + 1);
        Haptics.selection();
        Audio.playSwipe();
      }
    } else if (info.offset.x > threshold) {
      if (activeIndex > 0) {
        setActiveIndex(prev => prev - 1);
        Haptics.selection();
        Audio.playSwipe();
      }
    }
  };

  if (!activeMovie) return null;

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-[#020617]">
      
      {/* --- PREMIUM ATMOSPHERIC BACKGROUND --- */}
      <AnimatePresence mode="wait">
        {hasInteracted ? (
            <motion.div 
                key={`bg-${activeMovie.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                className="fixed inset-0 z-0"
            >
                {/* Deep Base Layer */}
                <div className="absolute inset-0 bg-[#020617]" />
                
                {/* Blurred Poster Aura */}
                <img 
                    src={activeMovie.posterUrl} 
                    alt="aura" 
                    className="absolute inset-0 w-full h-full object-cover blur-[100px] opacity-40 scale-150 mix-blend-screen" 
                />
                
                {/* Animated Aurora Blobs */}
                <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />

                {/* Vignette & Scanlines */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]/50 z-20" />
            </motion.div>
        ) : (
             /* Default Dark Tech Background */
            <div className="fixed inset-0 z-0 bg-[#020617]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-[#020617]" />
                <div className="absolute inset-0 opacity-20" 
                     style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
                />
            </div>
        )}
      </AnimatePresence>

      {/* --- 3D CAROUSEL --- */}
      <div className="relative z-10 w-full h-[600px] flex items-center justify-center perspective-[1200px]">
        <div className="relative w-full h-full flex items-center justify-center transform-style-3d">
            {carouselMovies.map((movie, index) => {
                const offset = index - activeIndex;
                const isActive = offset === 0;
                
                // 3D Transforms
                const x = offset * 260; // Spacing
                const scale = isActive ? 1 : 0.85;
                const opacity = isActive ? 1 : Math.max(0, 1 - Math.abs(offset) * 0.4);
                const rotateY = offset * -25; // Inverted rotation for "looking in" feel
                const z = isActive ? 0 : -300 - Math.abs(offset) * 100;

                return (
                    <motion.div
                        key={movie.id}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.1}
                        onDragStart={() => !hasInteracted && setHasInteracted(true)}
                        onDragEnd={handleDragEnd}
                        initial={false}
                        animate={{
                            x,
                            scale,
                            opacity,
                            rotateY,
                            z,
                        }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 200, 
                            damping: 25,
                            mass: 1 
                        }}
                        className={`
                            absolute w-[280px] h-[420px] md:w-[360px] md:h-[540px] rounded-[32px] cursor-grab active:cursor-grabbing
                            ${isActive ? 'z-50' : 'z-10 grayscale-[30%] brightness-75'}
                        `}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* Card Container (Glass Slab) */}
                        <div className={`
                            relative w-full h-full rounded-[32px] overflow-hidden transition-all duration-500
                            ${isActive 
                                ? 'shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.15)]' 
                                : 'shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]'
                            }
                        `}>
                            <img 
                                src={movie.posterUrl} 
                                alt={movie.title} 
                                className="w-full h-full object-cover pointer-events-none"
                            />
                            
                            {/* Premium Gloss Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/40 pointer-events-none mix-blend-overlay" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 pointer-events-none" />

                            {/* Play Button - Glass Orb Style */}
                            <motion.div 
                                animate={{ 
                                    opacity: isActive ? 1 : 0, 
                                    scale: isActive ? 1 : 0.8,
                                    y: isActive ? 0 : 20
                                }}
                                className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onPlay(movie);
                                    }}
                                    className="pointer-events-auto group relative w-24 h-24 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-110 active:scale-95"
                                >
                                    {/* Orb Body */}
                                    <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.2),0_10px_20px_rgba(0,0,0,0.3)]" />
                                    
                                    {/* Inner Glow */}
                                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-600/20 blur-sm" />
                                    
                                    {/* Specular Highlight (The "Glass" Shine) */}
                                    <div className="absolute top-3 left-6 w-8 h-4 bg-white/40 rounded-full blur-[2px] rotate-[-20deg]" />

                                    {/* Icon */}
                                    <Play className="relative w-10 h-10 text-white fill-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] ml-1" />
                                    
                                    {/* Outer Ripple */}
                                    {isActive && (
                                        <div className="absolute inset-[-10px] rounded-full border border-white/10 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                                    )}
                                </button>
                            </motion.div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
      </div>
    </div>
  );
};
