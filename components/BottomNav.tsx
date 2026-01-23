
// Update: Bottom Navigation
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

  return (
    <div className="fixed bottom-0 left-0 w-full bg-black border-t border-[#222] py-3 px-6 md:hidden z-50 flex justify-between items-center text-gray-500 text-[10px] pb-safe">
      <div 
        className={`flex flex-col items-center gap-1 cursor-pointer transition hover:scale-105 ${activeTab === 'home' ? 'text-white' : 'hover:text-gray-300'}`}
        onClick={() => onTabChange('home')}
      >
        <Home className={`w-6 h-6 ${activeTab === 'home' ? 'stroke-white' : ''}`} />
        <span className="font-medium">{t.home}</span>
      </div>
      
      <div 
        className={`flex flex-col items-center gap-1 cursor-pointer transition hover:scale-105 ${activeTab === 'search' ? 'text-white' : 'hover:text-gray-300'}`}
        onClick={() => onTabChange('search')}
      >
        <Search className={`w-6 h-6 ${activeTab === 'search' ? 'stroke-white' : ''}`} />
        <span className="font-medium">{t.search}</span>
      </div>

      <div 
        className={`flex flex-col items-center gap-1 cursor-pointer transition hover:scale-105 ${activeTab === 'coming_soon' ? 'text-white' : 'hover:text-gray-300'}`}
        onClick={() => onTabChange('coming_soon')}
      >
        <MonitorPlay className={`w-6 h-6 ${activeTab === 'coming_soon' ? 'stroke-white' : ''}`} />
        <span className="font-medium">{t.comingSoon}</span>
      </div>

      <div className="flex flex-col items-center gap-1 hover:text-gray-300 cursor-pointer hover:scale-105 transition">
        <Download className="w-6 h-6" />
        <span className="font-medium">{t.downloads}</span>
      </div>
      <div className="flex flex-col items-center gap-1 hover:text-gray-300 cursor-pointer hover:scale-105 transition">
        <Menu className="w-6 h-6" />
        <span className="font-medium">{t.more}</span>
      </div>
    </div>
  );
};
