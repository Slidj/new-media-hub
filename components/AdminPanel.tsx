
import React, { useState } from 'react';
import { X, Users, Activity, Database, Server, Send, MessageSquare } from 'lucide-react';
import { Language, translations } from '../utils/translations';
import { sendGlobalNotification, sendPersonalNotification } from '../services/firebase';

interface AdminPanelProps {
  onClose: () => void;
  lang: Language;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, lang }) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'stats' | 'messages'>('messages'); // Default to messages for testing
  
  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSend = async () => {
      if (!title || !message) return;
      
      setIsSending(true);
      try {
          if (targetUserId.trim()) {
              // Personal
              await sendPersonalNotification(parseInt(targetUserId), title, message, 'admin');
          } else {
              // Global
              await sendGlobalNotification(title, message);
          }
          setSuccessMsg(t.successSent);
          setTitle('');
          setMessage('');
          setTimeout(() => setSuccessMsg(''), 3000);
      } catch (e) {
          console.error(e);
      } finally {
          setIsSending(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#000000] overflow-y-auto no-scrollbar pb-safe">
        {/* Header */}
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

        {/* Tabs */}
        <div className="flex gap-4 px-4 pt-4">
             <button onClick={() => setActiveTab('stats')} className={`text-sm font-bold uppercase pb-2 ${activeTab === 'stats' ? 'text-white border-b-2 border-[#E50914]' : 'text-gray-500'}`}>Stats</button>
             <button onClick={() => setActiveTab('messages')} className={`text-sm font-bold uppercase pb-2 ${activeTab === 'messages' ? 'text-white border-b-2 border-[#E50914]' : 'text-gray-500'}`}>{t.sendMessage}</button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
            
            {activeTab === 'stats' && (
                <>
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
                    </div>
                </div>
                </>
            )}

            {activeTab === 'messages' && (
                <div className="bg-[#1f1f1f] p-4 rounded-xl border border-white/5 space-y-4">
                    <div className="flex items-center gap-2 text-white font-bold mb-2">
                        <MessageSquare className="w-5 h-5 text-[#E50914]" />
                        {t.sendMessage}
                    </div>

                    <div className="space-y-3">
                         <div>
                             <label className="text-xs text-gray-400 uppercase block mb-1">{t.sendToUser} (Optional)</label>
                             <input 
                                type="number" 
                                placeholder={t.sendToAll} 
                                className="w-full bg-black/50 border border-white/10 rounded p-2 text-white text-sm"
                                value={targetUserId}
                                onChange={(e) => setTargetUserId(e.target.value)}
                             />
                         </div>
                         <div>
                             <label className="text-xs text-gray-400 uppercase block mb-1">{t.title}</label>
                             <input 
                                type="text" 
                                className="w-full bg-black/50 border border-white/10 rounded p-2 text-white text-sm font-bold"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                             />
                         </div>
                         <div>
                             <label className="text-xs text-gray-400 uppercase block mb-1">{t.message}</label>
                             <textarea 
                                className="w-full bg-black/50 border border-white/10 rounded p-2 text-white text-sm h-24"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                             />
                         </div>

                         {successMsg && <p className="text-green-400 text-sm text-center">{successMsg}</p>}

                         <button 
                            disabled={isSending}
                            onClick={handleSend}
                            className="w-full bg-[#E50914] text-white font-bold py-3 rounded hover:bg-red-700 transition flex items-center justify-center gap-2"
                         >
                             {isSending ? 'Sending...' : (
                                 <>
                                     <Send className="w-4 h-4" />
                                     {t.send}
                                 </>
                             )}
                         </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
