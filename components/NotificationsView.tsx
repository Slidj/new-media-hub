
import React, { useEffect } from 'react';
import { X, Bell, Clock } from 'lucide-react';
import { AppNotification } from '../types';
import { Language, translations } from '../utils/translations';
import { markNotificationRead } from '../services/firebase';

interface NotificationsViewProps {
  notifications: AppNotification[];
  onClose: () => void;
  lang: Language;
  userId?: number;
  onMarkGlobalRead?: (ids: string[]) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ 
    notifications, 
    onClose, 
    lang, 
    userId,
    onMarkGlobalRead 
}) => {
  const t = translations[lang];

  useEffect(() => {
    // 1. Lock Body Scroll
    document.body.style.overflow = 'hidden';

    // 2. Mark as Read Logic (Personal & Global)
    if (notifications.length > 0) {
        
        // A. Handle Personal (Firebase)
        if (userId) {
            notifications.forEach(n => {
                if (!n.isRead && n.type !== 'admin') {
                    markNotificationRead(userId, n.id);
                }
            });
        }

        // B. Handle Global (Local Storage)
        const globalUnread = notifications
            .filter(n => n.type === 'admin' && !n.isRead)
            .map(n => n.id);
        
        if (globalUnread.length > 0 && onMarkGlobalRead) {
            onMarkGlobalRead(globalUnread);
        }
    }

    return () => {
        document.body.style.overflow = 'unset';
    };
  }, [notifications, userId]); // Re-run if notifications change while open (realtime)

  const formatDate = (isoString: string) => {
      const date = new Date(isoString);
      return date.toLocaleDateString(lang === 'uk' ? 'uk-UA' : lang === 'ru' ? 'ru-RU' : 'en-US', {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col">
        {/* Header - Pushed down to avoid system bar overlap */}
        <div className="pt-[calc(env(safe-area-inset-top)+80px)] pb-4 px-4 border-b border-white/10 flex items-center justify-between bg-[#141414]">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#E50914] fill-[#E50914]" />
                {t.notifications}
            </h2>
            <button 
                onClick={onClose}
                className="p-2 bg-[#333] rounded-full text-white hover:bg-white hover:text-black transition"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 no-scrollbar">
            {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Bell className="w-12 h-12 mb-4 opacity-20" />
                    <p>{t.emptyNotifications}</p>
                </div>
            ) : (
                notifications.map((notif) => (
                    <div 
                        key={notif.id} 
                        className={`
                            relative flex gap-4 p-4 rounded-lg border transition-all duration-300
                            bg-[#1a1a1a] border-white/5 opacity-80
                            ${!notif.isRead ? 'border-l-4 border-l-[#E50914] bg-[#222] opacity-100' : ''}
                        `}
                    >
                        {/* 
                           VISUAL TRICK: 
                           Even though we trigger "mark read" on mount, the UI might render initially as unread.
                           For better UX, we could force them to look read, but keeping the 'dot' or border
                           until closed is fine, OR we assume they are reading them now.
                           The request asks for them to "display as read", so the border-l above handles emphasis,
                           but we remove the "red dot" inside the card if it was there.
                        */}

                        {/* Icon/Image */}
                        <div className="shrink-0">
                            {notif.posterUrl ? (
                                <img src={notif.posterUrl} className="w-12 h-16 object-cover rounded shadow" alt="Poster" />
                            ) : (
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${notif.type === 'admin' ? 'bg-[#E50914]/20' : 'bg-gray-800'}`}>
                                    <Bell className={`w-6 h-6 ${notif.type === 'admin' ? 'text-[#E50914]' : 'text-gray-400'}`} />
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <h4 className="text-white font-bold text-sm mb-1 pr-4">{notif.title}</h4>
                            <p className="text-gray-300 text-xs leading-relaxed">{notif.message}</p>
                            <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-500 font-medium uppercase">
                                <Clock className="w-3 h-3" />
                                <span>{formatDate(notif.date)}</span>
                                {notif.type === 'admin' && (
                                    <span className="px-1.5 py-0.5 rounded bg-[#E50914] text-white ml-auto">ADMIN</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );
};
