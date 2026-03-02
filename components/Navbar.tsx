
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

  const glassIslandStyle = "bg-[#1e293b]/40 backdrop-blur-xl border border-white/20 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.6)] ring-1 ring-white/10 rounded-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.7)] hover:bg-[#1e293b]/60";
  const glassIconClass = `flex items-center justify-center w-10 h-10 ${glassIslandStyle}`;
  const glassIconColor = "text-blue-100 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]";

  return (
    <nav 
      className={`
        fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out pb-4 pt-[calc(env(safe-area-inset-top)+80px)]
        ${theme === 'glass' 
            ? 'bg-transparent'
            : isScrolled || activeTab === 'search' || activeTab === 'coming_soon'
                ? 'bg-black shadow-md' 
                : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent'
        }
      `}
    >
      <div 
        className="flex items-center justify-between px-4 md:px-12 transition-all duration-300"
      >
        <div className="flex items-center gap-6 md:gap-12">
          {/* Logo */}
          <div 
            className={`flex items-center gap-2 cursor-pointer transition-all duration-500 active:scale-95 origin-left ${
                theme === 'glass' 
                ? `h-10 px-4 ${glassIslandStyle}` 
                : ''
            }`}
            onClick={onHomeClick}
          >
            <h1 
                className={`font-bebas text-transparent bg-clip-text uppercase flex items-center gap-2 ${
                    theme === 'glass'
                    ? 'text-2xl md:text-3xl bg-gradient-to-b from-white via-blue-50 to-blue-200 drop-shadow-[0_2px_8px_rgba(59,130,246,0.3)]'
                    : 'text-3xl md:text-5xl bg-gradient-to-b from-[#E50914] to-[#B20710] drop-shadow-logo'
                }`}
            >
              MEDIA HUB
            </h1>
            {logoIcon && <span className={`drop-shadow-none text-white ${theme === 'glass' ? 'text-xl md:text-2xl' : 'text-2xl md:text-4xl'}`}>{logoIcon}</span>}
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6 text-white">
          {/* Search */}
          <div className={`hidden md:flex ${theme === 'glass' ? glassIconClass : ''}`}>
              <Search 
                className={`w-6 h-6 cursor-pointer transition hover:scale-110 ${
                    theme === 'glass' 
                        ? glassIconColor 
                        : activeTab === 'search' ? 'text-[#E50914]' : 'hover:text-gray-300'
                }`}
                onClick={onSearchClick}
              />
          </div>

          {/* Gift */}
          <div className={theme === 'glass' ? glassIconClass : ''}>
              <Gift className={`w-6 h-6 cursor-pointer transition hover:scale-110 ${theme === 'glass' ? glassIconColor : 'hover:text-gray-300'}`} />
          </div>

          {/* NOTIFICATION BELL */}
          <div 
            className={`relative cursor-pointer group ${theme === 'glass' ? glassIconClass : ''}`} 
            onClick={onBellClick}
          >
              <Bell 
                className={`w-6 h-6 transition-all duration-300 ${
                    unreadCount > 0 
                    ? theme === 'glass'
                        ? 'text-cyan-300 fill-cyan-300/20 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-bell-ring'
                        : 'text-[#E50914] fill-[#E50914] animate-bell-ring' 
                    : theme === 'glass' ? glassIconColor : 'text-white hover:text-gray-300'
                }`} 
              />
              {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme === 'glass' ? 'bg-cyan-400' : 'bg-red-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${theme === 'glass' ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-[#E50914]'}`}></span>
                  </span>
              )}
          </div>
          
          {/* Avatar */}
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className={`relative overflow-hidden shadow-md group-hover:ring-2 ring-white/20 transition bg-[#333] ${
                theme === 'glass' 
                    ? `w-10 h-10 ${glassIslandStyle} p-0 overflow-hidden` 
                    : 'w-8 h-8 rounded'
            }`}>
                {user?.photo_url && !imgError ? (
                  <img 
                    src={user.photo_url} 
                    alt={user.first_name} 
                    className="w-full h-full object-cover" 
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                    <span className="text-xs font-bold text-white uppercase">
                      {user?.first_name ? user.first_name[0] : <User className="w-4 h-4" />}
                    </span>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
