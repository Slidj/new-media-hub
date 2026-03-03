
// Update: Navbar with Notifications Support
import React, { useState, useEffect } from 'react';
import { Search, Bell, User, Gift } from 'lucide-react';
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
    <nav className={`fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 py-3 transition-all duration-500 ${
      isScrolled ? 'bg-black/80 backdrop-blur-md shadow-lg' : 'bg-gradient-to-b from-black/80 to-transparent'
    }`}>
      
      {/* Left: Logo */}
      <div className="flex items-center gap-2" onClick={onHomeClick}>
        {logoIcon ? (
            <img 
                src={logoIcon} 
                alt="Logo" 
                className="h-8 w-auto object-contain transition-transform active:scale-90" 
            />
        ) : (
            <div className="flex items-center gap-1 text-[#E50914]">
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
            className="p-2 text-white hover:opacity-80 transition active:scale-90"
        >
            <Search className="w-5 h-5 text-white" strokeWidth={2} />
        </button>

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
