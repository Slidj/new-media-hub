
// Update: Navbar with Notifications Support
import React, { useState, useEffect } from 'react';
import { Search, Bell, User, Gift } from 'lucide-react';
import { WebAppUser, TabType } from '../types';
import { Language, translations } from '../utils/translations';

interface NavbarProps {
  user: WebAppUser | null;
  lang: Language;
  onSearchClick: () => void;
  onHomeClick: () => void;
  activeTab: TabType;
  unreadCount?: number;
  onBellClick: () => void;
  logoIcon?: string;
  theme?: 'default' | 'glass';
}

export const Navbar: React.FC<NavbarProps> = ({ 
    user, 
    lang, 
    onSearchClick, 
    onHomeClick, 
    activeTab, 
    unreadCount = 0,
    onBellClick,
    logoIcon = '',
    theme = 'default'
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  const t = translations[lang];

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(offset > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
        window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Glass Theme Styles - Premium Aurora Look
  const glassContainerClass = "fixed top-4 left-4 right-4 z-50 flex items-center justify-between px-4 py-3 rounded-2xl bg-[#020617]/60 backdrop-blur-2xl border border-white/10 ring-1 ring-white/5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] transition-all duration-500";
  const defaultContainerClass = `fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 py-3 transition-all duration-500 ${
    isScrolled ? 'bg-black/80 backdrop-blur-md shadow-lg' : 'bg-gradient-to-b from-black/80 to-transparent'
  }`;

  const glassButtonClass = "relative group w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] active:scale-95";

  return (
    <nav className={theme === 'glass' ? glassContainerClass : defaultContainerClass}>
      
      {/* Left: Logo */}
      <div className="flex items-center gap-2" onClick={onHomeClick}>
        {logoIcon ? (
            <img 
                src={logoIcon} 
                alt="Logo" 
                className={`h-8 w-auto object-contain transition-transform active:scale-90 ${theme === 'glass' ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : ''}`} 
            />
        ) : (
            <div className={`flex items-center gap-1 ${theme === 'glass' ? 'text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'text-[#E50914]'}`}>
                <span className="text-2xl font-black tracking-tighter cursor-pointer">
                    NETFLIX
                </span>
            </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        
        {/* Search Button */}
        <button 
            onClick={() => {
                Haptics.light();
                Audio.playClick();
                onSearchClick();
            }}
            className={theme === 'glass' ? glassButtonClass : "p-2 text-white hover:opacity-80 transition active:scale-90"}
        >
            <Search className={`w-5 h-5 ${theme === 'glass' ? 'text-white/90' : 'text-white'}`} strokeWidth={theme === 'glass' ? 2.5 : 2} />
        </button>

        {/* Notifications Bell */}
        <div className="relative">
            <button 
                onClick={() => {
                    Haptics.light();
                    Audio.playClick();
                    onBellClick();
                }}
                className={theme === 'glass' ? glassButtonClass : "p-2 text-white hover:opacity-80 transition active:scale-90"}
            >
                <Bell className={`w-5 h-5 ${theme === 'glass' ? 'text-white/90' : 'text-white'}`} strokeWidth={theme === 'glass' ? 2.5 : 2} />
                
                {/* Notification Dot */}
                {unreadCount > 0 && (
                    <span className={`absolute top-2 right-2 flex h-2.5 w-2.5 ${theme === 'glass' ? '-mt-1 -mr-1' : ''}`}>
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme === 'glass' ? 'bg-cyan-400' : 'bg-red-500'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${theme === 'glass' ? 'bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-red-600'}`}></span>
                    </span>
                )}
            </button>
        </div>

        {/* Avatar */}
        <div className={`w-8 h-8 rounded-md overflow-hidden border ${theme === 'glass' ? 'border-white/20 shadow-[0_0_10px_rgba(0,0,0,0.5)]' : 'border-white/10'}`}>
            <img 
                src={user?.photo_url || "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"} 
                alt="User" 
                className="w-full h-full object-cover"
            />
        </div>

      </div>
    </nav>
  );
};
