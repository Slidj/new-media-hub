
import React, { useState } from 'react';
import { X, Users, Activity, Database, Server } from 'lucide-react';
import { Language, translations } from '../utils/translations';

interface AdminPanelProps {
  onClose: () => void;
  lang: Language;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, lang }) => {
  const t = translations[lang];

  return (
    <div className="fixed inset-0 z-[100] bg-[#000000] overflow-y-auto no-scrollbar pb-safe">
        {/* Header - UPDATED PADDING to safe-area + 80px */}
        <div className="sticky top-0 z-10 bg-[#141414]/90 backdrop-blur-md border-b border-white/10 px-4 pt-[calc(env(safe-area-inset-top)+80px)] pb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="text-[#E50914]">{t.adminPanel}</span>
            </h2>
            <button 
                onClick={onClose}
                className="p-2 bg-[#333] rounded-full text-white hover:bg-white hover:text-black transition"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1f1f1f] p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-2">
                    <Users className="w-8 h-8 text-blue-400" />
                    <span className="text-2xl font-black text-white">1,240</span>
                    <span className="text-xs text-gray-400 uppercase font-bold">{t.users}</span>
                </div>
                <div className="bg-[#1f1f1f] p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-2">
                    <Activity className="w-8 h-8 text-green-400" />
                    <span className="text-2xl font-black text-white">45.2K</span>
                    <span className="text-xs text-gray-400 uppercase font-bold">{t.totalViews}</span>
                </div>
            </div>

            {/* System Status */}
            <div className="bg-[#1f1f1f] rounded-xl border border-white/5 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                    <Server className="w-5 h-5 text-gray-400" />
                    <h3 className="text-white font-bold">{t.systemStatus}</h3>
                </div>
                <div className="p-4 space-y-4">
                     <div className="flex items-center justify-between">
                         <span className="text-gray-400 text-sm">Database (Firebase)</span>
                         <span className="text-green-400 text-xs font-bold px-2 py-1 bg-green-400/10 rounded">ONLINE</span>
                     </div>
                     <div className="flex items-center justify-between">
                         <span className="text-gray-400 text-sm">TMDB API</span>
                         <span className="text-green-400 text-xs font-bold px-2 py-1 bg-green-400/10 rounded">STABLE</span>
                     </div>
                     <div className="flex items-center justify-between">
                         <span className="text-gray-400 text-sm">Gemini AI</span>
                         <span className="text-green-400 text-xs font-bold px-2 py-1 bg-green-400/10 rounded">READY</span>
                     </div>
                </div>
            </div>

            {/* Placeholder for future features */}
            <div className="bg-[#1f1f1f] p-6 rounded-xl border border-white/5 text-center border-dashed border-2 border-[#333]">
                <Database className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">More admin tools coming soon...</p>
            </div>
        </div>
    </div>
  );
};
