
import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Plus, ThumbsUp, Share2, Youtube } from 'lucide-react';
import { Movie, Cast, Video } from '../types';
import { Language, translations } from '../utils/translations';
import { API } from '../services/tmdb';

interface ModalProps {
  movie: Movie | null;
  onClose: () => void;
  onPlay: (movie: Movie) => void;
  // Додано optional prop для переходу на рекомендований фільм
  onMovieSelect?: (movie: Movie) => void; 
  lang: Language;
}

type TabType = 'overview' | 'trailers' | 'more_like_this';

export const Modal: React.FC<ModalProps> = ({ movie, onClose, onPlay, onMovieSelect, lang }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState('');
  
  // Content States
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [tagline, setTagline] = useState<string | null>(null);
  
  // New Extended Content States
  const [cast, setCast] = useState<Cast[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Image States
  const [activePosterSrc, setActivePosterSrc] = useState<string | null>(null);
  const [activeBannerSrc, setActiveBannerSrc] = useState<string | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Trailer Player State
  const [playingTrailerKey, setPlayingTrailerKey] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];

  useEffect(() => {
    if (movie) {
      // 1. Скидання стану (Миттєво)
      setIsVisible(false);
      setActivePosterSrc(null);
      setActiveBannerSrc(null);
      setIsImageLoaded(false);
      setLogoUrl(null);
      setDuration(null);
      setTagline(null);
      setCast([]);
      setVideos([]);
      setRecommendations([]);
      setActiveTab('overview');
      setPlayingTrailerKey(null);
      
      // Reset scroll position
      if (scrollRef.current) scrollRef.current.scrollTop = 0;

      if (window.Telegram?.WebApp) {
        setPlatform(window.Telegram.WebApp.platform);
      }
      
      let isMounted = true;

      // 2. Головна функція підготовки контенту (зображення)
      const prepareContent = async () => {
          let targetPoster = movie.posterUrl;
          let targetBanner = movie.bannerUrl;

          try {
              const cleanPromise = API.fetchCleanImages(movie.id, movie.mediaType);
              const timeoutPromise = new Promise<{poster?: string, banner?: string} | null>((resolve) => 
                  setTimeout(() => resolve(null), 600)
              );

              const result = await Promise.race([cleanPromise, timeoutPromise]);

              if (result) {
                  if (result.poster) targetPoster = result.poster;
                  if (result.banner) targetBanner = result.banner;
              }
          } catch (e) { }

          if (!isMounted) return;
          
          const imgToLoad = window.innerWidth < 768 ? targetPoster : targetBanner;
          const img = new Image();
          img.src = imgToLoad;

          const launchModal = () => {
              if (!isMounted) return;
              setActivePosterSrc(targetPoster);
              setActiveBannerSrc(targetBanner);
              setIsImageLoaded(true);
              requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                      setIsVisible(true);
                  });
              });
          };

          img.onload = launchModal;
          img.onerror = launchModal;
      };

      // 3. Завантаження метаданих (паралельно)
      const loadMetadata = async () => {
          try {
              const [logoData, detailsData, castData, videoData, recData] = await Promise.all([
                  !movie.logoUrl ? API.fetchMovieLogo(movie.id, movie.mediaType === 'tv') : Promise.resolve(null),
                  API.fetchMovieDetails(movie.id, movie.mediaType),
                  API.fetchCredits(movie.id, movie.mediaType),
                  API.fetchVideos(movie.id, movie.mediaType),
                  API.fetchRecommendations(movie.id, movie.mediaType, lang === 'uk' ? 'uk-UA' : lang === 'ru' ? 'ru-RU' : 'en-US')
              ]);

              if (!isMounted) return;

              if (movie.logoUrl) setLogoUrl(movie.logoUrl);
              else if (logoData) setLogoUrl(logoData);

              if (movie.duration && movie.duration !== 'N/A') setDuration(movie.duration);
              else if (detailsData.duration) setDuration(detailsData.duration);

              if (detailsData.tagline) setTagline(detailsData.tagline);
              
              setCast(castData);
              setVideos(videoData);
              setRecommendations(recData);

          } catch (e) { console.error(e); }
      };

      prepareContent();
      loadMetadata();

      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        if (tg.isVersionAtLeast && tg.isVersionAtLeast('6.1')) {
            tg.BackButton.show();
            tg.BackButton.onClick(handleClose);
            tg.HapticFeedback.impactOccurred('light');
        }
      }

      return () => {
        isMounted = false;
        if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          if (tg.isVersionAtLeast && tg.isVersionAtLeast('6.1')) {
            tg.BackButton.offClick(handleClose);
            tg.BackButton.hide();
          }
        }
      };
    }
  }, [movie]);

  if (!movie) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 500); 
  };

  const handlePlayClick = () => {
    onPlay(movie);
  };
  
  const handleRecommendationClick = (recMovie: Movie) => {
      // If we have a handler from App.tsx, we use it to switch the modal content
      if (onMovieSelect) {
          setIsVisible(false);
          setTimeout(() => onMovieSelect(recMovie), 300);
      }
  };

  const handleTrailerClick = (videoKey: string) => {
      // Opens the internal player instead of new tab
      setPlayingTrailerKey(videoKey);
  };

  const isMobile = platform === 'ios' || platform === 'android' || platform === 'weba';
  const baseTransition = "transition-all duration-700 ease-out transform";
  const hiddenState = "opacity-0 translate-y-8";
  const visibleState = "opacity-100 translate-y-0";

  // Вираховуємо безпечний origin для YouTube. 
  // Якщо ми в Telegram WebApp або локально, origin може бути специфічним.
  const getYoutubeOrigin = () => {
      if (typeof window !== 'undefined' && window.location.origin) {
          return window.location.origin;
      }
      return 'https://localhost'; // Fallback
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center pointer-events-auto">
      {/* Overlay */}
      <div 
        className={`
          absolute inset-0 bg-black/80 backdrop-blur-sm
          transition-opacity duration-700 ease-in-out
          ${isVisible ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div 
        className={`
          relative w-full h-[98vh] md:h-auto md:max-h-[90vh] md:max-w-4xl 
          bg-[#141414] rounded-t-xl md:rounded-lg overflow-hidden shadow-2xl 
          
          transform-gpu 
          transition-transform duration-500 
          ease-[cubic-bezier(0.32,0.72,0,1)]
          
          flex flex-col will-change-transform ring-1 ring-white/10
          
          ${isVisible 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-[110%] opacity-100 md:translate-y-12 md:opacity-0 md:scale-95'
          }
        `}
      >
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className={`
            absolute z-50 h-8 w-8 md:h-10 md:w-10 rounded-full bg-black/50 backdrop-blur-md
            grid place-items-center hover:bg-[#2a2a2a]
            transition-all duration-500 delay-100
            ${isMobile ? 'top-3 right-3' : 'top-4 right-4'}
            ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
          `}
        >
          <X className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </button>

        <div ref={scrollRef} className="overflow-y-auto overflow-x-hidden h-full no-scrollbar overscroll-contain pb-safe bg-[#141414]">
            
            {/* 1. HERO IMAGE AREA */}
            <div className="relative w-full h-[55vh] md:h-[55vh] bg-[#0a0a0a]">
                
                {/* Background placeholder */}
                <div className={`absolute inset-0 z-0 bg-[#121212] ${isImageLoaded ? 'opacity-0' : 'opacity-100'}`} />

                {activePosterSrc && (
                    <img 
                      src={activePosterSrc} 
                      alt={movie.title} 
                      decoding="sync"
                      className={`
                        block md:hidden w-full h-full object-cover object-center
                        transition-opacity duration-500 ease-in-out
                        ${isImageLoaded ? 'opacity-100' : 'opacity-0'}
                      `}
                    />
                )}
                {activeBannerSrc && (
                    <img 
                      src={activeBannerSrc} 
                      alt={movie.title} 
                      decoding="sync"
                      className={`
                        hidden md:block w-full h-full object-cover object-top
                        transition-opacity duration-500 ease-in-out
                        ${isImageLoaded ? 'opacity-100' : 'opacity-0'}
                      `}
                    />
                )}
                
                {/* Gradients */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-[80%] bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-[#141414] via-[#141414]/90 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#141414]"></div>
                </div>
            </div>

            {/* 2. CONTENT AREA (Staggered Animations) */}
            <div className="relative z-20 px-4 md:px-10 pb-8 space-y-6 -mt-32 md:-mt-40">
                
                {/* A. Logo & Tagline */}
                <div className={`
                    flex flex-col items-center justify-end gap-3 mb-2
                    ${baseTransition} ${isVisible ? 'delay-300' : 'delay-0'}
                    ${isVisible ? visibleState : hiddenState}
                `}>
                    <div className="w-full h-24 md:h-32 flex items-end justify-center">
                        <div className="w-full flex justify-center">
                            {logoUrl ? (
                                <img 
                                    src={logoUrl} 
                                    alt={movie.title} 
                                    className="w-2/3 md:w-1/3 max-h-24 md:max-h-32 object-contain drop-shadow-xl"
                                />
                            ) : (
                                <h2 className="text-3xl md:text-5xl font-black text-white text-center drop-shadow-lg uppercase tracking-tighter leading-none">
                                    {movie.title}
                                </h2>
                            )}
                        </div>
                    </div>
                </div>

                {/* B. Metadata & Buttons */}
                <div className={`
                     space-y-4
                    ${baseTransition} ${isVisible ? 'delay-[400ms]' : 'delay-0'}
                    ${isVisible ? visibleState : hiddenState}
                `}>
                    {/* Metadata Row */}
                    <div className="flex items-center justify-center gap-3 text-sm font-medium text-gray-300 drop-shadow-md">
                        <span className="text-[#46d369] font-bold">{movie.match}% {t.match}</span>
                        <span>{movie.year}</span>
                        <span className="bg-[#404040] text-white px-1.5 py-0.5 rounded-[2px] text-xs border border-white/20 uppercase">{movie.rating}</span>
                        {duration && duration !== 'N/A' && (
                            <span>{duration}</span>
                        )}
                        <span className="border border-white/40 px-1 rounded-[2px] text-[10px] uppercase">HD</span>
                    </div>

                     {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={handlePlayClick}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-bold rounded-[4px] hover:bg-white/90 active:scale-[0.98] transition shadow-xl"
                        >
                            <Play className="w-7 h-7 fill-black" />
                            <span className="text-lg font-bold">{t.play}</span>
                        </button>

                        <div className="grid grid-cols-3 gap-3">
                            <button className="flex items-center justify-center h-10 bg-[#2a2a2a] text-white/90 rounded-[4px] hover:bg-[#333] active:scale-[0.98] transition border border-white/10">
                                <Plus className="w-5 h-5" />
                            </button>
                            <button className="flex items-center justify-center h-10 bg-[#2a2a2a] text-white/90 rounded-[4px] hover:bg-[#333] active:scale-[0.98] transition border border-white/10">
                                <ThumbsUp className="w-5 h-5" />
                            </button>
                            <button className="flex items-center justify-center h-10 bg-[#2a2a2a] text-white/90 rounded-[4px] hover:bg-[#333] active:scale-[0.98] transition border border-white/10">
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* C. TABS & EXTENDED INFO (DELAY 500ms) */}
                <div className={`
                    ${baseTransition} ${isVisible ? 'delay-[500ms]' : 'delay-0'}
                    ${isVisible ? visibleState : hiddenState}
                `}>
                    
                    {/* Tab Selection */}
                    <div className="flex gap-6 border-b border-white/20 mb-4 overflow-x-auto no-scrollbar">
                        <button 
                            onClick={() => setActiveTab('overview')}
                            className={`pb-3 text-sm md:text-base font-bold uppercase transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'text-white border-b-2 border-[#E50914]' : 'text-gray-400'}`}
                        >
                            {t.overview}
                        </button>
                        <button 
                            onClick={() => setActiveTab('trailers')}
                            className={`pb-3 text-sm md:text-base font-bold uppercase transition-colors whitespace-nowrap ${activeTab === 'trailers' ? 'text-white border-b-2 border-[#E50914]' : 'text-gray-400'}`}
                        >
                            {t.trailers}
                        </button>
                        <button 
                            onClick={() => setActiveTab('more_like_this')}
                            className={`pb-3 text-sm md:text-base font-bold uppercase transition-colors whitespace-nowrap ${activeTab === 'more_like_this' ? 'text-white border-b-2 border-[#E50914]' : 'text-gray-400'}`}
                        >
                            {t.moreLikeThis}
                        </button>
                    </div>

                    {/* TAB CONTENT */}
                    <div className="min-h-[200px]">
                        
                        {/* 1. OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6 animate-fade-in-up">
                                <div>
                                    {tagline && (
                                        <p className="text-white/60 text-sm italic mb-2 font-medium">"{tagline}"</p>
                                    )}
                                    <p className="text-sm md:text-base leading-relaxed text-white">
                                        {movie.description}
                                    </p>
                                </div>
                                
                                {/* Cast List (Horizontal Scroll) */}
                                {cast.length > 0 && (
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-semibold text-gray-400">{t.cast}</h3>
                                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                            {cast.map((actor) => (
                                                <div key={actor.id} className="flex-shrink-0 w-20 flex flex-col items-center gap-1">
                                                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800 border border-white/10">
                                                        {actor.profilePath ? (
                                                            <img src={actor.profilePath} alt={actor.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">N/A</div>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-center text-gray-300 leading-tight line-clamp-2">{actor.name}</span>
                                                    <span className="text-[9px] text-center text-gray-500 leading-tight line-clamp-1">{actor.character}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Genres Tags */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold text-gray-400">{t.genres}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {movie.genre.map((g, idx) => (
                                            <span key={idx} className="text-xs px-2 py-1 bg-[#262626] rounded text-gray-200">
                                                {g}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. TRAILERS TAB */}
                        {activeTab === 'trailers' && (
                            <div className="space-y-3 animate-fade-in-up">
                                {videos.length > 0 ? (
                                    videos.map((video) => (
                                        <div 
                                            key={video.id} 
                                            className="group flex gap-3 bg-[#1f1f1f] rounded-md overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition border border-white/5"
                                            onClick={() => handleTrailerClick(video.key)}
                                        >
                                            <div className="relative w-32 md:w-40 aspect-video bg-black flex-shrink-0">
                                                <img 
                                                    src={`https://img.youtube.com/vi/${video.key}/mqdefault.jpg`} 
                                                    alt={video.name}
                                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-8 h-8 rounded-full bg-black/60 border border-white/30 flex items-center justify-center">
                                                        <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="py-2 pr-2 flex flex-col justify-center">
                                                <h4 className="text-sm font-medium text-white line-clamp-2 leading-snug">{video.name}</h4>
                                                <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                                    <Youtube className="w-3 h-3" />
                                                    <span>{video.type}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-10 text-center text-gray-500">
                                        {t.noTrailers}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 3. MORE LIKE THIS TAB */}
                        {activeTab === 'more_like_this' && (
                            <div className="animate-fade-in-up">
                                {recommendations.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        {recommendations.map((recMovie) => (
                                            <div 
                                                key={recMovie.id} 
                                                className="aspect-[2/3] bg-[#222] rounded overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200"
                                                onClick={() => handleRecommendationClick(recMovie)}
                                            >
                                                <img 
                                                    src={recMovie.posterUrl} 
                                                    alt={recMovie.title} 
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-10 text-center text-gray-500">
                                        {t.noRecommendations}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>

        {/* --- TRAILER PLAYER OVERLAY (INTERNAL) --- */}
        {playingTrailerKey && (
            <div className="fixed inset-0 z-[120] bg-black flex flex-col items-center justify-center animate-fade-in-up">
                {/* Close Trailer Button */}
                <button 
                    onClick={() => setPlayingTrailerKey(null)}
                    className="absolute top-6 right-6 p-2 bg-[#1a1a1a] text-white rounded-full hover:bg-[#333] transition z-50 group border border-white/10"
                >
                    <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </button>

                <div className="w-full max-w-5xl aspect-video px-0 md:px-10">
                     <iframe
                        src={`https://www.youtube.com/embed/${playingTrailerKey}?autoplay=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&fs=1&playsinline=1&origin=${encodeURIComponent(getYoutubeOrigin())}`}
                        title="YouTube video player"
                        className="w-full h-full shadow-2xl rounded-none md:rounded-lg"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
