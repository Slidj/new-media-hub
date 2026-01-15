
import React, { useState, useEffect } from 'react';
import { Search, Bell, User, Gift } from 'lucide-react';
import { WebAppUser } from '../types';
import { Language, translations } from '../utils/translations';

interface NavbarProps {
  user: WebAppUser | null;
  lang: Language;
  onSearchClick: () => void;
  onHomeClick: () => void;
  activeTab: 'home' | 'search';
}

export const Navbar: React.FC<NavbarProps> = ({ user, lang, onSearchClick, onHomeClick, activeTab }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [platform, setPlatform] = useState<string>('');
  const t = translations[lang];

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      setPlatform(window.Telegram.WebApp.platform);
    }

    const handleScroll = () => {
      if (window.scrollY > 15) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Визначаємо, чи це мобільний додаток Telegram
  const isMobileApp = platform === 'ios' || platform === 'android' || platform === 'weba';

  return (
    <nav 
      className={`
        fixed top-0 left-0 w-full z-[100] transition-all duration-500 ease-in-out
        pt-safe
        ${isScrolled || activeTab === 'search'
          ? 'bg-[#141414] shadow-2xl' 
          : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent'
        }
      `}
    >
      <div 
        className={`
          flex items-center justify-between px-4 md:px-12 transition-all duration-300
          ${isScrolled ? 'py-3 md:py-4' : 'py-5 md:py-7'}
          ${isMobileApp && !isScrolled ? 'mt-10 md:mt-0' : 'mt-0'} 
        `}
      >
        <div className="flex items-center gap-6 md:gap-12">
          {/* Logo */}
          <div 
            className={`cursor-pointer transition-transform duration-300 ${isScrolled ? 'scale-90 md:scale-95' : 'scale-100'}`}
            onClick={onHomeClick}
          >
            <h1 className="text-xl md:text-3xl font-black tracking-tighter text-[#E50914] drop-shadow-md uppercase">
              MEDIA HUB
            </h1>
          </div>
          
          {/* Desktop Menu */}
          <ul className="hidden lg:flex gap-6 text-sm text-gray-200 font-medium">
            <li 
                className={`cursor-pointer transition hover:text-white ${activeTab === 'home' ? 'text-white font-bold' : ''}`}
                onClick={onHomeClick}
            >
                {t.home}
            </li>
            <li className="cursor-pointer hover:text-white transition">{t.tvShows}</li>
            <li className="cursor-pointer hover:text-white transition">{t.movies}</li>
            <li className="cursor-pointer hover:text-white transition">{t.newPopular}</li>
            <li className="cursor-pointer hover:text-white transition">{t.myList}</li>
          </ul>
        </div>

        <div className="flex items-center gap-4 md:gap-6 text-white">
          <Search 
            className={`w-5 h-5 cursor-pointer transition hover:scale-110 ${activeTab === 'search' ? 'text-[#E50914]' : 'hover:text-gray-300'}`}
            onClick={onSearchClick}
          />
          <span className="hidden md:block text-sm cursor-pointer hover:text-gray-300">{t.kids}</span>
          <Bell className="w-5 h-5 cursor-pointer hover:text-gray-300" />
          
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
      
      {/* Bottom border line when scrolled */}
      <div className={`h-[1px] w-full bg-white/5 transition-opacity duration-500 ${isScrolled ? 'opacity-100' : 'opacity-0'}`} />
    </nav>
  );
};
