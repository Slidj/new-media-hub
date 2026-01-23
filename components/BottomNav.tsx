
import React from 'react';
import { Home, Search, MonitorPlay, Download, Menu } from 'lucide-react';
import { Language, translations } from '../utils/translations';
import { TabType } from '../types';

interface BottomNavProps {
  lang: Language;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ lang, activeTab, onTabChange }) => {
  const t = translations[lang];

  const handleTabClick = (tab: TabType) => {
    // FIX: Check if HapticFeedback is supported (version >= 6.1)
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      if (tg.isVersionAtLeast && tg.isVersionAtLeast('6.1') && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
      }
    }
    onTabChange(tab);
  };

  const btnClass = "flex-1 flex flex-col items-center justify-center gap-1 py-2 cursor-pointer transition active:scale-90 select-none touch-manipulation focus:outline-none";
  const activeClass = "text-white scale-105";
  const inactiveClass = "text-gray-500 hover:text-gray-300";

  return (
    // Z-INDEX set to 9999 to guarantee it is on top
    <div className="fixed bottom-0 left-0 w-full bg-black/95 backdrop-blur-xl border-t border-[#222] px-2 md:hidden z-[9999] flex justify-between items-center pb-safe safe-area-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
      
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
        className={`${btnClass} ${inactiveClass}`}
      >
        <Download className="w-6 h-6" />
        <span className="text-[10px] font-medium">{t.downloads}</span>
      </button>
      
      <button 
        type="button"
        className={`${btnClass} ${inactiveClass}`}
      >
        <Menu className="w-6 h-6" />
        <span className="text-[10px] font-medium">{t.more}</span>
      </button>
    </div>
  );
};
