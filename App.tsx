
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Modal } from './components/Modal';
import { BottomNav } from './components/BottomNav';
import { SkeletonCard } from './components/SkeletonCard';
import { Preloader } from './components/Preloader';
import { SearchView } from './components/SearchView';
import { CategoryNav, Category } from './components/CategoryNav';
import { Movie, WebAppUser } from './types';
import { API } from './services/tmdb';
import { Language, getLanguage, translations } from './utils/translations';
import { Star, Tv } from 'lucide-react';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [user, setUser] = useState<WebAppUser | null>(null);
  const [lang, setLang] = useState<Language>('en');
  
  const [activeTab, setActiveTab] = useState<'home' | 'search'>('home');
  const [activeCategory, setActiveCategory] = useState<Category>('trending');
  
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // Ref to track if a request is currently in flight to prevent race conditions
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
        if (tgUser.language_code) {
           const detectedLang = getLanguage(tgUser.language_code);
           setLang(detectedLang);
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

  // Handler for changing categories
  const handleCategoryChange = (newCategory: Category) => {
    if (activeCategory === newCategory) return;
    setActiveCategory(newCategory);
    setMovies([]); // Clear current list immediately
    setPage(1); // Reset page
    setHasMore(true);
    // Note: The main useEffect listening to [activeCategory, page] will trigger the load
  };

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

          // Only set hero if it's the first page and we don't have one (or refreshing full list)
          // For sub-categories, we might want to keep the main hero or update it. 
          // Let's update it to match the category context.
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

  // Main Load Effect (Handles Initial Load + Page Changes + Category Changes)
  useEffect(() => {
    if (activeTab === 'home' && !isLoadingRef.current) {
        // If movies are empty or we are on page > 1, or it's just a raw trigger
        // The isLoadingRef check prevents double-firing in strict mode, 
        // but we need to ensure we fetch when category changes
        
        // We add a small logic check: if we have movies but the page is 1, and category changed, we need to fetch.
        // The simplest way is to rely on the dependency array.
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

      if (scrollTop + clientHeight >= scrollHeight - 800 && !loading && hasMore && !isLoadingRef.current) {
        setPage(prev => prev + 1);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, activeTab]);

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
        <main className="relative w-full">
          <CategoryNav 
             lang={lang} 
             activeCategory={activeCategory} 
             onSelectCategory={handleCategoryChange} 
          />

          {featuredMovie && (
              <Hero 
                  movie={featuredMovie} 
                  onMoreInfo={() => setSelectedMovie(featuredMovie)}
                  onPlay={() => setSelectedMovie(featuredMovie)}
                  lang={lang}
              />
          )}
          
          <section className="relative z-30 mt-4 md:-mt-12 px-2 md:px-12 pb-10">
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
              {movies.map((movie, index) => {
                // Determine Top 10 badge only if trending category
                const isTop10 = activeCategory === 'trending' && index < 10;
                const delay = Math.min((index % 15) * 50, 500); 
                
                return (
                  <div 
                    key={`${movie.id}-${index}`}
                    className="opacity-0 animate-fade-in-up fill-mode-forwards"
                    style={{ animationDelay: `${delay}ms` }}
                  >
                    <div 
                        className="
                            relative cursor-pointer aspect-[2/3] rounded-md overflow-hidden bg-[#181818] group
                            transition-transform duration-200 ease-out
                            hover:scale-110 hover:z-50 hover:shadow-2xl hover:shadow-black
                            active:scale-95 active:brightness-75
                        "
                        onClick={() => setSelectedMovie(movie)}
                    >
                        <img
                        src={movie.posterUrl}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        alt={movie.title}
                        loading="lazy"
                        />
                        
                        {isTop10 && (
                        <div className="absolute top-0 left-0 z-20">
                            <div className="relative">
                                <div className="absolute top-0 left-0 w-8 h-9 bg-gradient-to-br from-[#E50914] to-[#B81D24] shadow-lg flex items-center justify-center rounded-br-lg z-10 border-b border-r border-white/20">
                                    <span className="text-white font-black text-lg italic drop-shadow-md font-sans">#{index + 1}</span>
                                </div>
                            </div>
                        </div>
                        )}

                        {movie.mediaType === 'tv' && (
                        <div className="absolute top-2 right-2 z-20">
                            <div className="bg-[#E50914] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md flex items-center gap-1 border border-white/10">
                                <Tv className="w-2.5 h-2.5" />
                                <span>{translations[lang].series}</span>
                            </div>
                        </div>
                        )}

                        <div className="absolute bottom-2 right-2 z-20">
                        <div className="bg-black/60 backdrop-blur-md px-1 py-0.5 rounded flex items-center gap-1 border border-white/10">
                            <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                            <span className="text-[10px] font-bold text-white">{movie.rating}</span>
                        </div>
                        </div>

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-t-[10px] border-t-white border-r-[6px] border-r-transparent transform rotate-[-90deg] ml-1"></div>
                            </div>
                        </div>
                    </div>
                  </div>
                );
              })}

              {loading && Array.from({ length: 12 }).map((_, i) => (
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

      {selectedMovie && (
        <Modal 
          movie={selectedMovie} 
          onClose={() => setSelectedMovie(null)} 
          lang={lang}
        />
      )}
    </div>
  );
}

export default App;
