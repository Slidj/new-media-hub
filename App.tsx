
// Update: Main App Component Integration
import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Modal } from './components/Modal';
import { BottomNav } from './components/BottomNav';
import { SkeletonCard } from './components/SkeletonCard';
import { Preloader } from './components/Preloader';
import { SearchView } from './components/SearchView';
import { ComingSoonView } from './components/ComingSoonView';
import { CategoryNav, Category } from './components/CategoryNav';
import { MyListView } from './components/MyListView'; 
import { Player } from './components/Player';
import { MoreMenu } from './components/MoreMenu'; 
import { AdminPanel } from './components/AdminPanel'; 
import { NotificationsView } from './components/NotificationsView'; // New
import { Movie, WebAppUser, TabType, AppNotification } from './types';
import { API } from './services/tmdb';
import { 
    syncUser, 
    subscribeToUserData, 
    toggleMyList, 
    toggleLike, 
    toggleDislike, 
    addToHistory,
    subscribeToPersonalNotifications,
    subscribeToGlobalNotifications
} from './services/firebase';
import { Language, getLanguage, translations } from './utils/translations';
import { Star, Tv } from 'lucide-react';

// --- OPTIMIZED MOVIE CARD COMPONENT ---
interface MovieCardProps {
    movie: Movie;
    index: number;
    activeCategory: Category;
    onClick: (movie: Movie) => void;
}

