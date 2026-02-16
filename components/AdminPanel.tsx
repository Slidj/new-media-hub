
import React, { useState, useEffect } from 'react';
import { X, Users, Activity, Database, Server, Send, MessageSquare, Ban, CheckCircle, Search, User, Ticket, Clock } from 'lucide-react';
import { Language, translations } from '../utils/translations';
import { sendGlobalNotification, sendPersonalNotification, getAllUsers, toggleUserBan } from '../services/firebase';

interface AdminPanelProps {
  onClose: () => void;
  lang: Language;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, lang }) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'stats' | 'messages' | 'users'>('users');
  
  // Stats & Messages State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Fetch users when Users tab is active
  useEffect(() => {
      if (activeTab === 'users') {
          loadUsers();
      }
  }, [activeTab]);

  const loadUsers = async () => {
      setLoadingUsers(true);
      const data = await getAllUsers();
      setUsers(data);
      setLoadingUsers(false);
  };

  const handleToggleBan = async (userId: string, currentStatus: boolean) => {
      // Optimistic Update
      setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, isBanned: !currentStatus } : u
      ));
      
      await toggleUserBan(userId, currentStatus);
  };

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

  const filteredUsers = users.filter(u => {
      const search = userSearch.toLowerCase();
      const name = `${u.profile?.first_name} ${u.profile?.last_name || ''}`.toLowerCase();
      const username = u.profile?.username?.toLowerCase() || '';
      const id = u.id.toString();
      return name.includes(search) || username.includes(search) || id.includes(search);
  });

  // HELPER: Format Last Seen Date
  const formatLastSeen = (isoString?: string) => {
      if (!isoString) return { text: "Never", color: "text-gray-500", isOnline: false };
      
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      // Check if Online (Activity within last 3 minutes)
      const isOnline = diffMs < 3 * 60 * 1000;
      if (isOnline) return { text: "Online now", color: "text-green-500", isOnline: true };

      if (diffDays === 0) {
          if (date.getDate() === now.getDate()) {
              return { 
                  text: `Today at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, 
                  color: "text-gray-400", isOnline: false 
              };
          }
          return { text: "Yesterday", color: "text-gray-400", isOnline: false };
      }
      
      if (diffDays === 1) return { text: "Yesterday", color: "text-gray-400", isOnline: false };
      if (diffDays < 7) return { text: `${diffDays} days ago`, color: "text-gray-500", isOnline: false };
      if (diffDays < 30) return { text: "A few weeks ago", color: "text-gray-500", isOnline: false };
      if (diffDays < 60) return { text: "1 month ago", color: "text-gray-600", isOnline: false };
      
      return { text: "Long time ago", color: "text-gray-700", isOnline: false };
  };

  // HELPER: Get Daily Watch Time
  const getDailyWatchTime = (user: any) => {
    const today = new Date().toISOString().split('T')[0];
    const stats = user.dailyStats;
    
    // If stats don't exist OR the date stored is not today, return 0
    if (!stats || stats.date !== today) {
        return "0m";
    }
    
    const seconds = stats.watchedSeconds || 0;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
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
        <div className="flex gap-6 px-4 pt-4 border-b border-white/10">
             <button onClick={() => setActiveTab('users')} className={`text-sm font-bold uppercase pb-3 transition-colors ${activeTab === 'users' ? 'text-white border-b-2 border-[#E50914]' : 'text-gray-500 hover:text-gray-300'}`}>{t.users}</button>
             <button onClick={() => setActiveTab('messages')} className={`text-sm font-bold uppercase pb-3 transition-colors ${activeTab === 'messages' ? 'text-white border-b-2 border-[#E50914]' : 'text-gray-500 hover:text-gray-300'}`}>{t.sendMessage}</button>
             <button onClick={() => setActiveTab('stats')} className={`text-sm font-bold uppercase pb-3 transition-colors ${activeTab === 'stats' ? 'text-white border-b-2 border-[#E50914]' : 'text-gray-500 hover:text-gray-300'}`}>Stats</button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
            
            {/* USERS TAB */}
            {activeTab === 'users' && (
                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input 
                            type="text"
                            placeholder="Search by Name, Username or ID"
                            className="w-full bg-[#1f1f1f] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white/30 transition"
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                        />
                    </div>

                    {loadingUsers ? (
                        <div className="text-center py-10 text-gray-500">Loading users...</div>
                    ) : (
                        <div className="space-y-3">
                            {filteredUsers.map((u) => {
                                const lastSeen = formatLastSeen(u.lastActive);
                                const dailyTime = getDailyWatchTime(u);
                                const tickets = u.tickets !== undefined ? u.tickets : 0;
                                
                                return (
                                <div key={u.id} className="bg-[#1a1a1a] border border-white/5 rounded-lg p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                                        {/* Avatar with Status Dot */}
                                        <div className="relative w-10 h-10 flex-shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-[#333] overflow-hidden">
                                                {u.profile?.photo_url ? (
                                                    <img src={u.profile.photo_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white/50">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>
                                            {/* Status Dot */}
                                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1a1a1a] ${lastSeen.isOnline ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                                        </div>

                                        <div className="flex flex-col min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-bold text-sm truncate">{u.profile?.first_name} {u.profile?.last_name}</span>
                                                {u.isBanned && (
                                                    <span className="px-1.5 py-0.5 bg-red-900/50 text-red-500 text-[10px] font-bold rounded uppercase border border-red-900">BANNED</span>
                                                )}
                                            </div>
                                            
                                            {/* Info Badges */}
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                {/* Last Seen */}
                                                <span className={`text-[10px] font-medium ${lastSeen.color}`}>
                                                    {lastSeen.text}
                                                </span>
                                            </div>
                                            
                                            {/* Tickets & Watch Time (New Row) */}
                                            <div className="flex items-center gap-3 mt-1.5">
                                                {/* Daily Watch Time */}
                                                <div className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                                                    <Clock className="w-3 h-3" />
                                                    <span className="font-bold">{dailyTime} today</span>
                                                </div>

                                                {/* Total Tickets (Always Visible) */}
                                                <div className="flex items-center gap-1 text-[10px] text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">
                                                    <Ticket className="w-3 h-3" />
                                                    <span className="font-bold">{tickets.toFixed(2)}</span>
                                                </div>
                                            </div>

                                            <span className="text-gray-600 text-[9px] font-mono mt-0.5 opacity-50">ID: {u.id}</span>
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={() => handleToggleBan(u.id, u.isBanned)}
                                        className={`
                                            ml-2 p-2 rounded-lg transition-colors flex-shrink-0
                                            ${u.isBanned 
                                                ? 'bg-green-600/20 text-green-500 hover:bg-green-600/30' 
                                                : 'bg-red-600/20 text-red-500 hover:bg-red-600/30'
                                            }
                                        `}
                                    >
                                        {u.isBanned ? <CheckCircle className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                                    </button>
                                </div>
                            )})}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'stats' && (
                <>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#1f1f1f] p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-blue-400" />
                        <span className="text-2xl font-black text-white">{users.length || '...'}</span>
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
