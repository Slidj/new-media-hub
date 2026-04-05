

// Update: Main App Component Integration
import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Modal } from './components/Modal';
import { BottomNav } from './components/BottomNav';
import { MovieCard } from './components/MovieCard';
import { Preloader } from './components/Preloader';
import { SearchView } from './components/SearchView';
import { ComingSoonView } from './components/ComingSoonView';
import { CategoryNav, Category } from './components/CategoryNav';
import { MyListView } from './components/MyListView'; 
import { Player } from './components/Player';
import { MoreMenu } from './components/MoreMenu'; 
import { AdminPanel } from './components/AdminPanel'; 
import { NotificationsView } from './components/NotificationsView'; 
import { BannedView } from './components/BannedView'; 
import { Movie, WebAppUser, TabType, AppNotification, Activity } from './types';
import { API, fetchMovieById } from './services/tmdb';
import { 
    syncUser, 
    subscribeToUserData, 
    toggleMyList, 
    toggleLike, 
    toggleDislike, 
    addToHistory,
    subscribeToPersonalNotifications,
    subscribeToGlobalNotifications,
    deletePersonalNotification,
    subscribeToUserBanStatus, 
    updateUserHeartbeat,
    recordGlobalActivity,
    subscribeToGlobalActivity,
    subscribeToGlobalSettings
} from './services/firebase';
import { Language, getLanguage, translations } from './utils/translations';
import { Star, Tv } from 'lucide-react';
import { Haptics } from './utils/haptics';
import { Audio } from './utils/audio';
import { AnimatePresence, motion } from 'framer-motion';
import { HorizontalRow } from './components/HorizontalRow';
import { NowWatchingRow } from './components/NowWatchingRow';
import { RandomButton } from './components/RandomButton';
import { ScrollToTopButton } from './components/ScrollToTopButton';
import { SkeletonCard } from './components/SkeletonCard';
import { GlobalPopup } from './components/GlobalPopup';
import { PopupButton } from './components/PopupButton';

// --- OPTIMIZED MOVIE CARD COMPONENT ---


