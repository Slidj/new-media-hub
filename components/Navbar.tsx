
// Update: Navbar with Version Indicator v5.0 (Green for success)
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
}

export const Navbar: React.FC<NavbarProps> = ({ user, lang, onSearchClick, onHomeClick, activeTab }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isTelegram, setIsTelegram] = useState(false);
  const [imgError, setImgError] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    if (window.Telegram?.WebApp?.initData) {
      setIsTelegram(true);
    }

    const handleScroll = () => {
      const offset = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(offset > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleForceReload = () => {
     window.location.reload();
  };

  return (
    <nav 
      className={`
        fixed top-0 left-0 w-full z-[1000] transition-all duration-500 ease-in-out
        ${isScrolled || activeTab === 'search' || activeTab === 'coming_soon'
          ? 'bg-black/95 backdrop-blur-2xl shadow-xl' 
          : 'bg-gradient-to-b from-black/80 via-black/20 to-transparent'
        }
        ${isTelegram ? 'pt-safe' : ''}
      `}
    >
      <div 
        className={`
          flex items-center justify-between px-4 md:px-12 transition-all duration-300
          ${isTelegram ? 'mt-4 mb-2' : 'py-4 md:py-6'}
        `}
      >
        <div className="flex items-center gap-6 md:gap-12">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer transition-transform duration-300 active:scale-95 origin-left"
            onClick={onHomeClick}
          >
            <h1 
                className="text-3xl md:text-5xl font-bebas tracking-normal text-transparent bg-clip-text bg-gradient-to-b from-[#E50914] to-[#B20710] uppercase drop-shadow-logo"
            >
              MEDIA HUB
            </h1>
            {/* VERSION INDICATOR v5.0: Green to confirm update */}
            <button 
                onClick={(e) => { e.stopPropagation(); handleForceReload(); }}
                className="text-[10px] font-bold text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded bg-green-500/10 hover:bg-green-500 hover:text-white transition-colors animate-pulse"
                title="Update Successful - Tap to reload"
            >
                v5.0
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6 text-white">
          <Search 
            className={`hidden md:block w-6 h-6 cursor-pointer transition hover:scale-110 ${activeTab === 'search' ? 'text-[#E50914]' : 'hover:text-gray-300'}`}
            onClick={onSearchClick}
          />

          <Gift className="w-6 h-6 cursor-pointer hover:text-gray-300 transition hover:scale-110" />

          <Bell className="w-6 h-6 cursor-pointer hover:text-gray-300 transition hover:scale-110" />
          
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="relative w-8 h-8 rounded overflow-hidden shadow-md group-hover:ring-2 ring-white/20 transition bg-[#333]">
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
