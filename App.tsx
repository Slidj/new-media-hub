import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Modal } from './components/Modal';
import { BottomNav } from './components/BottomNav';
import { SkeletonCard } from './components/SkeletonCard';
import { Preloader } from './components/Preloader';
import { SearchView } from './components/SearchView';
import { Movie, WebAppUser } from './types';
import { API } from './services/tmdb';
import { Language, getLanguage, translations } from './utils/translations';
import { Star, Tv } from 'lucide-react';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [user, setUser] = useState<WebAppUser | null>(null);
  const [lang, setLang] = useState<Language>('en');
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'search'>('home');
  
  // Home Feed Data State
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Initialize Telegram User & Language
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      // Check version before setting colors to avoid warnings on v6.0
      // setHeaderColor and setBackgroundColor were introduced in v6.1
      if (tg.isVersionAtLeast && tg.isVersionAtLeast('6.1')) {
        tg.setHeaderColor('#000000');
        tg.setBackgroundColor('#000000');
      }

      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        setUser(tgUser);
        if (tgUser.language_code) {
           setLang(getLanguage(tgUser.language_code));
        }
      } else {
        // Mock user
        setUser({
            id: 123456,
            first_name: "Test",
            last_name: "User",
            username: "testuser",
            photo_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
        });
      }
    }
  }, []);

  // Handle Splash Screen Logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500); // 2.5s duration to match the CSS animation
    return () => clearTimeout(timer);
  }, []);

  // Fetch Movies function
  const loadMovies = useCallback(async (pageNum: number, language: string) => {
    setLoading(true);
    // Map internal language code to TMDB locale code (e.g., 'uk' -> 'uk-UA', 'ru' -> 'ru-RU', 'en' -> 'en-US')
    const locale = language === 'uk' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-US';
    
    const newMovies = await API.fetchTrending(pageNum, locale);
    
    if (newMovies.length === 0) {
      setHasMore(false);
    } else {
      setMovies(prev => {
        // Filter out duplicates just in case
        const existingIds = new Set(prev.map(m => m.id));
        const uniqueNew = newMovies.filter(m => !existingIds.has(m.id));
        return pageNum === 1 ? uniqueNew : [...prev, ...uniqueNew]; // Reset on page 1
      });

      // If it's the very first load, set a Random Hero from the top results
      if (pageNum === 1 && newMovies.length > 0) {
        // Pick a random index from the first 20 items (or length) to ensure variety but quality
        const randomIndex = Math.floor(Math.random() * Math.min(newMovies.length, 20));
        const randomHero = newMovies[randomIndex]; 
        const isTv = randomHero.mediaType === 'tv';
        const logoUrl = await API.fetchMovieLogo(randomHero.id, isTv);
        setFeaturedMovie({ ...randomHero, logoUrl });
      }
    }
    setLoading(false);
  }, []);

  // Initial Load & Language Change
  useEffect(() => {
    if (activeTab === 'home') {
        // Only reset if empty or language changed radically, usually keeping cache is better but here we reload for simplicity
        if (movies.length === 0) {
             setMovies([]);
             setPage(1);
             setHasMore(true);
             loadMovies(1, lang);
        }
    }
  }, [lang, loadMovies, activeTab, movies.length]);

  // Infinite Scroll Handler (Only active on Home tab)
  useEffect(() => {
    if (activeTab !== 'home') return;

    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 800 && // Load when 800px from bottom
        !loading &&
        hasMore
      ) {
        setPage(prevPage => {
           const nextPage = prevPage + 1;
           loadMovies(nextPage, lang);
           return nextPage;
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, loadMovies, lang, activeTab]);

  if (showSplash) {
    return <Preloader />;
  }

  return (
    <div className="relative min-h-screen bg-black overflow-x-hidden font-sans antialiased text-white selection:bg-[#E50914] selection:text-white">
      <Navbar 
        user={user} 
        lang={lang} 
        onSearchClick={() => setActiveTab('search')}
        onHomeClick={() => setActiveTab('home')}
        activeTab={activeTab}
      />
      
      {activeTab === 'home' ? (
        <main className="relative pl-0 pb-20">
          {featuredMovie && (
              <Hero 
                  movie={featuredMovie} 
                  onMoreInfo={() => setSelectedMovie(featuredMovie)}
                  onPlay={() => setSelectedMovie(featuredMovie)}
                  lang={lang}
              />
          )}
          
          <section className="relative z-20 mt-0 lg:-mt-32 px-4 md:px-12 pb-10 bg-black lg:bg-gradient-to-t lg:from-black lg:via-black lg:to-transparent pt-6 lg:pt-10">
            
            {/* Main Grid */}
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {movies.map((movie, index) => {
                const isTop10 = index < 10;
                return (
                  <div 
                    key={movie.id} 
                    className="
                        relative cursor-pointer aspect-[2/3] rounded-md overflow-hidden bg-[#181818] group
                        transition-all duration-300 ease-out
                        hover:scale-105 hover:z-10 hover:shadow-xl hover:shadow-black/80
                        active:scale-90 active:brightness-75
                    "
                    onClick={() => setSelectedMovie(movie)}
                  >
                    <img
                      src={movie.posterUrl}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      alt={movie.title}
                      loading="lazy"
                    />
                    
                    {/* Top 10 Badge (Top Left) */}
                    {isTop10 && (
                      <div className="absolute top-0 left-0 z-20">
                          {/* Ribbon shape */}
                          <div className="relative">
                              <div className="absolute top-0 left-0 w-8 h-9 bg-gradient-to-br from-[#E50914] to-[#B81D24] shadow-lg flex items-center justify-center rounded-br-lg z-10 border-b border-r border-white/20">
                                  <span className="text-white font-black text-lg italic pr-0.5 drop-shadow-md font-sans">#{index + 1}</span>
                              </div>
                          </div>
                      </div>
                    )}

                    {/* Series Badge (Top Right) */}
                    {movie.mediaType === 'tv' && (
                      <div className="absolute top-2 right-2 z-20">
                          <div className="bg-[#E50914] text-white text-[9px] md:text-[10px] font-bold px-2 py-1 rounded shadow-md flex items-center gap-1 border border-white/10 backdrop-blur-sm">
                            <Tv className="w-3 h-3" />
                            <span>{translations[lang].series}</span>
                          </div>
                      </div>
                    )}

                    {/* Rating Badge (Bottom Right) */}
                    <div className="absolute bottom-2 right-2 z-20">
                      <div className="bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded flex items-center gap-1 border border-white/10 shadow-lg">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-[10px] font-bold text-white">{movie.rating}</span>
                      </div>
                    </div>

                    {/* Overlay with darkening effect and Play button */}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-20">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center transform scale-50 group-hover:scale-100 transition-transform duration-300 delay-75 shadow-lg">
                            <div className="w-0 h-0 border-l-[6px] md:border-l-[8px] border-l-transparent border-t-[10px] md:border-t-[14px] border-t-white border-r-[6px] md:border-r-[8px] border-r-transparent transform rotate-[-90deg] ml-1"></div>
                        </div>
                    </div>
                  </div>
                );
              })}

              {/* Skeleton Loaders (Show when loading) */}
              {loading && (
                Array.from({ length: 12 }).map((_, i) => (
                  <SkeletonCard key={`skeleton-${i}`} />
                ))
              )}
            </div>
            
            {!hasMore && (
              <div className="text-center text-gray-500 py-10">
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

      {/* Footer */}
      {activeTab === 'home' && (
          <footer className="hidden md:block w-full max-w-[1000px] mx-auto p-8 text-gray-500 text-sm pb-8">
            <p className="text-center">&copy; 2024 Media Hub, Inc.</p>
          </footer>
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