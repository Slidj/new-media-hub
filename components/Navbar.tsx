
// Update: Navbar with Notifications Support
import React, { useState, useEffect } from 'react';
import { Bell, Gift } from 'lucide-react';
import { WebAppUser, TabType } from '../types';
import { Language, translations } from '../utils/translations';
import { Haptics } from '../utils/haptics';
import { Audio } from '../utils/audio';

interface NavbarProps {
  user: WebAppUser | null;
  lang: Language;
  onSearchClick: () => void;
  onHomeClick: () => void;
  activeTab: TabType;
  unreadCount?: number;
  onBellClick: () => void;
  logoIcon?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ 
    user, 
    lang, 
    onSearchClick, 
    onHomeClick, 
    activeTab, 
    unreadCount = 0,
    onBellClick,
    logoIcon = ''
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

  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] bg-black border-b border-[#222] shadow-lg">
      
      {/* Left: Logo */}
      <div className="flex items-center gap-2" onClick={onHomeClick}>
        <div className="flex items-center gap-1">
            <span className="text-2xl font-bebas tracking-tighter text-transparent bg-clip-text uppercase drop-shadow-logo bg-gradient-to-b from-[#E50914] to-[#8A050C] cursor-pointer" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                MEDIA HUB
            </span>
            {logoIcon && (
                <span className="text-xl animate-bounce">{logoIcon}</span>
            )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        
        {/* Notifications Bell */}
        <div className="relative">
            <button 
                onClick={() => {
                    Haptics.light();
                    Audio.playClick();
                    onBellClick();
                }}
                className="p-2 text-white hover:opacity-80 transition active:scale-90"
            >
                <Bell className="w-5 h-5 text-white" strokeWidth={2} />
                
                {/* Notification Dot */}
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-red-500"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                    </span>
                )}
            </button>
        </div>

        {/* Gift Button */}
        <button 
            onClick={() => {
                Haptics.light();
                Audio.playClick();
                // Placeholder for Gift action
            }}
            className="p-2 text-white hover:opacity-80 transition active:scale-90"
        >
            <Gift className="w-5 h-5 text-white" strokeWidth={2} />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-md overflow-hidden border border-white/10">
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
