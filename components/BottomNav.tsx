
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
}

export const BottomNav: React.FC<BottomNavProps> = ({ lang, activeTab, onTabChange, onMoreClick }) => {
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

  const btnClass = "flex-1 flex flex-col items-center justify-center gap-1 py-2 cursor-pointer transition active:scale-90 select-none touch-manipulation focus:outline-none";
  const activeClass = "text-white scale-105";
  const inactiveClass = "text-gray-500 hover:text-gray-300";

  return (
    // Z-INDEX set to 50 to match Navbar. Will be covered by Modal (z-100) and Player (z-200)
    <div className="fixed bottom-0 left-0 w-full bg-black border-t border-[#222] px-2 md:hidden z-50 flex justify-between items-center pb-safe safe-area-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
      
      <button 
        type="button"
        className={`${btnClass} ${activeTab === 'home' ? activeClass : inactiveClass}`}
        onClick={() => handleTabClick('home')}
      >
        <Home className={`w-6 h-6 ${activeTab === 'home' ? 'stroke-white' : ''}`} />
        <span className="text-[10px] font-medium">{t.home}</span>
      </button>
      
      <button 
        type="button"
        className={`${btnClass} ${activeTab === 'search' ? activeClass : inactiveClass}`}
        onClick={() => handleTabClick('search')}
      >
        <Search className={`w-6 h-6 ${activeTab === 'search' ? 'stroke-white' : ''}`} />
        <span className="text-[10px] font-medium">{t.search}</span>
      </button>

      <button 
        type="button"
        className={`${btnClass} ${activeTab === 'coming_soon' ? activeClass : inactiveClass}`}
        onClick={() => handleTabClick('coming_soon')}
      >
        <MonitorPlay className={`w-6 h-6 ${activeTab === 'coming_soon' ? 'stroke-white' : ''}`} />
        <span className="text-[10px] font-medium">{t.comingSoon}</span>
      </button>

      <button 
        type="button"
        className={`${btnClass} ${activeTab === 'my_list' ? activeClass : inactiveClass}`}
        onClick={() => handleTabClick('my_list')}
      >
        <Plus className={`w-6 h-6 ${activeTab === 'my_list' ? 'stroke-white' : ''}`} />
        <span className="text-[10px] font-medium">{t.myList}</span>
      </button>
      
      <button 
        type="button"
        className={`${btnClass} ${inactiveClass}`}
        onClick={handleMoreClick}
      >
        <Menu className="w-6 h-6" />
        <span className="text-[10px] font-medium">{t.more}</span>
      </button>
    </div>
  );
};
