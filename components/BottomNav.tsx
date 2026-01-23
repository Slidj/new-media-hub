
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
    // Додаємо тактильний відгук (вібрацію) для користувача
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    onTabChange(tab);
  };

  // Helper class for buttons
  const btnClass = "flex-1 flex flex-col items-center justify-center gap-1 py-2 cursor-pointer transition active:scale-90 select-none touch-manipulation";
  const activeClass = "text-white";
  const inactiveClass = "text-gray-500 hover:text-gray-300";

  return (
    <div className="fixed bottom-0 left-0 w-full bg-black/95 backdrop-blur-md border-t border-[#222] px-2 md:hidden z-[200] flex justify-between items-center pb-safe">
      
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
