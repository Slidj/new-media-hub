
import React, { useState, useEffect } from 'react';
import { Search, Bell, User } from 'lucide-react';
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
      const offset = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(offset > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isMobileApp = platform === 'ios' || platform === 'android' || platform === 'weba';

  return (
    <nav 
      className={`
        fixed top-0 left-0 w-full z-[100] transition-all duration-500 ease-in-out
        ${isScrolled || activeTab === 'search'
          ? 'bg-black/40 backdrop-blur-xl shadow-lg border-b border-white/5' 
          : 'bg-gradient-to-b from-black/50 via-black/10 to-transparent'
        }
        ${isMobileApp ? 'pt-safe pb-2' : 'pt-0'}
      `}
    >
      <div 
        className={`
          flex items-center justify-between px-4 md:px-12 transition-all duration-300
          /* Значно збільшений відступ, щоб логотип опустився нижче кнопок Telegram */
          ${isMobileApp ? 'mt-20 mb-2' : 'py-5 md:py-7'}
        `}
      >
        <div className="flex items-center gap-6 md:gap-12">
          {/* Logo - Bold, non-italic, original Red */}
          <div 
            className="cursor-pointer transition-transform duration-300 active:scale-95"
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

        <div className="flex items-center gap-5 text-white">
          <Search 
            className={`w-6 h-6 cursor-pointer transition hover:scale-110 ${activeTab === 'search' ? 'text-[#E50914]' : 'hover:text-gray-300'}`}
            onClick={onSearchClick}
          />
          <Bell className="hidden md:block w-6 h-6 cursor-pointer hover:text-gray-300" />
          
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
