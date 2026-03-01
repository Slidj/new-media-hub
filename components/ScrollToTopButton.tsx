import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { Haptics } from '../utils/haptics';

export const ScrollToTopButton = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isClicking, setIsClicking] = useState(false);
    const lastScrollY = React.useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            // Show if:
            // 1. We are not at the very top (e.g. > 300px)
            // 2. We are scrolling UP (current < last)
            
            if (currentScrollY > 300 && currentScrollY < lastScrollY.current) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        setIsClicking(true);
        Haptics.light();
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Reset animation state
        setTimeout(() => setIsClicking(false), 800);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ scale: 0, opacity: 0, x: -20 }}
                    animate={{ scale: 1, opacity: 1, x: 0 }}
                    exit={{ scale: 0, opacity: 0, x: -20 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={scrollToTop}
                    className={`
                        fixed bottom-24 left-4 z-40 
                        w-12 h-12 rounded-full 
                        bg-[#2a2a2a] 
                        border border-white/10 
                        text-white shadow-lg 
                        flex items-center justify-center
                        overflow-hidden
                        group
                    `}
                >
                    <motion.div
                        animate={isClicking ? { y: -40, opacity: 0 } : { y: 0, opacity: 1 }}
                        transition={{ duration: 0.4 }}
                    >
                        <ArrowUp className="w-6 h-6 text-white/90 group-hover:text-white" />
                    </motion.div>
                    
                    {/* Animation effect on click */}
                    {isClicking && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: -50, opacity: [0, 1, 0] }} 
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            <ArrowUp className="w-6 h-6 text-blue-400" />
                        </motion.div>
                    )}
                </motion.button>
            )}
        </AnimatePresence>
    );
};
