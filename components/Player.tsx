import React, { useEffect, useState, useRef } from 'react';
import { X, Loader2, Server, Tv, Film, Youtube, AlertCircle, RefreshCw } from 'lucide-react';
import { Movie, Video } from '../types';
import { API } from '../services/tmdb';
import { addWatchTimeReward } from '../services/firebase';
import { Language } from '../utils/translations';

interface PlayerProps {
  movie: Movie;
  onClose: () => void;
  userId?: number;
  lang?: Language;
}

type ServerType = 'primary' | 'backup' | 'trailer';

export const Player: React.FC<PlayerProps> = ({ movie, onClose, userId, lang = 'uk' }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [activeServer, setActiveServer] = useState<ServerType>('primary');
  const [isControlsDimmed, setIsControlsDimmed] = useState(false);
  const [imdbId, setImdbId] = useState<string | null>(null);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [noSourceAvailable, setNoSourceAvailable] = useState(false);
  
  // Watch Time Tracking Refs
  const accumulatedTimeRef = useRef(0); 
  const timerRef = useRef<any>(null); 
  const isTabActiveRef = useRef(true); 
  const dimTimerRef = useRef<any>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // --- SERVER CONFIGURATION ---
  const SERVER_BASE = 'https://api.rstprgapipt.com/balancer-api/iframe';
  const SERVER_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ3ZWJTaXRlIjoiMzQiLCJpc3MiOiJhcGktd2VibWFzdGVyIiwic3ViIjoiNDEiLCJpYXQiOjE3NDMwNjA3ODAsImp0aSI6IjIzMTQwMmE0LTM3NTMtNGQ3OS1hNDBjLTA2YTY0MTE0MzNhOSIsInNjb3BlIjoiRExFIn0.4PmKGf512P-ov-tEjwr3gfOVxccjx8SSt28slJXypYU';

  const resetDimTimer = () => {
    setIsControlsDimmed(false);
    if (dimTimerRef.current) clearTimeout(dimTimerRef.current);
    dimTimerRef.current = setTimeout(() => {
      setIsControlsDimmed(true);
    }, 3500);
  };

  useEffect(() => {
    // Lock scroll
    document.body.style.overflow = 'hidden';
    setIsLoading(true);
    setNoSourceAvailable(false);

    let isMounted = true;

    const preparePlayer = async () => {
      try {
        // 1. Fetch external IDs using multi-step robust lookup (movie/tv fallback, title search)
        const [externalIds, videos] = await Promise.all([
          API.fetchExternalIds(movie.id, movie.mediaType, movie.title, movie.year),
          API.fetchVideos(movie.id, movie.mediaType).catch(() => [] as Video[])
        ]);

        if (!isMounted) return;

        // Extract trailer key if present
        const officialTrailer = videos.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')) || videos[0];
        if (officialTrailer?.key) {
          setTrailerKey(officialTrailer.key);
        }

        const resolvedImdb = externalIds?.imdb_id;
        const resolvedMediaType = externalIds?.mediaType || movie.mediaType || 'movie';

        if (resolvedImdb) {
          setImdbId(resolvedImdb);

          // Build primary server URL (balancer with valid imdb key)
          const primaryParams = new URLSearchParams();
          primaryParams.append('token', SERVER_TOKEN);
          primaryParams.append('imdb', resolvedImdb);
          primaryParams.append('autoplay', '1');
          primaryParams.append('disabled_share', '1');
          primaryParams.append('d', 'media-hub.app');

          const finalPrimaryUrl = `${SERVER_BASE}?${primaryParams.toString()}`;
          setEmbedUrl(finalPrimaryUrl);
          setActiveServer('primary');
        } else {
          // If no IMDB id could be resolved anywhere, do NOT load broken iframe
          console.warn("No IMDb ID found for movie:", movie.title);
          setNoSourceAvailable(true);
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Error preparing player:", e);
        if (isMounted) {
          setNoSourceAvailable(true);
          setIsLoading(false);
        }
      }
    };

    preparePlayer();
    resetDimTimer();

    // Timeout to hide loader if iframe takes too long
    const loadTimer = setTimeout(() => {
      setIsLoading(false);
    }, 4500);

    // --- REWARD SYSTEM ---
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isTabActiveRef.current = false;
      } else {
        isTabActiveRef.current = true;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (userId) {
      timerRef.current = setInterval(() => {
        if (isTabActiveRef.current) {
          accumulatedTimeRef.current += 1; 
          // Reward every 60 seconds
          if (accumulatedTimeRef.current >= 60) {
            addWatchTimeReward(userId, 60);
            accumulatedTimeRef.current = 0;
          }
        }
      }, 1000);
    }

    // Telegram BackButton handler
    const handleTgBack = () => {
      onCloseRef.current();
    };

    // Request Telegram Fullscreen or Expand & show BackButton
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      try {
        if (tg.isVersionAtLeast && tg.isVersionAtLeast('8.0') && tg.requestFullscreen) {
          tg.requestFullscreen();
        } else if (tg.expand) {
          tg.expand();
        }

        if (tg.isVersionAtLeast && tg.isVersionAtLeast('6.1')) {
          tg.BackButton.show();
          tg.BackButton.onClick(handleTgBack);
        }
      } catch (e) {
        console.error("Failed to request fullscreen/expand:", e);
      }
    }

    return () => {
      isMounted = false;
      document.body.style.overflow = 'unset';
      if (dimTimerRef.current) clearTimeout(dimTimerRef.current);
      clearTimeout(loadTimer);
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        if (tg.isVersionAtLeast && tg.isVersionAtLeast('6.1')) {
          tg.BackButton.offClick(handleTgBack);
          tg.BackButton.hide();
        }
      }
    };
  }, [movie, userId]);

  // Server Switch Handler
  const handleSwitchServer = (server: ServerType) => {
    setActiveServer(server);
    setIsLoading(true);
    resetDimTimer();

    const resolvedMediaType = movie.mediaType === 'tv' ? 'tv' : 'movie';

    if (server === 'primary' && imdbId) {
      const primaryParams = new URLSearchParams();
      primaryParams.append('token', SERVER_TOKEN);
      primaryParams.append('imdb', imdbId);
      primaryParams.append('autoplay', '1');
      primaryParams.append('disabled_share', '1');
      primaryParams.append('d', 'media-hub.app');
      setEmbedUrl(`${SERVER_BASE}?${primaryParams.toString()}`);
    } else if (server === 'backup' && imdbId) {
      // Backup Server (vidsrc embed)
      const backupUrl = `https://vidsrc.to/embed/${resolvedMediaType}/${imdbId}`;
      setEmbedUrl(backupUrl);
    } else if (server === 'trailer' && trailerKey) {
      setEmbedUrl(`https://www.youtube.com/embed/${trailerKey}?autoplay=1`);
    }
  };

  // Localized UI labels
  const labels = {
    uk: {
      loading: "Завантаження плеєра...",
      unavailableTitle: "Відео наразі недоступне",
      unavailableDesc: "Цей фільм, серіал або мультфільм ще не з'явився у базі онлайн-плеєра або очікує офіційного релізу.",
      watchTrailer: "Дивитися трейлер",
      closePlayer: "Повернутися назад",
      primaryServer: "Основний",
      backupServer: "Резервний",
      trailer: "Трейлер",
      switchHint: "Не відтворюється? Спробуйте Резервний сервер"
    },
    ru: {
      loading: "Загрузка плеера...",
      unavailableTitle: "Видео пока недоступно",
      unavailableDesc: "Этот фильм, сериал или мультфильм еще не добавлен в базу плеера или ожидает официального релиза.",
      watchTrailer: "Смотреть трейлер",
      closePlayer: "Вернуться назад",
      primaryServer: "Основной",
      backupServer: "Резервный",
      trailer: "Трейлер",
      switchHint: "Не воспроизводится? Попробуйте Резервный сервер"
    },
    en: {
      loading: "Loading Player...",
      unavailableTitle: "Video Currently Unavailable",
      unavailableDesc: "This movie, TV show, or cartoon is not yet available in the player database or is awaiting official release.",
      watchTrailer: "Watch Trailer",
      closePlayer: "Go Back",
      primaryServer: "Primary",
      backupServer: "Backup",
      trailer: "Trailer",
      switchHint: "Not playing? Try Backup server"
    }
  }[lang] || {
    loading: "Завантаження плеєра...",
    unavailableTitle: "Відео наразі недоступне",
    unavailableDesc: "Цей фільм, серіал або мультфільм ще не з'явився у базі онлайн-плеєра або очікує офіційного релізу.",
    watchTrailer: "Дивитися трейлер",
    closePlayer: "Повернутися назад",
    primaryServer: "Основний",
    backupServer: "Резервний",
    trailer: "Трейлер",
    switchHint: "Не відтворюється? Спробуйте Резервний сервер"
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center pointer-events-auto select-none"
      onClick={resetDimTimer}
      onTouchStart={resetDimTimer}
      onMouseMove={resetDimTimer}
    >
      {/* Top Controls Overlay: Title & Server Badges */}
      <div 
        className={`
          absolute top-0 left-0 right-0 z-[9998] px-4 py-3
          flex items-center justify-between
          bg-gradient-to-b from-black/90 via-black/50 to-transparent
          transition-opacity duration-500 ease-in-out pointer-events-none
          ${isControlsDimmed ? 'opacity-0' : 'opacity-100'}
        `}
        style={{ paddingTop: 'calc(12px + env(safe-area-inset-top))' }}
      >
        {/* Title & Server Badges */}
        <div className={`flex items-center gap-2 max-w-[calc(100%-64px)] ${isControlsDimmed ? 'pointer-events-none' : 'pointer-events-auto'}`}>
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-xs font-semibold text-white/90">
            {movie.mediaType === 'tv' ? <Tv className="w-3.5 h-3.5 text-[#E50914]" /> : <Film className="w-3.5 h-3.5 text-[#E50914]" />}
            <span className="truncate max-w-[130px] sm:max-w-[220px] md:max-w-[320px]">{movie.title}</span>
          </div>

          {/* Server Switchers (Only show if movie has imdb source) */}
          {imdbId && (
            <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md p-0.5 rounded-full border border-white/10">
              <button
                onClick={(e) => { e.stopPropagation(); handleSwitchServer('primary'); }}
                className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full transition-all ${
                  activeServer === 'primary' 
                    ? 'bg-[#E50914] text-white shadow' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {labels.primaryServer}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleSwitchServer('backup'); }}
                className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full transition-all ${
                  activeServer === 'backup' 
                    ? 'bg-[#E50914] text-white shadow' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {labels.backupServer}
              </button>
              {trailerKey && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleSwitchServer('trailer'); }}
                  className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-full transition-all ${
                    activeServer === 'trailer' 
                      ? 'bg-[#E50914] text-white shadow' 
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Youtube className="w-3 h-3 text-red-400" />
                  <span>{labels.trailer}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Close Button - Stays accessible! Dims to semi-transparent when controls idle, full on hover/active */}
      <button 
        id="player-close-btn"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className={`
          fixed top-3 right-4 md:top-4 md:right-4 z-[10000]
          p-2.5 rounded-full border shadow-2xl backdrop-blur-md
          transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer pointer-events-auto
          ${isControlsDimmed 
            ? 'opacity-30 hover:opacity-100 bg-black/40 text-white/75 border-white/10 hover:bg-[#E50914] hover:text-white hover:border-white/20' 
            : 'opacity-100 bg-black/75 hover:bg-[#E50914] text-white border-white/20 shadow-black/80'
          }
        `}
        style={{ top: 'calc(12px + env(safe-area-inset-top))' }}
        aria-label="Close Player"
        title={labels.closePlayer}
      >
        <X className="w-5 h-5 md:w-6 md:h-6 stroke-[2.5]" />
      </button>

      {/* Loading State */}
      {isLoading && !noSourceAvailable && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black">
          <Loader2 className="w-12 h-12 text-[#E50914] animate-spin mb-4" />
          <p className="text-gray-400 text-xs font-bold tracking-widest uppercase animate-pulse">
            {labels.loading}
          </p>
        </div>
      )}

      {/* Friendly Fallback / Unavailable State (Never show broken Russian balancer error) */}
      {noSourceAvailable && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-gradient-to-b from-[#141414] to-black text-center px-6">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-[#E50914]" />
            </div>
          </div>

          <h3 className="text-white text-2xl font-bold mb-3 tracking-tight">
            {labels.unavailableTitle}
          </h3>

          <p className="text-gray-400 text-sm max-w-md leading-relaxed mb-8">
            {labels.unavailableDesc}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
            {trailerKey && (
              <button 
                onClick={() => handleSwitchServer('trailer')}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#E50914] hover:bg-[#b80710] text-white font-bold rounded-lg transition-all shadow-lg active:scale-95"
              >
                <Youtube className="w-5 h-5" />
                <span>{labels.watchTrailer}</span>
              </button>
            )}

            <button 
              onClick={onClose}
              className="w-full px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg border border-white/10 transition-all active:scale-95"
            >
              {labels.closePlayer}
            </button>
          </div>
        </div>
      )}

      {/* Iframe Video Player */}
      {embedUrl && !noSourceAvailable && (
        <div className="w-full h-full relative z-10 bg-black">
          <iframe
            key={embedUrl}
            src={embedUrl}
            title={movie.title}
            width="100%"
            height="100%"
            className="w-full h-full border-none"
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            referrerPolicy="origin"
            onLoad={() => setIsLoading(false)}
          />

          {/* Bottom subtle hint if user is on Server 1 and might want to switch */}
          {activeServer === 'primary' && !isControlsDimmed && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
              <button
                onClick={() => handleSwitchServer('backup')}
                className="flex items-center gap-2 px-3 py-1.5 bg-black/80 hover:bg-black text-gray-300 hover:text-white text-xs font-medium rounded-full border border-white/15 backdrop-blur-md shadow-lg transition-all"
              >
                <RefreshCw className="w-3 h-3 text-[#E50914]" />
                <span>{labels.switchHint}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
