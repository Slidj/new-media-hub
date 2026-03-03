
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
    <nav className={`fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 pb-3 pt-[calc(env(safe-area-inset-top)+64px)] transition-all duration-500 ${
      isScrolled 
        ? 'bg-[#0a0a0a] shadow-2xl' 
        : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent'
    }`}>
      
      {/* Left: Logo */}
      <div className="flex items-center gap-2" onClick={onHomeClick}>
        <div className="flex items-center gap-1">
            <span className="text-4xl font-bebas tracking-tighter text-[#E50914] uppercase drop-shadow-logo cursor-pointer" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                MEDIA HUB
            </span>
            {logoIcon && (
                <span className="text-2xl animate-wiggle-periodic origin-bottom inline-block">{logoIcon}</span>
            )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        
        {/* Notifications Bell */}
        <div className="relative">
            <button 
                onClick={() => {
                    Haptics.light();
                    Audio.playClick();
                    onBellClick();
                }}
                className="w-9 h-9 flex items-center justify-center text-white hover:opacity-80 transition active:scale-90"
            >
                <Bell className="w-6 h-6 text-white drop-shadow-md" strokeWidth={2.5} />
                
                {/* Notification Dot */}
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-2.5 w-2.5 drop-shadow-md">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-red-500"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600 border border-black/50"></span>
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
            className="w-9 h-9 flex items-center justify-center text-white hover:opacity-80 transition active:scale-90"
        >
            <Gift className="w-6 h-6 text-white drop-shadow-md" strokeWidth={2.5} />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-md overflow-hidden border border-white/20 bg-gradient-to-br from-[#E50914] to-[#8A050C] flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            {user?.photo_url && !imgError ? (
                <img 
                    src={user.photo_url} 
                    alt="User" 
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            ) : (
                <span className="text-white font-bold text-sm">
                    {user?.first_name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
                </span>
            )}
        </div>

      </div>
    </nav>
  );
};
