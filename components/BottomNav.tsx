
import React from 'react';
import { Home, Search, MonitorPlay, Plus, Menu } from 'lucide-react';
import { Language, translations } from '../utils/translations';
import { TabType } from '../types';
import { Haptics } from '../utils/haptics';
import { Audio } from '../utils/audio';

interface BottomNavProps {
  lang: Language;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onMoreClick: () => void;
  theme?: 'default' | 'glass';
}

export const BottomNav: React.FC<BottomNavProps> = ({ lang, activeTab, onTabChange, onMoreClick, theme = 'default' }) => {
  const t = translations[lang];

  const handleTabClick = (tab: TabType) => {
    Haptics.light();
    Audio.playSwipe(); // Swipe/Whoosh sound for tab change
    onTabChange(tab);
  };

  const handleMoreClick = () => {
    Haptics.light();
    Audio.playClick();
    onMoreClick();
  };

  const btnClass = "flex-1 flex flex-col items-center justify-center gap-1 py-2 cursor-pointer transition active:scale-90 select-none touch-manipulation focus:outline-none rounded-xl";
  
  // Glass Theme Styles
  const glassContainerClass = "fixed bottom-6 left-4 right-4 h-20 bg-[#020617]/60 backdrop-blur-2xl border border-white/10 ring-1 ring-white/5 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] flex justify-around items-center px-2 z-50 transition-all duration-500";
  const defaultContainerClass = "fixed bottom-0 left-0 w-full pb-safe safe-area-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.5)] bg-black border-t border-[#222] flex justify-between items-center z-50 transition-all duration-500";

  const getGlassBtnClass = (isActive: boolean) => `
    relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300
    ${isActive 
        ? 'bg-white/10 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)] scale-110 -translate-y-2' 
        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
    }
  `;

  const activeClass = "text-white scale-105";
  const inactiveClass = "text-gray-500 hover:text-gray-300";

  return (
    // Z-INDEX set to 50 to match Navbar. Will be covered by Modal (z-100) and Player (z-200)
    <div className={`md:hidden z-50 transition-all duration-500 ${theme === 'glass' ? glassContainerClass : defaultContainerClass}`}>
      
      <button 
        type="button"
        className={theme === 'glass' ? getGlassBtnClass(activeTab === 'home') : `${btnClass} ${activeTab === 'home' ? activeClass : inactiveClass}`}
        onClick={() => handleTabClick('home')}
      >
        <Home className={theme === 'glass' ? "w-6 h-6" : "w-6 h-6"} strokeWidth={theme === 'glass' && activeTab === 'home' ? 2.5 : 2} />
        {theme !== 'glass' && <span className="text-[10px] font-medium">{t.home}</span>}
        {theme === 'glass' && activeTab === 'home' && (
            <span className="absolute -bottom-2 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,1)]" />
        )}
      </button>
      
      <button 
        type="button"
        className={theme === 'glass' ? getGlassBtnClass(activeTab === 'search') : `${btnClass} ${activeTab === 'search' ? activeClass : inactiveClass}`}
        onClick={() => handleTabClick('search')}
      >
        <Search className={theme === 'glass' ? "w-6 h-6" : "w-6 h-6"} strokeWidth={theme === 'glass' && activeTab === 'search' ? 2.5 : 2} />
        {theme !== 'glass' && <span className="text-[10px] font-medium">{t.search}</span>}
        {theme === 'glass' && activeTab === 'search' && (
            <span className="absolute -bottom-2 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,1)]" />
        )}
      </button>

      <button 
        type="button"
        className={theme === 'glass' ? getGlassBtnClass(activeTab === 'coming_soon') : `${btnClass} ${activeTab === 'coming_soon' ? activeClass : inactiveClass}`}
        onClick={() => handleTabClick('coming_soon')}
      >
        <MonitorPlay className={theme === 'glass' ? "w-6 h-6" : "w-6 h-6"} strokeWidth={theme === 'glass' && activeTab === 'coming_soon' ? 2.5 : 2} />
        {theme !== 'glass' && <span className="text-[10px] font-medium">{t.comingSoon}</span>}
        {theme === 'glass' && activeTab === 'coming_soon' && (
            <span className="absolute -bottom-2 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,1)]" />
        )}
      </button>

      <button 
        type="button"
        className={theme === 'glass' ? getGlassBtnClass(activeTab === 'my_list') : `${btnClass} ${activeTab === 'my_list' ? activeClass : inactiveClass}`}
        onClick={() => handleTabClick('my_list')}
      >
        <Plus className={theme === 'glass' ? "w-6 h-6" : "w-6 h-6"} strokeWidth={theme === 'glass' && activeTab === 'my_list' ? 2.5 : 2} />
        {theme !== 'glass' && <span className="text-[10px] font-medium">{t.myList}</span>}
        {theme === 'glass' && activeTab === 'my_list' && (
            <span className="absolute -bottom-2 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,1)]" />
        )}
      </button>
      
      <button 
        type="button"
        className={theme === 'glass' ? getGlassBtnClass(false) : `${btnClass} ${inactiveClass}`}
        onClick={handleMoreClick}
      >
        <Menu className={theme === 'glass' ? "w-6 h-6" : "w-6 h-6"} />
        {theme !== 'glass' && <span className="text-[10px] font-medium">{t.more}</span>}
      </button>
    </div>
  );
};
