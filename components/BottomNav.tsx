
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
  
  const activeClass = theme === 'glass' 
    ? "text-cyan-300 scale-110 bg-white/10 [&>svg]:stroke-[2.5px] [&>svg]:drop-shadow-[0_0_5px_rgba(34,211,238,0.9)]" 
    : "text-white scale-105";
    
  const inactiveClass = theme === 'glass'
    ? "text-slate-400 hover:text-blue-100 hover:bg-white/5 [&>svg]:stroke-[1.5px]"
    : "text-gray-500 hover:text-gray-300";

  const getGlassIconClass = (isActive: boolean, canFill: boolean = false) => {
      if (theme !== 'glass') return `w-6 h-6 ${isActive ? 'stroke-white' : ''}`;
      return `w-6 h-6 transition-all duration-300 ${isActive && canFill ? 'fill-cyan-300/20' : ''}`;
  };

  return (
    // Z-INDEX set to 50 to match Navbar. Will be covered by Modal (z-100) and Player (z-200)
    <div className={`md:hidden z-50 flex justify-between items-center transition-all duration-500 ${
        theme === 'glass' 
            ? 'fixed bottom-6 left-4 right-4 rounded-2xl bg-[#1e293b]/40 backdrop-blur-xl border border-white/20 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.6)] ring-1 ring-white/10 px-2 py-2' 
            : 'fixed bottom-0 left-0 w-full pb-safe safe-area-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.5)] bg-black border-t border-[#222]'
    }`}>
      
      <button 
        type="button"
        className={`${btnClass} ${activeTab === 'home' ? activeClass : inactiveClass}`}
        onClick={() => handleTabClick('home')}
      >
        <Home className={getGlassIconClass(activeTab === 'home', true)} />
        <span className="text-[10px] font-medium">{t.home}</span>
      </button>
      
      <button 
        type="button"
        className={`${btnClass} ${activeTab === 'search' ? activeClass : inactiveClass}`}
        onClick={() => handleTabClick('search')}
      >
        <Search className={getGlassIconClass(activeTab === 'search', true)} />
        <span className="text-[10px] font-medium">{t.search}</span>
      </button>

      <button 
        type="button"
        className={`${btnClass} ${activeTab === 'coming_soon' ? activeClass : inactiveClass}`}
        onClick={() => handleTabClick('coming_soon')}
      >
        <MonitorPlay className={getGlassIconClass(activeTab === 'coming_soon', true)} />
        <span className="text-[10px] font-medium">{t.comingSoon}</span>
      </button>

      <button 
        type="button"
        className={`${btnClass} ${activeTab === 'my_list' ? activeClass : inactiveClass}`}
        onClick={() => handleTabClick('my_list')}
      >
        <Plus className={getGlassIconClass(activeTab === 'my_list', false)} />
        <span className="text-[10px] font-medium">{t.myList}</span>
      </button>
      
      <button 
        type="button"
        className={`${btnClass} ${inactiveClass}`}
        onClick={handleMoreClick}
      >
        <Menu className={getGlassIconClass(false, false)} />
        <span className="text-[10px] font-medium">{t.more}</span>
      </button>
    </div>
  );
};
