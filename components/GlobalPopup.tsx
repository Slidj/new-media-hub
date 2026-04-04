import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Language, translations } from '../utils/translations';

interface GlobalPopupProps {
    data: {
        id: string;
        title: string;
        message: string;
        imageUrl?: string;
        isActive: boolean;
    };
    onClose: () => void;
    lang: Language;
}

export const GlobalPopup: React.FC<GlobalPopupProps> = ({ data, onClose, lang }) => {
    const t = translations[lang];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                    onClick={onClose} 
                />
                
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                    animate={{ scale: 1, opacity: 1, y: 0 }} 
                    exit={{ scale: 0.9, opacity: 0, y: 20 }} 
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl shadow-black w-full max-w-md overflow-hidden z-10 flex flex-col max-h-[80vh]"
                >
                    {data.imageUrl && (
                        <div className="w-full h-48 shrink-0 relative">
                            <img 
                                src={data.imageUrl} 
                                alt="Announcement" 
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent" />
                        </div>
                    )}
                    
                    <div className="p-6 overflow-y-auto custom-scrollbar">
                        <h2 className="text-2xl font-bold text-white mb-3 leading-tight">{data.title}</h2>
                        <p className="text-gray-300 mb-6 whitespace-pre-wrap leading-relaxed text-sm">{data.message}</p>
                        
                        <button 
                            onClick={onClose} 
                            className="w-full py-3.5 bg-[#E50914] hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-red-900/20"
                        >
                            <X className="w-5 h-5" />
                            {t.popupClose || 'Close'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
