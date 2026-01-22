
import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Modal } from './components/Modal';
import { BottomNav } from './components/BottomNav';
import { SkeletonCard } from './components/SkeletonCard';
import { Preloader } from './components/Preloader';
import { SearchView } from './components/SearchView';
import { CategoryNav, Category } from './components/CategoryNav';
import { Player } from './components/Player';
import { Movie, WebAppUser } from './types';
import { API } from './services/tmdb';
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

    return (
        <div 
            className="animate-fade-in-up fill-mode-forwards"
            style={{ 
                animationDelay: `${Math.min((index % 15) * 50, 500)}ms`,
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
  
  const [user, setUser] = useState<WebAppUser | null>(null);

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
  
  const [activeTab, setActiveTab] = useState<'home' | 'search'>('home');
  const [activeCategory, setActiveCategory] = useState<Category>('trending');
  
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const isLoadingRef = useRef(false);
  
  // Ref for Parallax effect
  const heroRef = useRef<HTMLDivElement>(null);

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
        if (tgUser.language_code) {
           const detectedLang = getLanguage(tgUser.language_code);
           if (detectedLang !== lang) {
             setLang(detectedLang);
           }
        }
      } else {
        setUser({
            id: 123456,
            first_name: "Guest",
            last_name: "User",
            username: "guest",
            photo_url: ""
        });
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // --- PARALLAX SCROLL EFFECT ---
  useEffect(() => {
    if (activeTab !== 'home') return;

    const handleParallax = () => {
        if (!heroRef.current) return;
        
        const scrolled = window.scrollY;
        
        // Stop calculating if the hero is completely off-screen (optimization)
        if (scrolled > 1200) return;

        // "Parallax Factor": 0.35
        const rate = scrolled * 0.35;
        heroRef.current.style.transform = `translate3d(0, -${rate}px, 0)`;
    };

    // Use passive listener for better scroll performance on mobile
    window.addEventListener('scroll', handleParallax, { passive: true });
    return () => window.removeEventListener('scroll', handleParallax);
  }, [activeTab]);


  const handleCategoryChange = useCallback((newCategory: Category) => {
    if (activeCategory === newCategory) return;
    setActiveCategory(newCategory);
    setMovies([]); 
    setPage(1); 
    setHasMore(true);
    // Reset parallax on category change
    if (heroRef.current) heroRef.current.style.transform = `translate3d(0, 0, 0)`;
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

  // Infinite Scroll Logic
  useEffect(() => {
    if (activeTab !== 'home') return;

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop || window.pageYOffset;
      const clientHeight = document.documentElement.clientHeight;
      
      if (scrollTop + clientHeight >= scrollHeight - 1000 && !loading && hasMore && !isLoadingRef.current) {
        setPage(prev => prev + 1);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, activeTab]);

  const handleMovieClick = useCallback((movie: Movie) => {
    setSelectedMovie(movie);
  }, []);

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
      />
      
      {activeTab === 'home' ? (
        <>
            {/* FIXED PARALLAX LAYER (z-0) */}
            {/* Added ref and will-change-transform for performance */}
            {featuredMovie && (
              <div 
                ref={heroRef}
                className="fixed top-0 left-0 w-full h-[75vh] md:h-[90vh] z-0 pointer-events-auto will-change-transform"
              >
                 <Hero 
                    movie={featuredMovie} 
                    onMoreInfo={() => setSelectedMovie(featuredMovie)}
                    onPlay={() => setPlayingMovie(featuredMovie)}
                    lang={lang}
                 />
              </div>
            )}

            {/* SCROLLABLE CONTENT LAYER (z-20) */}
            <main className="relative z-20 w-full">
                
                {/* 1. Transparent Spacer to reveal fixed Hero below */}
                <div className="w-full h-[75vh] md:h-[90vh] pointer-events-none" />
                
                {/* 2. The Main Content 'Sheet' */}
                {/* Minimal negative margin to just blend, not overlap heavily */}
                <section className="relative bg-black min-h-screen -mt-2 px-2 md:px-12 pb-10 shadow-[0_-50px_100px_50px_rgba(0,0,0,0.8)]">
                    
                    {/* Gradient Overlay reduced significantly (h-24 instead of h-48) */}
                    <div className="absolute top-0 left-0 right-0 -translate-y-full h-24 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />

                    <CategoryNav 
                        lang={lang} 
                        activeCategory={activeCategory} 
                        onSelectCategory={handleCategoryChange} 
                    />

                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4 pt-4">
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
                            <div key={`skeleton-${i}`} className="opacity-0 animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
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
      ) : (
        <SearchView 
          lang={lang} 
          onMovieSelect={setSelectedMovie} 
        />
      )}

      <BottomNav 
        lang={lang} 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Details Modal */}
      {selectedMovie && (
        <Modal 
          movie={selectedMovie} 
          onClose={() => setSelectedMovie(null)} 
          onPlay={(m) => {
             setPlayingMovie(m);
             setSelectedMovie(null); 
          }}
          lang={lang}
        />
      )}

      {/* Video Player */}
      {playingMovie && (
        <Player 
          movie={playingMovie} 
          onClose={() => setPlayingMovie(null)} 
        />
      )}
    </div>
  );
}

export default App;
