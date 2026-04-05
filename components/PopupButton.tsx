import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { Language, translations } from '../utils/translations';
import { Haptics } from '../utils/haptics';
import { Audio } from '../utils/audio';

interface PopupButtonProps {
    onClick: () => void;
    lang: Language;
}

export const PopupButton: React.FC<PopupButtonProps> = ({ onClick, lang }) => {
    const t = translations[lang];
    const [phase, setPhase] = useState<'hidden' | 'rising' | 'expanding' | 'idle' | 'shrinking' | 'falling'>('hidden');

    useEffect(() => {
        // Sequence: hidden -> rising -> expanding -> idle
        const sequence = async () => {
            // Small delay to ensure the initial hidden state is rendered before animating
            await new Promise(resolve => setTimeout(resolve, 50));
            setPhase('rising');
            await new Promise(resolve => setTimeout(resolve, 600)); // wait for rise
            setPhase('expanding');
            await new Promise(resolve => setTimeout(resolve, 500)); // wait for expand
            setPhase('idle');
        };
        sequence();
    }, []);

    const handleClick = () => {
        if (phase !== 'idle') return;
        
        Haptics.medium();
        Audio.playClick();

        // Sequence: idle -> shrinking -> falling -> trigger onClick
        const exitSequence = async () => {
            setPhase('shrinking');
            await new Promise(resolve => setTimeout(resolve, 400)); // wait for shrink
            setPhase('falling');
            await new Promise(resolve => setTimeout(resolve, 500)); // wait for fall
            onClick();
        };
        exitSequence();
    };

    // Variants for the container
    const containerVariants = {
        hidden: {
            y: 100,
            width: 56,
            height: 56,
            borderRadius: 28,
            opacity: 0
        },
        rising: {
            y: 0,
            width: 56,
            height: 56,
            borderRadius: 28,
            opacity: 1,
            transition: { type: 'spring', damping: 20, stiffness: 200 }
        },
        expanding: {
            y: 0,
            width: 'auto', // Expanded width adapts to content
            height: 56,
            borderRadius: 28,
            opacity: 1,
            transition: { type: 'spring', damping: 25, stiffness: 250 }
        },
        idle: {
            y: [0, -8, 0],
            width: 'auto',
            height: 56,
            borderRadius: 28,
            opacity: 1,
            transition: { 
                y: { repeat: Infinity, duration: 2.5, ease: "easeInOut" },
                width: { duration: 0 },
                height: { duration: 0 }
            }
        },
        shrinking: {
            y: 0,
            width: 56,
            height: 56,
            borderRadius: 28,
            opacity: 1,
            transition: { type: 'spring', damping: 25, stiffness: 300 }
        },
        falling: {
            y: 100,
            width: 56,
            height: 56,
            borderRadius: 28,
            opacity: 0,
            transition: { type: 'spring', damping: 20, stiffness: 200 }
        }
    };

    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center pointer-events-none">
            <motion.button
                variants={containerVariants}
                initial="hidden"
                animate={phase}
                onClick={handleClick}
                className="bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.3)] flex items-center justify-center overflow-hidden pointer-events-auto border border-white/40"
                whileTap={phase === 'idle' ? { scale: 0.95 } : {}}
            >
                <div className="flex items-center justify-center whitespace-nowrap px-4">
                    <Bell className="w-6 h-6 shrink-0 text-[#E50914] fill-[#E50914]" />
                    <AnimatePresence>
                        {(phase === 'expanding' || phase === 'idle') && (
                            <motion.span
                                initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                                animate={{ opacity: 1, width: 'auto', marginLeft: 8 }}
                                exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                                transition={{ duration: 0.3 }}
                                className="font-bold text-sm overflow-hidden"
                            >
                                {t.newAnnouncement || "New Event!"}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </motion.button>
        </div>
    );
};