const MovieCard = memo(({ movie, index, activeCategory, onClick }: MovieCardProps) => {
    const isTop10 = activeCategory === 'trending' && index < 10;
    const ribbonPath = "M0 0H28V36C28 36 14 26 0 36V0Z";

    // Розрахунок затримки для ефекту "ланцюжка".
    const animDelay = (index % 20) * 70; 

    return (
        <div 
            className="opacity-0 animate-fade-in-up fill-mode-forwards"
            style={{ 
                animationDelay: `${animDelay}ms`,
                willChange: 'transform, opacity'
            }}
        >
            <div 
                className="
                    relative cursor-pointer aspect-[2/3] rounded-md overflow-hidden bg-[#181818] group
                    transform-gpu transition-transform duration-200 ease-out
                    hover:scale-105 hover:z-50 hover:shadow-2xl hover:shadow-black
                    active:scale-95 active:brightness-75
                "
                onClick={() => onClick(movie)}
            >
                <img
                    src={movie.smallPosterUrl || movie.posterUrl}
                    className="w-full h-full object-cover bg-[#222]"
                    alt={movie.title}
                    loading="lazy"
                    decoding="async"
                />
                
                {isTop10 && (
                <div className="absolute top-0 right-0 z-20 w-7 h-9 drop-shadow-[0_2px_4px_rgba(229,9,20,0.5)]">
                        <svg viewBox="0 0 28 36" className="absolute inset-0 w-full h-full text-[#E50914]" fill="currentColor">
                        <path d={ribbonPath} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pb-1">
                        <span className="text-[6px] font-bold leading-none text-white/90 mb-0.5">TOP</span>
                        <span className="text-sm font-black leading-none text-white">10</span>
                        </div>
                </div>
                )}

                {movie.mediaType === 'tv' && (
                <div className="absolute top-0 left-0 z-20 w-7 h-9 drop-shadow-[0_2px_4px_rgba(229,9,20,0.5)]">
                        <svg viewBox="0 0 28 36" className="absolute inset-0 w-full h-full text-[#E50914]" fill="currentColor">
                        <path d={ribbonPath} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center pb-1">
                        <Tv className="w-3.5 h-3.5 text-white fill-white/20" strokeWidth={2.5} />
                        </div>
                </div>
                )}

                <div className="absolute bottom-2 right-2 z-20">
                <div className="bg-black/60 backdrop-blur-md px-1 py-0.5 rounded flex items-center gap-1 border border-white/10">
                    <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-[10px] font-bold text-white">{movie.rating}</span>
                </div>
                </div>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
        </div>
    );
});

// --- MAIN APP COMPONENT ---

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  
  // NEW STATES FOR MENU AND ADMIN
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [user, setUser] = useState<WebAppUser | null>(null);
  
  // Firebase Data States
  const [myList, setMyList] = useState<Movie[]>([]);
  const [likedMovies, setLikedMovies] = useState<string[]>([]);
  const [dislikedMovies, setDislikedMovies] = useState<string[]>([]);
  const [watchHistory, setWatchHistory] = useState<Movie[]>([]);

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [lang, setLang] = useState<Language>(() => {
    try {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code) {
        return getLanguage(window.Telegram.WebApp.initDataUnsafe.user.language_code);
      }
    } catch (e) {
      console.error("Language detection failed", e);
    }
    return 'en';
  });
  
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [activeCategory, setActiveCategory] = useState<Category>('trending');
  
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      if (tg.isVersionAtLeast && tg.isVersionAtLeast('6.1')) {
        tg.setHeaderColor('#000000');
        tg.setBackgroundColor('#000000');
      }

      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        setUser(tgUser);
        // Sync user with Firebase immediately on load
        syncUser(tgUser);

        if (tgUser.language_code) {
           const detectedLang = getLanguage(tgUser.language_code);
           if (detectedLang !== lang) {
             setLang(detectedLang);
           }
        }
      } else {
        // Dev fallback
        const devUser = {
            id: 123456,
            first_name: "Guest",
            last_name: "User",
            username: "guest",
            photo_url: ""
        };
        setUser(devUser);
        syncUser(devUser);
      }
    }
  }, []);

  // Subscribe to Firebase Updates (Profile + Notifications)
  useEffect(() => {
    if (!user?.id) return;
    
    // 1. User Data
    const unsubscribeUser = subscribeToUserData(user.id, (data) => {
      if (data.myList) setMyList(data.myList);
      if (data.likedMovies) setLikedMovies(data.likedMovies);
      if (data.dislikedMovies) setDislikedMovies(data.dislikedMovies);
      if (data.watchHistory) setWatchHistory(data.watchHistory);
    });

    // 2. Personal Notifications
    const unsubscribePersonalNotifs = subscribeToPersonalNotifications(user.id, (personalNotifs) => {
        setNotifications(prev => {
             // Basic merge strategy: keep global ones, replace personal ones
             const globalOnly = prev.filter(n => n.type === 'admin' && !n.id.startsWith('personal_'));
             const merged = [...globalOnly, ...personalNotifs];
             return merged.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
    });

    // 3. Global Notifications
    const unsubscribeGlobalNotifs = subscribeToGlobalNotifications((globalNotifs) => {
        setNotifications(prev => {
            const personalOnly = prev.filter(n => n.type !== 'admin');
            const merged = [...personalOnly, ...globalNotifs];
            return merged.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
    });

    return () => {
        unsubscribeUser();
        unsubscribePersonalNotifs();
        unsubscribeGlobalNotifs();
    };
  }, [user]);

  // Calculate Unread Count
  useEffect(() => {
      const unread = notifications.filter(n => !n.isRead).length;
      setUnreadCount(unread);
  }, [notifications]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);


  const handleCategoryChange = useCallback((newCategory: Category) => {
    if (activeCategory === newCategory) return;
    setActiveCategory(newCategory);
    setMovies([]); 
    setPage(1); 
    setHasMore(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeCategory]);

  const loadMovies = useCallback(async (pageNum: number, language: string, category: Category) => {
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    setLoading(true);
    
    const locale = language === 'uk' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-US';
    
    try {
        let newMovies: Movie[] = [];
        
        switch (category) {
            case 'movies':
                newMovies = await API.fetchDiscoverMovies(pageNum, locale);
                break;
            case 'tv':
                newMovies = await API.fetchDiscoverTV(pageNum, locale);
                break;
            case 'cartoons':
                newMovies = await API.fetchDiscoverCartoons(pageNum, locale);
                break;
            case 'trending':
            default:
                newMovies = await API.fetchTrending(pageNum, locale);
                break;
        }
        
        if (newMovies.length === 0) {
          setHasMore(false);
        } else {
          setMovies(prev => {
            if (pageNum === 1) return newMovies;

            const existingIds = new Set(prev.map(m => m.id));
            const uniqueNew = newMovies.filter(m => !existingIds.has(m.id));
            return [...prev, ...uniqueNew];
          });

          if (pageNum === 1 && newMovies.length > 0) {
            const randomIndex = Math.floor(Math.random() * Math.min(newMovies.length, 10));
            const randomHero = newMovies[randomIndex]; 
            const isTv = randomHero.mediaType === 'tv';
            const logoUrl = await API.fetchMovieLogo(randomHero.id, isTv);
            setFeaturedMovie({ ...randomHero, logoUrl });
          }
        }
    } catch (error) {
        console.error("Failed to load movies", error);
    } finally {
        setLoading(false);
        isLoadingRef.current = false;
    }
  }, []); 

  useEffect(() => {
    if (activeTab === 'home') {
        loadMovies(page, lang, activeCategory);
    }
  }, [page, lang, activeTab, activeCategory, loadMovies]);

  // Infinite Scroll Logic (Optimized Threshold)
  useEffect(() => {
    if (activeTab !== 'home') return; 

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop || window.pageYOffset;
      const clientHeight = document.documentElement.clientHeight;
      
      if (scrollTop + clientHeight >= scrollHeight - 400 && !loading && hasMore && !isLoadingRef.current) {
        setPage(prev => prev + 1);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, activeTab]);

  const handleMovieClick = useCallback((movie: Movie) => {
    setSelectedMovie(movie);
  }, []);

  const handlePlay = (movie: Movie) => {
      setPlayingMovie(movie);
      // Record history when play starts
      if (user?.id) {
          addToHistory(user.id, movie);
      }
  };

  const handleToggleList = async (movie: Movie) => {
    if (!user?.id) return;
    const isListed = myList.some(m => m.id === movie.id);
    await toggleMyList(user.id, movie, isListed);
  };

  const handleToggleLike = async (movie: Movie) => {
    if (!user?.id) return;
    const isLiked = likedMovies.includes(movie.id);
    await toggleLike(user.id, movie.id, isLiked);
  };

  const handleToggleDislike = async (movie: Movie) => {
    if (!user?.id) return;
    const isDisliked = dislikedMovies.includes(movie.id);
    await toggleDislike(user.id, movie.id, isDisliked);
  };

  if (showSplash) {
    return <Preloader />;
  }

  return (
    <div className="relative min-h-screen bg-black overflow-x-hidden font-sans antialiased text-white pb-24">
      <Navbar 
        user={user} 
        lang={lang} 
        onSearchClick={() => setActiveTab('search')}
        onHomeClick={() => {
            setActiveTab('home');
            handleCategoryChange('trending');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        activeTab={activeTab}
        unreadCount={unreadCount}
        onBellClick={() => setIsNotificationsOpen(true)}
      />
      
      {activeTab === 'home' && (
        <>
            <CategoryNav 
                lang={lang} 
                activeCategory={activeCategory} 
                onSelectCategory={handleCategoryChange} 
            />

            {featuredMovie && (
                 <Hero 
                    movie={featuredMovie} 
                    onMoreInfo={() => setSelectedMovie(featuredMovie)}
                    onPlay={() => handlePlay(featuredMovie)}
                    lang={lang}
                 />
            )}

            <main className={`relative z-10 w-full bg-black -mt-1`}>
                <section className="px-2 md:px-12 pb-10 pt-2">
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
                        {movies.map((movie, index) => (
                            <MovieCard 
                                key={`${movie.id}-${index}`}
                                movie={movie}
                                index={index}
                                activeCategory={activeCategory}
                                onClick={handleMovieClick}
                            />
                        ))}

                        {loading && Array.from({ length: 6 }).map((_, i) => (
                            <div key={`skeleton-${i}`} className="opacity-0 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                                <SkeletonCard />
                            </div>
                        ))}
                    </div>
                    
                    {!hasMore && movies.length > 0 && (
                        <div className="text-center text-gray-500 py-10 opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                            <p>{translations[lang].endOfList}</p>
                        </div>
                    )}
                </section>
            </main>
        </>
      )}

      {activeTab === 'search' && (
        <SearchView 
          lang={lang} 
          onMovieSelect={setSelectedMovie} 
        />
      )}

      {activeTab === 'coming_soon' && (
        <ComingSoonView
            lang={lang}
            onMovieSelect={setSelectedMovie}
            user={user}
        />
      )}

      {activeTab === 'my_list' && (
          <MyListView 
             myList={myList}
             history={watchHistory}
             onMovieSelect={setSelectedMovie}
             lang={lang}
          />
      )}

      <BottomNav 
        lang={lang} 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onMoreClick={() => setIsMoreMenuOpen(true)}
      />

      {selectedMovie && (
        <Modal 
          movie={selectedMovie} 
          onClose={() => setSelectedMovie(null)} 
          onPlay={(m) => handlePlay(m)}
          onMovieSelect={setSelectedMovie} 
          onToggleList={handleToggleList}
          onToggleLike={handleToggleLike}
          onToggleDislike={handleToggleDislike}
          isInList={myList.some(m => m.id === selectedMovie.id)}
          isLiked={likedMovies.includes(selectedMovie.id)}
          isDisliked={dislikedMovies.includes(selectedMovie.id)}
          lang={lang}
        />
      )}

      {playingMovie && (
        <Player 
          movie={playingMovie} 
          onClose={() => setPlayingMovie(null)} 
        />
      )}

      <MoreMenu 
          isOpen={isMoreMenuOpen}
          onClose={() => setIsMoreMenuOpen(false)}
          lang={lang}
          user={user}
          onAdminClick={() => setIsAdminPanelOpen(true)}
      />

      {/* Admin Panel Overlay */}
      {isAdminPanelOpen && (
          <AdminPanel 
             onClose={() => setIsAdminPanelOpen(false)}
             lang={lang}
          />
      )}

      {/* Notifications View Overlay */}
      {isNotificationsOpen && (
          <NotificationsView 
            notifications={notifications}
            onClose={() => setIsNotificationsOpen(false)}
            lang={lang}
            userId={user?.id}
          />
      )}
    </div>
  );
}

export default App;
