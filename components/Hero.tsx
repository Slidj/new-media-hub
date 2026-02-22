
import React, { useState, useEffect, useRef } from 'react';
import { Play, Info } from 'lucide-react';
import { Movie } from '../types';
import { Language, translations } from '../utils/translations';
import { Haptics } from '../utils/haptics';
import { Audio } from '../utils/audio';
import { motion, useScroll, useTransform } from 'framer-motion';

interface HeroProps {
  movie: Movie;
  onMoreInfo: () => void;
  onPlay: () => void;
  lang: Language;
}

export const Hero: React.FC<HeroProps> = ({ movie, onMoreInfo, onPlay, lang }) => {
  const t = translations[lang];
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  // Reset animation state when movie changes
  useEffect(() => {
    setLogoLoaded(false);
    setImageLoaded(false);
  }, [movie.id]);

  const handlePlay = () => {
      Haptics.heavy(); 
      Audio.playAction(); // Deep bass sound
      onPlay();
  };

  const handleMoreInfo = () => {
      Haptics.medium();
      Audio.playClick(); // Standard click
      onMoreInfo();
  };

  return (
    <div ref={containerRef} className="relative h-[75vh] md:h-[90vh] w-full text-white overflow-hidden bg-black">
      {/* Background Layer - Z-0 */}
      <div className="absolute inset-0 z-0 bg-[#1a1a1a] overflow-hidden">
        
        {/* Skeleton Loader Overlay */}
        <div className={`absolute inset-0 z-10 transition-opacity duration-700 pointer-events-none ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}>
            <div className="w-full h-full bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] animate-shimmer"></div>
        </div>

        <motion.div style={{ y, opacity }} className="w-full h-full">
            {/* Mobile: Vertical Poster */}
            <img
            src={movie.posterUrl}
            alt={movie.title}
            onLoad={() => setImageLoaded(true)}
            className={`block md:hidden w-full h-full object-cover object-center transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Desktop: Horizontal Banner */}
            <img
            src={movie.bannerUrl}
            alt={movie.title}
            onLoad={() => setImageLoaded(true)}
            className={`hidden md:block w-full h-full object-cover object-top transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
        </motion.div>
        
        {/* General Dark Overlay */}
        <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
        
        {/* Desktop Side Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent hidden md:block pointer-events-none"></div>

        {/* 
           CRITICAL GRADIENT FIX: 
           1. Height increased to 50vh for very smooth transition.
           2. 'from-black' ensures the very bottom is 100% solid black, matching the app background.
        */}
        <div className="absolute bottom-0 left-0 w-full h-[50vh] bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none z-10"></div>
      </div>

      {/* Content Layer - Z-20 (Above Gradient) */}
      <div className="relative z-20 h-full flex flex-col justify-end items-center md:items-start pb-8 md:pb-12 w-full">
            
            {/* Title / Logo */}
            <div className="mb-6 px-6 flex justify-center md:justify-start w-full min-h-[100px] md:min-h-[160px] items-end">
                {movie.logoUrl ? (
                    <motion.img 
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        src={movie.logoUrl} 
                        alt={movie.title} 
                        onLoad={() => setLogoLoaded(true)}
                        className={`
                            w-64 md:w-[500px] max-h-40 md:max-h-64 object-contain drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]
                            ${logoLoaded ? 'opacity-100' : 'opacity-0'}
                        `}
                    />
                ) : (
                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-4xl md:text-7xl font-black text-center md:text-left drop-shadow-2xl uppercase tracking-tighter leading-none px-4"
                    >
                      {movie.title}
                    </motion.h1>
                )}
            </div>
            
            {/* Buttons Container - INCREASED Z-INDEX TO 30 TO ENSURE CLICKABILITY */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative z-30 w-full px-6 md:px-12 flex items-center justify-center md:justify-start gap-3 md:gap-4"
            >
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePlay}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-[4px] hover:bg-white/90 transition shadow-[0_4px_15px_rgba(0,0,0,0.5)] max-w-[200px] md:max-w-none cursor-pointer"
              >
                <Play className="w-6 h-6 md:w-8 md:h-8 fill-black" />
                <span className="text-lg md:text-xl">{t.play}</span>
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleMoreInfo}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gray-500/40 text-white font-bold rounded-[4px] hover:bg-gray-500/30 transition backdrop-blur-md border border-white/10 max-w-[200px] md:max-w-none cursor-pointer"
              >
                <Info className="w-6 h-6 md:w-8 md:h-8" />
                <span className="text-lg md:text-xl">{t.moreInfo}</span>
              </motion.button>
            </motion.div>
      </div>
    </div>
  );
};