// --- MAIN APP COMPONENT ---

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showRandomButton, setShowRandomButton] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  
  // NEW STATES FOR MENU AND ADMIN
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // AUTH & BAN STATUS
  const [user, setUser] = useState<WebAppUser | null>(null);
  const [isBanned, setIsBanned] = useState(false);
  
  // Firebase Data States
  const [myList, setMyList] = useState<Movie[]>([]);
  const [likedMovies, setLikedMovies] = useState<string[]>([]);
  const [dislikedMovies, setDislikedMovies] = useState<string[]>([]);
  const [watchHistory, setWatchHistory] = useState<Movie[]>([]);
  const [tickets, setTickets] = useState(0); 
  
  // New: Global Activity State
  const [globalActivities, setGlobalActivities] = useState<Activity[]>([]);

  // Notifications State
  const [rawNotifications, setRawNotifications] = useState<AppNotification[]>([]); 
  const [notifications, setNotifications] = useState<AppNotification[]>([]); 
  const [readGlobalIds, setReadGlobalIds] = useState<string[]>(() => {
      try { return JSON.parse(localStorage.getItem('read_global_ids') || '[]'); } catch { return []; }
  });
  const [deletedGlobalIds, setDeletedGlobalIds] = useState<string[]>(() => {
      try { return JSON.parse(localStorage.getItem('deleted_global_ids') || '[]'); } catch { return []; }
  });

  const [unreadCount, setUnreadCount] = useState(0);
  // Refs to track notifications for sound
  const prevUnreadCountRef = useRef(0);
  const isFirstNotificationLoadRef = useRef(true);

  const [logoIcon, setLogoIcon] = useState('');
  
  // Global Popup State
  const [globalPopup, setGlobalPopup] = useState<any>(null);
  const [showGlobalPopup, setShowGlobalPopup] = useState(false);
  const [showPopupButton, setShowPopupButton] = useState(false);

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

  // AUDIO UNLOCK FOR MOBILE BROWSERS - IMPROVED
  useEffect(() => {
      const unlockAudio = () => {
          // Attempt to unlock
          Audio.unlock().then(() => {
              // We only remove listeners if we are fairly sure interaction happened,
              // but for safety in WebViews, we might keep them for a bit or rely on Audio.ts internals
              // to handle repeated calls gracefully.
              // For now, let's keep it simple: calling unlock multiple times is safe.
          });
      };

      // Add listeners to 'mousedown' and 'touchstart' which are standard interaction events
      document.addEventListener('click', unlockAudio);
      document.addEventListener('touchstart', unlockAudio);
      document.addEventListener('keydown', unlockAudio);

      return () => {
          document.removeEventListener('click', unlockAudio);
          document.removeEventListener('touchstart', unlockAudio);
          document.removeEventListener('keydown', unlockAudio);
      };
  }, []);

  useEffect(() => {
    if (window.Telegram?.WebApp && window.Telegram.WebApp.initDataUnsafe?.user) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      if (tg.isVersionAtLeast && tg.isVersionAtLeast('6.1')) {
        tg.setHeaderColor('#000000');
        tg.setBackgroundColor('#000000');
      }

      const tgUser = tg.initDataUnsafe.user;
      if (tgUser) {
        setUser(tgUser);
        syncUser(tgUser);

        if (tgUser.language_code) {
           const detectedLang = getLanguage(tgUser.language_code);
           if (detectedLang !== lang) {
             setLang(detectedLang);
           }
        }
      }

      // --- DEEP LINKING (startapp) ---
      const startParam = tg.initDataUnsafe.start_param;
      if (startParam) {
          const processDeepLink = async () => {
              try {
                  let mediaType: 'movie' | 'tv' = 'movie';
                  let idStr = startParam;

                  if (startParam.startsWith('movie_')) {
                      mediaType = 'movie';
                      idStr = startParam.replace('movie_', '');
                  } else if (startParam.startsWith('tv_')) {
                      mediaType = 'tv';
                      idStr = startParam.replace('tv_', '');
                  }

                  const id = parseInt(idStr, 10);
                  if (!isNaN(id)) {
                      // Use current language for the fetch
                      const currentLang = tgUser?.language_code ? getLanguage(tgUser.language_code) : lang;
                      const locale = currentLang === 'uk' ? 'uk-UA' : currentLang === 'ru' ? 'ru-RU' : 'en-US';
                      
                      const movieData = await fetchMovieById(id.toString(), mediaType, locale);
                      if (movieData) {
                          setSelectedMovie(movieData);
                      }
                  }
              } catch (error) {
                  console.error("Failed to process deep link:", error);
              }
          };
          processDeepLink();
      }

    } else {
        // --- FALLBACK FOR BROWSER / GUEST (STATIC DEV USER) ---
        const STATIC_TEST_ID = 999999;

        const guestUser: WebAppUser = {
            id: STATIC_TEST_ID,
            first_name: "Dev",
            last_name: "Tester",
            username: "browser_admin",
            photo_url: ""
        };
        
        console.log("Running in Dev Mode with Fixed ID:", STATIC_TEST_ID);
        setUser(guestUser);
        syncUser(guestUser);
    }
  }, []);

  // HEARTBEAT EFFECT
  useEffect(() => {
    if (!user?.id) return;
    updateUserHeartbeat(user.id);
    const interval = setInterval(() => {
        updateUserHeartbeat(user.id);
    }, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, [user]);

  // Subscribe to Firebase Updates
  useEffect(() => {
    if (!user?.id) return;
    
    const unsubscribeBan = subscribeToUserBanStatus(user.id, (banned) => {
        setIsBanned(banned);
    });

    const unsubscribeUser = subscribeToUserData(user.id, (data) => {
      if (data.myList) setMyList(data.myList);
      if (data.likedMovies) setLikedMovies(data.likedMovies);
      if (data.dislikedMovies) setDislikedMovies(data.dislikedMovies);
      if (data.watchHistory) setWatchHistory(data.watchHistory);
      if (data.tickets !== undefined) setTickets(data.tickets);
    });

    const unsubscribePersonalNotifs = subscribeToPersonalNotifications(user.id, (personalNotifs) => {
        setRawNotifications(prev => {
             const globalOnly = prev.filter(n => n.isGlobal);
             return [...globalOnly, ...personalNotifs];
        });
    });

    const unsubscribeGlobalNotifs = subscribeToGlobalNotifications((globalNotifs) => {
        setRawNotifications(prev => {
            const personalOnly = prev.filter(n => !n.isGlobal);
            return [...personalOnly, ...globalNotifs];
        });
    });

    const unsubscribeGlobalSettings = subscribeToGlobalSettings((settings) => {
        if (settings?.logoIcon !== undefined) {
            setLogoIcon(settings.logoIcon);
        }
        if (settings?.popup) {
            setGlobalPopup(settings.popup);
        } else {
            setGlobalPopup(null);
        }
    });

    return () => {
        unsubscribeBan();
        unsubscribeUser();
        unsubscribePersonalNotifs();
        unsubscribeGlobalNotifs();
        unsubscribeGlobalSettings();
    };
  }, [user]);

  // Subscribe to Global Activity (Independent of User)
  useEffect(() => {
      const unsubscribe = subscribeToGlobalActivity((activities) => {
          setGlobalActivities(activities);
      });
      return () => unsubscribe();
  }, []);

  // Process Notifications & Play Sound
  useEffect(() => {
      const now = new Date();
      const processed = rawNotifications
          .filter(n => {
              if (n.isGlobal && deletedGlobalIds.includes(n.id)) return false;
              if (n.type === 'reminder') {
                  const notificationDate = new Date(n.date);
                  if (notificationDate > now) return false;
              }
              return true;
          })
          .map(n => {
              if (n.isGlobal && readGlobalIds.includes(n.id)) {
                  return { ...n, isRead: true };
              }
              return n;
          })
          .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const finalDisplay = processed.slice(0, 5);
      const currentUnreadCount = finalDisplay.filter(n => !n.isRead).length;

      setNotifications(finalDisplay);
      setUnreadCount(currentUnreadCount);

      // --- SOUND LOGIC ---
      // Check if this is the first load. If so, don't play sound (don't annoy user on startup).
      if (isFirstNotificationLoadRef.current) {
          isFirstNotificationLoadRef.current = false;
      } else {
          // If unread count INCREASED, play sound.
          if (currentUnreadCount > prevUnreadCountRef.current) {
              Audio.playNotification();
              Haptics.success();
          }
      }

      // Update ref for next comparison
      prevUnreadCountRef.current = currentUnreadCount;

  }, [rawNotifications, readGlobalIds, deletedGlobalIds]);

  const handleMarkGlobalRead = (ids: string[]) => {
      const newReadIds = Array.from(new Set([...readGlobalIds, ...ids]));
      setReadGlobalIds(newReadIds);
      localStorage.setItem('read_global_ids', JSON.stringify(newReadIds));
  };

  const handleDeleteNotification = async (notification: AppNotification) => {
      if (notification.isGlobal) {
          const newDeletedIds = [...deletedGlobalIds, notification.id];
          setDeletedGlobalIds(newDeletedIds);
          localStorage.setItem('deleted_global_ids', JSON.stringify(newDeletedIds));
      } else if (user?.id) {
          await deletePersonalNotification(user.id, notification.id);
      }
  };

  // Global Popup Trigger Logic
  useEffect(() => {
      if (globalPopup?.isActive && globalPopup?.id && !showSplash) {
          const seenId = localStorage.getItem('seen_popup_id');
          if (seenId !== globalPopup.id) {
              const timer = setTimeout(() => {
                  setShowPopupButton(true);
                  Haptics.success();
              }, 2500); // 2.5s delay after splash screen
              return () => clearTimeout(timer);
          }
      }
  }, [globalPopup, showSplash]);

  const handlePopupButtonClick = () => {
      setShowPopupButton(false);
      setShowGlobalPopup(true);
  };

  const handleCloseGlobalPopup = () => {
      setShowGlobalPopup(false);
      if (globalPopup?.id) {
          localStorage.setItem('seen_popup_id', globalPopup.id);
      }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      // Show random button slightly after splash
      setTimeout(() => setShowRandomButton(true), 1000);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleCategoryChange = useCallback((newCategory: Category) => {
    if (activeCategory === newCategory) return;
    Haptics.selection(); 
    Audio.playClick(); // Sound on category change
    setActiveCategory(newCategory);
    setMovies([]); 
    setFeaturedMovie(null); 
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
            
            const [logoUrl, cleanImages] = await Promise.all([
                API.fetchMovieLogo(randomHero.id, isTv),
                API.fetchCleanImages(randomHero.id, isTv ? 'tv' : 'movie')
            ]);
            
            setFeaturedMovie({ 
                ...randomHero, 
                logoUrl,
                bannerUrl: cleanImages.banner || randomHero.bannerUrl,
                posterUrl: cleanImages.poster || randomHero.posterUrl
            });
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

  useEffect(() => {
    if (activeTab !== 'home') return; 
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop || window.pageYOffset;
      const clientHeight = document.documentElement.clientHeight;
      // Reduced threshold to 100px so user hits bottom before loading
      if (scrollTop + clientHeight >= scrollHeight - 100 && !loading && hasMore && !isLoadingRef.current) {
        setPage(prev => prev + 1);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, activeTab]);

  const handleMovieClick = useCallback((movie: Movie) => {
    Haptics.medium(); 
    Audio.playPop(); // Sound on movie click
    setSelectedMovie(movie);
    if (user) {
        recordGlobalActivity(user, movie, 'viewing');
    }
  }, [user]);

  const handlePlay = (movie: Movie) => {
      setPlayingMovie(movie);
      if (user?.id) {
          addToHistory(user.id, movie);
          recordGlobalActivity(user, movie, 'watching');
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

  if (isBanned) {
      return <BannedView lang={lang} />;
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans antialiased text-white pb-24 bg-black">
      {/* Background Gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none transition-colors duration-500 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1a1a] via-black to-black" />

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
          logoIcon={logoIcon}
        />
        
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full relative z-10"
            >
              <CategoryNav 
                  lang={lang} 
                  activeCategory={activeCategory} 
                  onSelectCategory={handleCategoryChange} 
              />

              {featuredMovie ? (
                   <Hero 
                      movie={featuredMovie} 
                      onMoreInfo={() => setSelectedMovie(featuredMovie)}
                      onPlay={() => handlePlay(featuredMovie)}
                      lang={lang}
                   />
              ) : (
                  <div className="relative h-[75vh] md:h-[90vh] w-full z-0 bg-black">
                     <div className="absolute inset-0 bg-[#0a0a0a]"></div>
                     <div className="absolute bottom-0 left-0 w-full h-[50vh] bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                  </div>
              )}

              <main className="relative z-10 w-full -mt-1 bg-black">
                  {/* NOW WATCHING ROW */}
                  {globalActivities.length > 0 && (
                      <section className="pt-4 pb-0">
                          <NowWatchingRow 
                              title={translations[lang].nowWatching || "Now Watching"} 
                              activities={globalActivities} 
                              onMovieClick={handleMovieClick}
                              lang={lang}
                          />
                      </section>
                  )}

                  <section className="px-2 md:px-12 pb-10 pt-0">
                      {/* Separator Line */}
                      <div className="w-full flex justify-center py-2">
                          <div className="w-1/3 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      </div>
                      
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
                              <motion.div 
                                  key={`skeleton-${i}`} 
                                  initial={{ opacity: 0, y: 30 }}
                                  whileInView={{ opacity: 1, y: 0 }}
                                  viewport={{ once: true, margin: "0px 0px -50px 0px" }}
                                  transition={{ duration: 0.5, delay: (i % 6) * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
                              >
                                  <SkeletonCard />
                              </motion.div>
                          ))}
                      </div>
                      
                      {!hasMore && movies.length > 0 && (
                          <div className="text-center text-gray-500 py-10 opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                              <p>{translations[lang].endOfList}</p>
                          </div>
                      )}
                  </section>
              </main>
            </motion.div>
          )}

          {activeTab === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full pt-20 relative z-10"
            >
              <SearchView 
                lang={lang} 
                onMovieSelect={setSelectedMovie} 
              />
            </motion.div>
          )}

          {activeTab === 'coming_soon' && (
            <motion.div
              key="coming_soon"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full pt-20 relative z-10"
            >
              <ComingSoonView
                  lang={lang}
                  onMovieSelect={setSelectedMovie}
                  user={user}
              />
            </motion.div>
          )}

          {activeTab === 'my_list' && (
            <motion.div
              key="my_list"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full pt-20 relative z-10"
            >
                <MyListView 
                   myList={myList}
                   history={watchHistory}
                   onMovieSelect={setSelectedMovie}
                   lang={lang}
                />
            </motion.div>
          )}
          </AnimatePresence>

          {/* Random Button */}
          <AnimatePresence>
            {showRandomButton && activeTab === 'home' && !selectedMovie && !playingMovie && (
                <RandomButton 
                    movies={movies} 
                    onRandomSelect={handleMovieClick} 
                />
            )}
          </AnimatePresence>

          {/* Scroll To Top Button */}
          {activeTab === 'home' && !selectedMovie && !playingMovie && (
              <ScrollToTopButton />
          )}

      {/* COMMON OVERLAYS */}
      <Modal 
        movie={selectedMovie} 
        onClose={() => setSelectedMovie(null)} 
        onPlay={(m) => handlePlay(m)}
        onMovieSelect={setSelectedMovie} 
        onToggleList={handleToggleList}
        onToggleLike={handleToggleLike}
        onToggleDislike={handleToggleDislike}
        isInList={selectedMovie ? myList.some(m => m.id === selectedMovie.id) : false}
        isLiked={selectedMovie ? likedMovies.includes(selectedMovie.id) : false}
        isDisliked={selectedMovie ? dislikedMovies.includes(selectedMovie.id) : false}
        lang={lang}
      />

      {playingMovie && (
        <Player 
          movie={playingMovie} 
          onClose={() => setPlayingMovie(null)} 
          userId={user?.id} 
        />
      )}

      <BottomNav 
        lang={lang}  
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onMoreClick={() => setIsMoreMenuOpen(true)}
      />

      <MoreMenu 
          isOpen={isMoreMenuOpen}
          onClose={() => setIsMoreMenuOpen(false)}
          lang={lang}
          user={user}
          userTickets={tickets} 
          onAdminClick={() => setIsAdminPanelOpen(true)}
      />

      {isAdminPanelOpen && (
        <div className="relative z-50">
          <AdminPanel 
             onClose={() => setIsAdminPanelOpen(false)}
             lang={lang}
          />
        </div>
      )}

      {isNotificationsOpen && (
          <NotificationsView 
            notifications={notifications}
            onClose={() => setIsNotificationsOpen(false)}
            lang={lang}
            userId={user?.id}
            onMarkGlobalRead={handleMarkGlobalRead}
            onDelete={handleDeleteNotification}
          />
      )}

      {showPopupButton && (
          <PopupButton 
              onClick={handlePopupButtonClick}
              lang={lang}
          />
      )}

      {showGlobalPopup && globalPopup && (
          <GlobalPopup 
              data={globalPopup}
              onClose={handleCloseGlobalPopup}
              lang={lang}
          />
      )}
    </div>
  );
}

export default App;