
import React, { useState, useEffect } from 'react';
import { 
    X, Users, Activity, Server, Send, MessageSquare, 
    Ban, CheckCircle, Search, User, Ticket, Clock, 
    Menu, LayoutDashboard, ChevronRight, ChevronLeft, Trash2, RotateCcw,
    Wifi, HelpCircle
} from 'lucide-react';
import { Language, translations } from '../utils/translations';
import { sendGlobalNotification, sendPersonalNotification, getAllUsers, toggleUserBan, deleteUserAccount, fetchSupportMessages, updateSupportMessageStatus, deleteSupportMessage } from '../services/firebase';
import { SupportMessage } from '../types';

interface AdminPanelProps {
  onClose: () => void;
  lang: Language;
}

type AdminView = 'dashboard' | 'users' | 'broadcast' | 'support';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, lang }) => {
  const t = translations[lang];
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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
  const [isOnlineFilterActive, setIsOnlineFilterActive] = useState(false);
  
  // Support Messages State
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [loadingSupport, setLoadingSupport] = useState(false);

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const ONLINE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes

  // Initial Load
  useEffect(() => {
      loadUsers();
      loadSupportMessages();
  }, []);

  // Reset pagination when search changes
  useEffect(() => {
      setCurrentPage(1);
  }, [userSearch, isOnlineFilterActive]);

  const loadUsers = async () => {
      setLoadingUsers(true);
      const data = await getAllUsers();
      setUsers(data);
      setLoadingUsers(false);
  };

  const loadSupportMessages = async () => {
      setLoadingSupport(true);
      const data = await fetchSupportMessages();
      setSupportMessages(data as SupportMessage[]);
      setLoadingSupport(false);
  };

  const handleToggleBan = async (userId: string, currentStatus: boolean) => {
      // Optimistic Update
      setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, isBanned: !currentStatus } : u
      ));
      
      await toggleUserBan(userId, currentStatus);
  };

  const handleDeleteUser = async (userId: string) => {
      if (!window.confirm(t.confirmDelete)) return;

      try {
          await deleteUserAccount(userId);
          // Remove from local state
          setUsers(prev => prev.filter(u => u.id !== userId));
      } catch (e) {
          console.error("Failed to delete user", e);
          alert("Failed to delete user. Check console.");
      }
  };

  // NEW: Delete all Guest Users
  const handleDeleteAllGuests = async () => {
      const guestUsers = users.filter(u => u.profile?.username === 'browser_guest');
      
      if (guestUsers.length === 0) {
          alert("No guest users found.");
          return;
      }

      if (!window.confirm(`Are you sure you want to delete ${guestUsers.length} guest users?`)) return;

      setLoadingUsers(true);
      try {
          // Execute all deletions in parallel
          await Promise.all(guestUsers.map(u => deleteUserAccount(u.id)));
          await loadUsers(); // Reload list
      } catch (e) {
          console.error("Bulk delete failed", e);
      } finally {
          setLoadingUsers(false);
      }
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

  // Calculate Online Users Count
  const onlineUsersCount = users.filter(u => {
      if (!u.lastActive) return false;
      const diffMs = new Date().getTime() - new Date(u.lastActive).getTime();
      return diffMs < ONLINE_THRESHOLD_MS;
  }).length;

  // 1. Filter Users
  const filteredUsers = users.filter(u => {
      const search = userSearch.toLowerCase();
      const name = `${u.profile?.first_name} ${u.profile?.last_name || ''}`.toLowerCase();
      const username = u.profile?.username?.toLowerCase() || '';
      const id = u.id.toString();
      
      const matchesSearch = name.includes(search) || username.includes(search) || id.includes(search);

      if (isOnlineFilterActive) {
          if (!u.lastActive) return false;
          const diffMs = new Date().getTime() - new Date(u.lastActive).getTime();
          const isOnline = diffMs < ONLINE_THRESHOLD_MS;
          return matchesSearch && isOnline;
      }

      return matchesSearch;
  });

  // 2. Paginate Logic
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (pageNum: number) => {
      if (pageNum >= 1 && pageNum <= totalPages) {
          setCurrentPage(pageNum);
          // Optional: Scroll to top of list
          const listTop = document.getElementById('user-list-top');
          if (listTop) listTop.scrollIntoView({ behavior: 'smooth' });
      }
  };

  // HELPER: Format Last Seen Logic
  const formatLastSeen = (isoString?: string) => {
      if (!isoString) return { text: t.never, color: "text-gray-500", isOnline: false };
      
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      // Check for Online status (active within 3 mins)
      const isOnline = diffMs < ONLINE_THRESHOLD_MS;
      if (isOnline) return { text: t.online, color: "text-green-500", isOnline: true };

      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (diffDays === 0) {
          return { text: `${t.today}, ${timeStr}`, color: "text-gray-300", isOnline: false };
      }
      
      if (diffDays === 1) {
          return { text: `${t.yesterday}, ${timeStr}`, color: "text-gray-400", isOnline: false };
      }

      if (diffDays <= 5) {
          return { text: `${diffDays} ${t.daysAgo}`, color: "text-gray-500", isOnline: false };
      }

      if (diffDays <= 30) {
          return { text: t.longAgo, color: "text-gray-600", isOnline: false };
      }

      return { text: t.monthAgo, color: "text-gray-700", isOnline: false };
  };

  // HELPER: Get Total Watch Time (Formatted)
  const formatTotalTime = (seconds: number) => {
    if (!seconds) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const menuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'users', label: t.users, icon: Users },
      { id: 'broadcast', label: t.sendMessage, icon: MessageSquare },
      { id: 'support', label: t.support || 'Support', icon: HelpCircle },
  ];

  const handleDashboardOnlineClick = () => {
      setIsOnlineFilterActive(true);
      setActiveView('users');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#000000] flex flex-col h-full">
        
        {/* HEADER */}
        <div className="bg-[#141414] border-b border-white/10 px-4 pt-[calc(env(safe-area-inset-top)+90px)] pb-4 flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-[#E50914] tracking-wide">ADMIN</span>
                </h2>
            </div>
            <button 
                onClick={onClose}
                className="p-2 bg-[#333] rounded-full text-white hover:bg-white hover:text-black transition"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* SIDEBAR NAVIGATION (DRAWER) */}
        <>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-30 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsSidebarOpen(false)}
            />
            
            {/* Drawer */}
            <div className={`
                fixed top-0 left-0 h-full w-[280px] bg-[#1a1a1a] z-40 border-r border-white/10 transform transition-transform duration-300 ease-out flex flex-col
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Sidebar Header */}
                <div className="pt-[calc(env(safe-area-inset-top)+90px)] px-6 pb-6 border-b border-white/5">
                    <h3 className="text-2xl font-bebas text-white tracking-widest">MEDIA HUB <span className="text-[#E50914]">ADMIN</span></h3>
                </div>

                <div className="flex-1 py-4 px-3 space-y-1">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveView(item.id as AdminView);
                                setIsSidebarOpen(false);
                                // Reset online filter when explicitly navigating to users via menu
                                if (item.id === 'users') setIsOnlineFilterActive(false);
                            }}
                            className={`
                                w-full flex items-center gap-4 p-3 rounded-lg transition-all
                                ${activeView === item.id 
                                    ? 'bg-[#E50914] text-white shadow-lg shadow-red-900/20' 
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }
                            `}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium text-sm tracking-wide">{item.label}</span>
                            {activeView === item.id && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                        </button>
                    ))}
                </div>
                
                <div className="p-4 border-t border-white/5 text-center text-[10px] text-gray-600">
                    SECURE ADMIN ENVIRONMENT
                </div>
            </div>
        </>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-safe p-4">
            
            {/* --- DASHBOARD VIEW --- */}
            {activeView === 'dashboard' && (
                <div className="space-y-6 animate-fade-in-up">
                    <h2 className="text-2xl font-bold text-white mb-4">Dashboard</h2>
                    
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* ONLINE USERS CARD */}
                        <div 
                            onClick={handleDashboardOnlineClick}
                            className="bg-[#1f1f1f] p-4 rounded-xl border border-white/5 flex flex-col justify-between h-32 relative overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors group"
                        >
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Wifi className="w-16 h-16 text-green-500" />
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <Wifi className="w-6 h-6 text-green-400" />
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                            </div>
                            <div>
                                <span className="text-3xl font-black text-white block">{onlineUsersCount}</span>
                                <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Online Now</span>
                            </div>
                        </div>

                        {/* TOTAL USERS CARD */}
                        <div 
                             onClick={() => { setActiveView('users'); setIsOnlineFilterActive(false); }}
                             className="bg-[#1f1f1f] p-4 rounded-xl border border-white/5 flex flex-col justify-between h-32 relative overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors group"
                        >
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Users className="w-16 h-16 text-blue-500" />
                            </div>
                            <Users className="w-6 h-6 text-blue-400 mb-2" />
                            <div>
                                <span className="text-3xl font-black text-white block">{users.length}</span>
                                <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t.users}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1f1f1f] p-4 rounded-xl border border-white/5 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <Activity className="w-16 h-16 text-yellow-500" />
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="w-6 h-6 text-yellow-400" />
                            </div>
                            <div>
                                <span className="text-3xl font-black text-white block">45.2K</span>
                                <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t.totalViews}</span>
                            </div>
                    </div>

                    {/* System Status */}
                    <div className="bg-[#1f1f1f] rounded-xl border border-white/5 overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2 bg-white/5">
                            <Server className="w-4 h-4 text-gray-400" />
                            <h3 className="text-white font-bold text-sm uppercase">{t.systemStatus}</h3>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm font-medium">Database (Firebase)</span>
                                <span className="flex items-center gap-1.5 text-green-400 text-[10px] font-bold px-2 py-0.5 bg-green-500/10 rounded border border-green-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    ONLINE
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm font-medium">TMDB API</span>
                                <span className="flex items-center gap-1.5 text-blue-400 text-[10px] font-bold px-2 py-0.5 bg-blue-500/10 rounded border border-blue-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    STABLE
                                </span>
                            </div>
                             <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm font-medium">CDN (Sveta)</span>
                                <span className="flex items-center gap-1.5 text-yellow-400 text-[10px] font-bold px-2 py-0.5 bg-yellow-500/10 rounded border border-yellow-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                                    98% UPTIME
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- USERS VIEW --- */}
            {activeView === 'users' && (
                <div className="space-y-4 animate-fade-in-up">
                    {/* Header with Search and Actions */}
                    <div className="sticky top-0 z-10 bg-black pt-2 pb-4 space-y-3" id="user-list-top">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input 
                                type="text"
                                placeholder="Search Name, @username, ID..."
                                className="w-full bg-[#1f1f1f] border border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] transition shadow-lg"
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                            />
                        </div>
                        
                        {/* Active Filter Indicator */}
                        {isOnlineFilterActive && (
                             <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-green-400 text-xs font-bold uppercase tracking-wider">Showing Online Users</span>
                                </div>
                                <button 
                                    onClick={() => setIsOnlineFilterActive(false)}
                                    className="p-1 hover:bg-green-500/20 rounded-full transition"
                                >
                                    <X className="w-3 h-3 text-green-400" />
                                </button>
                             </div>
                        )}

                        <div className="flex justify-between items-center px-1">
                             <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                                Visible: {filteredUsers.length}
                             </div>
                             
                             <div className="flex gap-2">
                                <button
                                    onClick={loadUsers}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2a2a2a] rounded text-[10px] font-bold text-white border border-white/10 hover:bg-[#333]"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    REFRESH
                                </button>
                                <button
                                    onClick={handleDeleteAllGuests}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/20 rounded text-[10px] font-bold text-red-400 border border-red-900/30 hover:bg-red-900/40"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    CLEAR GUESTS
                                </button>
                             </div>
                        </div>
                    </div>

                    {loadingUsers ? (
                         <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                            <div className="w-8 h-8 border-2 border-t-[#E50914] border-r-[#E50914] border-b-transparent border-l-transparent rounded-full animate-spin mb-2"></div>
                            Loading users...
                         </div>
                    ) : (
                        <div className="space-y-3 pb-20">
                            {paginatedUsers.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">
                                    <p className="text-sm">No users found.</p>
                                </div>
                            ) : (
                                paginatedUsers.map((u) => {
                                    const lastSeen = formatLastSeen(u.lastActive);
                                    const totalTime = formatTotalTime(u.totalWatchedSeconds);
                                    const tickets = u.tickets !== undefined ? u.tickets : 0;
                                    const isGuest = u.profile?.username === 'browser_guest';
                                    
                                    return (
                                    <div key={u.id} className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4 flex items-start gap-4 shadow-sm relative overflow-hidden animate-fade-in-up">
                                        {/* Status Line */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${u.isBanned ? 'bg-red-600' : 'bg-transparent'}`}></div>

                                        {/* Avatar */}
                                        <div className="relative flex-shrink-0">
                                            <div className="w-12 h-12 rounded-full bg-[#333] overflow-hidden ring-2 ring-white/10">
                                                {u.profile?.photo_url ? (
                                                    <img src={u.profile.photo_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white/50">
                                                        <User className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-[#1a1a1a] ${lastSeen.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-white font-bold text-base truncate">
                                                            {u.profile?.first_name} {u.profile?.last_name}
                                                        </h4>
                                                        {isGuest && (
                                                            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[9px] font-bold rounded uppercase border border-blue-500/30">Guest</span>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Telegram Username */}
                                                    {u.profile?.username && (
                                                        <div className="text-[#3b82f6] text-xs font-medium mb-1 truncate">
                                                            @{u.profile.username}
                                                        </div>
                                                    )}

                                                    {/* ID Box */}
                                                    <div className="inline-flex items-center gap-1.5 bg-black/40 border border-white/10 rounded px-1.5 py-0.5 mt-0.5 max-w-full">
                                                        <span className="text-[10px] text-gray-500 font-mono flex-shrink-0">ID</span>
                                                        <span className="text-[11px] text-gray-300 font-mono tracking-tight select-all truncate">{u.id}</span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleDeleteUser(u.id)}
                                                        className="p-2 rounded-lg bg-red-600/10 text-red-500 border border-red-600/30 hover:bg-red-600/20 transition-colors flex-shrink-0"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleToggleBan(u.id, u.isBanned)}
                                                        className={`
                                                            p-2 rounded-lg transition-colors flex-shrink-0
                                                            ${u.isBanned 
                                                                ? 'bg-green-600/10 text-green-500 border border-green-600/30' 
                                                                : 'bg-yellow-600/10 text-yellow-500 border border-yellow-600/30'
                                                            }
                                                        `}
                                                    >
                                                        {u.isBanned ? <CheckCircle className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {/* Stats Row */}
                                            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
                                                <div className="flex items-center gap-1.5">
                                                    <Ticket className="w-3.5 h-3.5 text-yellow-500" />
                                                    <span className="text-xs font-bold text-white">{tickets.toFixed(1)}</span>
                                                </div>
                                                <div className="w-px h-3 bg-white/20"></div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                                                    <span className="text-xs text-gray-300">{totalTime}</span>
                                                </div>
                                                <div className="ml-auto text-[10px] text-gray-500 font-medium">
                                                    {lastSeen.text}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )})
                            )}

                            {/* --- PAGINATION CONTROLS --- */}
                            {filteredUsers.length > ITEMS_PER_PAGE && (
                                <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-white/5">
                                    <button 
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`
                                            p-2 rounded-lg border transition-all
                                            ${currentPage === 1 
                                                ? 'bg-[#1a1a1a] text-gray-600 border-white/5 cursor-not-allowed' 
                                                : 'bg-[#222] text-white border-white/10 hover:bg-[#333]'
                                            }
                                        `}
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>

                                    <div className="text-sm font-bold text-gray-400">
                                        <span className="text-white">{currentPage}</span>
                                        <span className="mx-2 opacity-50">/</span>
                                        <span>{totalPages}</span>
                                    </div>

                                    <button 
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`
                                            p-2 rounded-lg border transition-all
                                            ${currentPage === totalPages 
                                                ? 'bg-[#1a1a1a] text-gray-600 border-white/5 cursor-not-allowed' 
                                                : 'bg-[#222] text-white border-white/10 hover:bg-[#333]'
                                            }
                                        `}
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            )}

            {/* --- BROADCAST VIEW --- */}
            {activeView === 'broadcast' && (
                <div className="space-y-4 animate-fade-in-up">
                    <div className="bg-[#1f1f1f] p-5 rounded-xl border border-white/5 space-y-5">
                        <div className="flex items-center gap-2 text-white font-bold pb-2 border-b border-white/5">
                            <MessageSquare className="w-5 h-5 text-[#E50914]" />
                            {t.sendMessage}
                        </div>

                        <div className="space-y-4">
                             <div>
                                 <label className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-1.5">User ID (Optional)</label>
                                 <input 
                                    type="number" 
                                    placeholder={t.sendToAll} 
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-[#E50914] outline-none transition"
                                    value={targetUserId}
                                    onChange={(e) => setTargetUserId(e.target.value)}
                                 />
                                 <p className="text-[10px] text-gray-600 mt-1">Leave empty to broadcast to everyone.</p>
                             </div>
                             
                             <div>
                                 <label className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-1.5">{t.title}</label>
                                 <input 
                                    type="text" 
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm font-bold focus:border-[#E50914] outline-none transition"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                 />
                             </div>
                             
                             <div>
                                 <label className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-1.5">{t.message}</label>
                                 <textarea 
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm h-32 resize-none focus:border-[#E50914] outline-none transition"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                 />
                             </div>

                             {successMsg && (
                                 <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm p-3 rounded-lg text-center font-bold">
                                     {successMsg}
                                 </div>
                             )}

                             <button 
                                disabled={isSending}
                                onClick={handleSend}
                                className="w-full bg-[#E50914] text-white font-bold py-3.5 rounded-lg hover:bg-red-700 active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
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
                </div>
            )}
            {/* --- SUPPORT VIEW --- */}
            {activeView === 'support' && (
                <div className="space-y-4 animate-fade-in-up">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <HelpCircle className="w-5 h-5 text-[#E50914]" />
                            Support Messages
                        </h3>
                        <button 
                            onClick={loadSupportMessages}
                            className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
                        >
                            <RotateCcw className={`w-4 h-4 ${loadingSupport ? 'animate-spin text-[#E50914]' : ''}`} />
                        </button>
                    </div>

                    {loadingSupport ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-white/10 border-t-[#E50914] rounded-full animate-spin"></div>
                        </div>
                    ) : supportMessages.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No support messages found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {supportMessages.map(msg => (
                                <div key={msg.id} className="bg-[#1f1f1f] p-4 rounded-xl border border-white/5 relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-bold">{msg.username}</span>
                                                <span className="text-xs text-gray-500">ID: {msg.userId}</span>
                                            </div>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(msg.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (window.confirm("Delete this message?")) {
                                                    await deleteSupportMessage(msg.id);
                                                    setSupportMessages(prev => prev.filter(m => m.id !== msg.id));
                                                }
                                            }}
                                            className="p-1.5 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-gray-300 text-sm mt-3 whitespace-pre-wrap bg-black/30 p-3 rounded-lg border border-white/5">
                                        {msg.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};
