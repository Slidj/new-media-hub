
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
  const t = translations[lang];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`
        fixed top-0 w-full z-[100] transition-all duration-700 ease-in-out
        ${isScrolled || activeTab === 'search'
          ? 'bg-black/95 backdrop-blur-md shadow-lg py-3' 
          : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent py-5'
        }
      `}
    >
      <div className="flex items-center justify-between px-4 md:px-12">
        <div className="flex items-center gap-8">
          {/* Logo - Media Hub (Netflix Style) */}
          <div 
            className={`cursor-pointer transition-transform duration-500 ${isScrolled ? 'scale-90' : 'scale-100'}`}
            onClick={onHomeClick}
          >
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-[#E50914] drop-shadow-sm uppercase font-sans">
              MEDIA HUB
            </h1>
          </div>
          
          {/* Desktop Menu */}
          <ul className="hidden lg:flex gap-6 text-sm text-gray-200 font-medium">
            <li 
                className={`cursor-pointer transition hover:scale-105 duration-200 ${activeTab === 'home' ? 'text-white font-bold' : 'hover:text-white'}`}
                onClick={onHomeClick}
            >
                {t.home}
            </li>
            <li className="cursor-pointer hover:text-white transition hover:scale-105 duration-200">{t.tvShows}</li>
            <li className="cursor-pointer hover:text-white transition hover:scale-105 duration-200">{t.movies}</li>
            <li className="cursor-pointer hover:text-white transition hover:scale-105 duration-200">{t.newPopular}</li>
            <li className="cursor-pointer hover:text-white transition hover:scale-105 duration-200">{t.myList}</li>
          </ul>
        </div>

        <div className="flex items-center gap-4 md:gap-6 text-white">
          <Search 
            className={`w-5 h-5 cursor-pointer transition hover:scale-110 ${activeTab === 'search' ? 'text-[#E50914]' : 'hover:text-gray-300'}`}
            onClick={onSearchClick}
          />
          <span className="hidden md:block text-sm cursor-pointer hover:text-gray-300 font-medium">{t.kids}</span>
          <Gift className="w-5 h-5 hidden sm:block cursor-pointer hover:text-gray-300 transition hover:scale-110" />
          <Bell className="w-5 h-5 cursor-pointer hover:text-gray-300 transition hover:scale-110" />
          
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-md group-hover:ring-2 ring-[#E50914] transition bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shrink-0">
                {user?.photo_url && !imgError ? (
                  <img 
                    src={user.photo_url} 
                    alt={user.first_name} 
                    className="w-full h-full object-cover" 
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {user?.first_name ? user.first_name[0].toUpperCase() : <User className="w-5 h-5" />}
                  </span>
                )}
            </div>
            {user && (
               <span className="text-sm font-medium hidden sm:block max-w-[80px] truncate text-gray-200 group-hover:text-white transition">
                 {user.first_name}
               </span>
            )}
            <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-white group-hover:rotate-180 transition-transform duration-300 ml-1"></div>
          </div>
        </div>
      </div>
    </nav>
  );
};
