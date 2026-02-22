
import React, { useState } from 'react';
import { X, Settings, Info, MessageCircle, ShieldAlert, User, ChevronRight, Ticket, Dices, Globe } from 'lucide-react';
import { Language, translations } from '../utils/translations';
import { WebAppUser } from '../types';
import { isAdmin } from '../utils/adminIds';

interface MoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  user: WebAppUser | null;
  userTickets?: number; // New prop
  onAdminClick: () => void;
}

export const MoreMenu: React.FC<MoreMenuProps> = ({ isOpen, onClose, lang, user, userTickets = 0, onAdminClick }) => {
  const t = translations[lang];
  const isUserAdmin = isAdmin(user?.id);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const menuItems = [
      { icon: Settings, label: t.settings, onClick: () => {} }, // Placeholder
      { icon: MessageCircle, label: t.support, onClick: () => {} }, // Placeholder
      { icon: Info, label: t.about, onClick: () => setIsAboutOpen(true) },
  ];

  if (isAboutOpen) {
      return (
          <div className="fixed inset-0 z-[80] bg-[#121212] flex flex-col animate-fade-in">
              {/* Header */}
              <div className="pt-[calc(env(safe-area-inset-top)+20px)] pb-4 px-6 flex items-center justify-between border-b border-white/5 bg-[#1a1a1a]">
                  <h2 className="text-xl font-bold text-white">{t.about}</h2>
                  <button onClick={() => setIsAboutOpen(false)} className="p-2 bg-[#333] rounded-full text-white hover:bg-white hover:text-black transition">
                      <X className="w-5 h-5" />
                  </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  {/* Logo / Brand */}
                  <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-24 h-24 bg-gradient-to-br from-[#E50914] to-[#B20710] rounded-2xl shadow-2xl flex items-center justify-center rotate-3 transform hover:rotate-0 transition duration-500">
                          <span className="text-4xl font-black text-white tracking-tighter">MH</span>
                      </div>
                      <div>
                          <h1 className="text-3xl font-black text-white tracking-wide">MEDIA HUB</h1>
                          <p className="text-xs text-gray-500 font-mono mt-1">v9.2 BETA</p>
                      </div>
                      <p className="text-gray-300 leading-relaxed max-w-xs">
                          {t.aboutDescription}
                      </p>
                  </div>

                  {/* Features Grid */}
                  <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-white/10 pb-2">{t.aboutFeatures}</h3>
                      
                      <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex gap-4 items-start">
                          <div className="p-2 bg-yellow-500/10 rounded-lg shrink-0">
                              <Ticket className="w-6 h-6 text-yellow-500" />
                          </div>
                          <div>
                              <h4 className="text-white font-bold text-sm mb-1">{t.featureTicketsTitle}</h4>
                              <p className="text-xs text-gray-400 leading-relaxed">{t.featureTickets}</p>
                          </div>
                      </div>

                      <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex gap-4 items-start">
                          <div className="p-2 bg-red-500/10 rounded-lg shrink-0">
                              <Dices className="w-6 h-6 text-red-500" />
                          </div>
                          <div>
                              <h4 className="text-white font-bold text-sm mb-1">{t.featureRandomTitle}</h4>
                              <p className="text-xs text-gray-400 leading-relaxed">{t.featureRandom}</p>
                          </div>
                      </div>

                      <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex gap-4 items-start">
                          <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                              <Globe className="w-6 h-6 text-blue-500" />
                          </div>
                          <div>
                              <h4 className="text-white font-bold text-sm mb-1">{t.featureMultiTitle}</h4>
                              <p className="text-xs text-gray-400 leading-relaxed">{t.featureMulti}</p>
                          </div>
                      </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-8 text-center">
                      <p className="text-[10px] text-gray-600">
                          © 2024 MediaHub. All rights reserved.
                          <br />
                          Designed for seamless entertainment.
                      </p>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Drawer */}
      <div 
        className={`
            fixed top-0 right-0 h-full w-[80%] max-w-sm bg-[#121212] z-[70] 
            transform transition-transform duration-300 ease-out shadow-2xl border-l border-white/10
            flex flex-col
            ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header - UPDATED PADDING to safe-area + 80px */}
        <div className="pt-[calc(env(safe-area-inset-top)+80px)] pb-6 px-6 bg-[#1a1a1a] flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 overflow-hidden flex items-center justify-center border border-white/10 shrink-0">
                    {user?.photo_url ? (
                        <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span className="font-bold text-white">{user?.first_name?.[0] || <User className="w-5 h-5" />}</span>
                    )}
                 </div>
                 <div className="flex flex-col min-w-0">
                     <span className="text-white font-bold text-sm truncate max-w-[150px]">{user?.first_name} {user?.last_name}</span>
                     
                     {/* TICKETS DISPLAY */}
                     <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-4 h-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                            <Ticket className="w-2.5 h-2.5 text-yellow-500" />
                        </div>
                        <span className="text-xs font-bold text-yellow-500">{userTickets.toFixed(1)} Tickets</span>
                     </div>

                     {isUserAdmin && <span className="text-[10px] text-[#E50914] font-bold tracking-widest uppercase mt-0.5">ADMIN</span>}
                 </div>
            </div>
            <button onClick={onClose} className="p-2 bg-[#333] rounded-full text-white hover:bg-white hover:text-black transition">
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
            
            {/* Admin Button (Only if Admin) */}
            {isUserAdmin && (
                <div 
                    onClick={() => {
                        onClose();
                        onAdminClick();
                    }}
                    className="flex items-center gap-4 p-4 rounded-lg bg-[#E50914]/10 border border-[#E50914]/30 cursor-pointer active:scale-95 transition hover:bg-[#E50914]/20 mb-4 group"
                >
                    <div className="p-2 bg-[#E50914] rounded-full text-white shadow-lg shadow-red-900/30">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-white font-bold text-sm">{t.adminPanel}</h4>
                        <p className="text-[10px] text-gray-400">{t.adminAccess}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition" />
                </div>
            )}

            {menuItems.map((item, idx) => (
                <div 
                    key={idx}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/5 active:bg-white/10 cursor-pointer transition group"
                    onClick={item.onClick}
                >
                    <item.icon className="w-6 h-6 text-gray-400 group-hover:text-white transition" />
                    <span className="text-gray-300 group-hover:text-white font-medium text-sm flex-1">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
                </div>
            ))}
        </div>

        {/* Footer Info */}
        <div className="p-6 border-t border-white/5 text-center">
             <h3 className="text-lg font-bebas text-gray-600 tracking-wider">MEDIA HUB</h3>
             <p className="text-[10px] text-gray-700 mt-1">Version 9.2 (BETA)</p>
        </div>
      </div>
    </>
  );
};
