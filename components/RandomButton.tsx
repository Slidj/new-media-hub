import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, Sparkles } from 'lucide-react';
import { Movie } from '../types';
import { Haptics } from '../utils/haptics';
import { Audio } from '../utils/audio';

interface RandomButtonProps {
    movies: Movie[];
    onRandomSelect: (movie: Movie) => void;
}

export const RandomButton: React.FC<RandomButtonProps> = ({ movies, onRandomSelect }) => {
    const [isShuffling, setIsShuffling] = useState(false);

    const handleClick = () => {
        if (isShuffling || movies.length === 0) return;

        setIsShuffling(true);
        Haptics.medium();
        Audio.playClick();

        // Simulate shuffling animation
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * movies.length);
            const randomMovie = movies[randomIndex];
            
            Haptics.success();
            Audio.playSuccess();
            onRandomSelect(randomMovie);
            setIsShuffling(false);
        }, 1500);
    };

    if (movies.length === 0) return null;

    return (
        <motion.button
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 50 }}
            transition={{ 
                delay: 1, 
                type: "spring", 
                stiffness: 260, 
                damping: 20 
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClick}
            className={`
                fixed bottom-24 right-4 z-40 
                w-14 h-14 rounded-full 
                bg-gradient-to-br from-[#E50914] to-[#B20710] 
                text-white shadow-[0_4px_20px_rgba(229,9,20,0.5)] 
                flex items-center justify-center
                border border-white/20
                overflow-hidden
                group
            `}
        >
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            
            <AnimatePresence mode='wait'>
                {isShuffling ? (
                    <motion.div
                        key="shuffling"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
                    >
                        <Sparkles className="w-7 h-7" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="idle"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="relative"
                    >
                        <Dices className="w-7 h-7 drop-shadow-md" />
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
};
