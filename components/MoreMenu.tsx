
import React from 'react';
import { X, Settings, Info, MessageCircle, ShieldAlert, User, ChevronRight } from 'lucide-react';
import { Language, translations } from '../utils/translations';
import { WebAppUser } from '../types';
import { isAdmin } from '../utils/adminIds';

interface MoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  user: WebAppUser | null;
  onAdminClick: () => void;
}

export const MoreMenu: React.FC<MoreMenuProps> = ({ isOpen, onClose, lang, user, onAdminClick }) => {
  const t = translations[lang];
  const isUserAdmin = isAdmin(user?.id);

  const menuItems = [
      { icon: Settings, label: t.settings, onClick: () => {} }, // Placeholder
      { icon: MessageCircle, label: t.support, onClick: () => {} }, // Placeholder
      { icon: Info, label: t.about, onClick: () => {} }, // Placeholder
  ];

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
                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 overflow-hidden flex items-center justify-center border border-white/10">
                    {user?.photo_url ? (
                        <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span className="font-bold text-white">{user?.first_name?.[0] || <User className="w-5 h-5" />}</span>
                    )}
                 </div>
                 <div className="flex flex-col">
                     <span className="text-white font-bold text-sm truncate max-w-[150px]">{user?.first_name} {user?.last_name}</span>
                     {isUserAdmin && <span className="text-[10px] text-[#E50914] font-bold tracking-widest uppercase">ADMIN</span>}
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
             <p className="text-[10px] text-gray-700 mt-1">Version 9.1 (BETA)</p>
        </div>
      </div>
    </>
  );
};
