import React, { useEffect, useState, useRef } from 'react';
import { X, Loader2, Server, Tv, Film, Youtube, AlertCircle, RefreshCw, Globe, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [serverMenuState, setServerMenuState] = useState<'visible' | 'semi' | 'hidden'>('visible');
  const [hintState, setHintState] = useState<'hidden' | 'circle' | 'expanded' | 'dismissed'>('hidden');
  const [imdbId, setImdbId] = useState<string | null>(null);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [noSourceAvailable, setNoSourceAvailable] = useState(false);
  
  // Watch Time Tracking Refs
  const accumulatedTimeRef = useRef(0); 
  const timerRef = useRef<any>(null); 
  const isTabActiveRef = useRef(true); 
  const dimTimer1Ref = useRef<any>(null);
  const dimTimer2Ref = useRef<any>(null);
  const hintTimer1Ref = useRef<any>(null);
  const hintTimer2Ref = useRef<any>(null);
  const hintTimer3Ref = useRef<any>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // --- SERVER CONFIGURATION ---
  const SERVER_BASE = 'https://api.rstprgapipt.com/balancer-api/iframe';
  const SERVER_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ3ZWJTaXRlIjoiMzQiLCJpc3MiOiJhcGktd2VibWFzdGVyIiwic3ViIjoiNDEiLCJpYXQiOjE3NDMwNjA3ODAsImp0aSI6IjIzMTQwMmE0LTM3NTMtNGQ3OS1hNDBjLTA2YTY0MTE0MzNhOSIsInNjb3BlIjoiRExFIn0.4PmKGf512P-ov-tEjwr3gfOVxccjx8SSt28slJXypYU';

  const resetDimTimer = () => {
    setIsControlsDimmed(false);
    setServerMenuState('visible');

    if (dimTimer1Ref.current) clearTimeout(dimTimer1Ref.current);
    if (dimTimer2Ref.current) clearTimeout(dimTimer2Ref.current);

    // Stage 1 (0 - 4s): Fully visible
    // Stage 2 (4s): Semi-transparent (both close button and server menu)
    dimTimer1Ref.current = setTimeout(() => {
      setIsControlsDimmed(true);
      setServerMenuState('semi');
    }, 4000);

    // Stage 3 (8.5s): Server menu disappears completely! (Close button stays semi-transparent)
    dimTimer2Ref.current = setTimeout(() => {
      setServerMenuState('hidden');
    }, 8500);
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

    // Animated bottom suggestion timers: circle -> expanded -> auto-fade
    hintTimer1Ref.current = setTimeout(() => {
      setHintState(prev => prev === 'hidden' ? 'circle' : prev);
    }, 1800);

    hintTimer2Ref.current = setTimeout(() => {
      setHintState(prev => prev === 'circle' ? 'expanded' : prev);
    }, 2800);

    hintTimer3Ref.current = setTimeout(() => {
      setHintState(prev => prev === 'expanded' ? 'hidden' : prev);
    }, 12500);

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
      if (dimTimer1Ref.current) clearTimeout(dimTimer1Ref.current);
      if (dimTimer2Ref.current) clearTimeout(dimTimer2Ref.current);
      if (hintTimer1Ref.current) clearTimeout(hintTimer1Ref.current);
      if (hintTimer2Ref.current) clearTimeout(hintTimer2Ref.current);
      if (hintTimer3Ref.current) clearTimeout(hintTimer3Ref.current);
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
    if (server === 'backup') {
      setHintState('dismissed');
    }

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
      // Backup Server (vidsrc.pm embed - does not block sandboxed frames unlike vidsrc.to)
      const backupUrl = resolvedMediaType === 'tv'
        ? `https://vidsrc.pm/embed/tv?imdb=${imdbId}`
        : `https://vidsrc.pm/embed/movie?imdb=${imdbId}`;
      setEmbedUrl(backupUrl);
    } else if (server === 'trailer' && trailerKey) {
      setEmbedUrl(`https://www.youtube.com/embed/${trailerKey}?autoplay=1`);
    }
  };

  const handleHintSwitch = () => {
    setHintState('dismissed');
    handleSwitchServer('backup');
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
      primarySub: "Дубляж",
      backupServer: "Резервний",
      backupSub: "Eng / Ориг",
      trailer: "Трейлер",
      hintTitle: "English / Мова оригіналу?",
      hintDesc: "Увімкніть Резервний сервер",
      hintAction: "Перемкнути",
    },
    ru: {
      loading: "Загрузка плеера...",
      unavailableTitle: "Видео пока недоступно",
      unavailableDesc: "Этот фильм, сериал или мультфильм еще не добавлен в базу плеера или ожидает официального релиза.",
      watchTrailer: "Смотреть трейлер",
      closePlayer: "Вернуться назад",
      primaryServer: "Основной",
      primarySub: "Дубляж",
      backupServer: "Резервный",
      backupSub: "Eng / Ориг",
      trailer: "Трейлер",
      hintTitle: "English / Язык оригинала?",
      hintDesc: "Включите Резервный сервер",
      hintAction: "Переключить",
    },
    en: {
      loading: "Loading Player...",
      unavailableTitle: "Video Currently Unavailable",
      unavailableDesc: "This movie, TV show, or cartoon is not yet available in the player database or is awaiting official release.",
      watchTrailer: "Watch Trailer",
      closePlayer: "Go Back",
      primaryServer: "Primary",
      primarySub: "Dubbed",
      backupServer: "Backup",
      backupSub: "Original / Eng",
      trailer: "Trailer",
      hintTitle: "Prefer Original / English audio?",
      hintDesc: "Switch to Backup server",
      hintAction: "Switch",
    }
  }[lang] || {
    loading: "Завантаження плеєра...",
    unavailableTitle: "Відео наразі недоступне",
    unavailableDesc: "Цей фільм, серіал або мультфільм ще не з'явився у базі онлайн-плеєра або очікує офіційного релізу.",
    watchTrailer: "Дивитися трейлер",
    closePlayer: "Повернутися назад",
    primaryServer: "Основний",
    primarySub: "Дубляж",
    backupServer: "Резервний",
    backupSub: "Eng / Ориг",
    trailer: "Трейлер",
    hintTitle: "English / Мова оригіналу?",
    hintDesc: "Увімкніть Резервний сервер",
    hintAction: "Перемкнути",
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center pointer-events-auto select-none"
      onClick={resetDimTimer}
      onTouchStart={resetDimTimer}
      onMouseMove={resetDimTimer}
    >
      {/* Top Controls: Sleek Server Switchers (Movie title removed as requested) */}
      {imdbId && (
        <div 
          className={`
            fixed left-4 z-[10000]
            transition-all duration-700 ease-in-out
            ${
              serverMenuState === 'visible'
                ? 'opacity-100 scale-100 pointer-events-auto'
                : serverMenuState === 'semi'
                ? 'opacity-40 hover:opacity-100 scale-100 pointer-events-auto'
                : 'opacity-0 scale-95 pointer-events-none'
            }
          `}
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 100px)' }}
        >
          <div className="flex items-center gap-1 p-1 bg-black/80 hover:bg-black/95 backdrop-blur-xl border border-white/15 rounded-full shadow-2xl shadow-black/90 transition-colors">
            {/* Primary Server Button */}
            <button
              onClick={(e) => { e.stopPropagation(); handleSwitchServer('primary'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 ${
                activeServer === 'primary' 
                  ? 'bg-gradient-to-r from-[#E50914] to-[#B20710] text-white shadow-md shadow-red-950/60 ring-1 ring-white/25' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>{labels.primaryServer}</span>
              <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-bold ${
                activeServer === 'primary' ? 'bg-black/30 text-white/90' : 'bg-white/10 text-gray-400'
              }`}>
                {labels.primarySub}
              </span>
            </button>

            {/* Backup Server Button */}
            <button
              onClick={(e) => { e.stopPropagation(); handleSwitchServer('backup'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 ${
                activeServer === 'backup' 
                  ? 'bg-gradient-to-r from-[#E50914] to-[#B20710] text-white shadow-md shadow-red-950/60 ring-1 ring-white/25' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>{labels.backupServer}</span>
              <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-bold ${
                activeServer === 'backup' ? 'bg-black/30 text-white/90' : 'bg-white/10 text-sky-300'
              }`}>
                {labels.backupSub}
              </span>
            </button>

            {/* Trailer Button */}
            {trailerKey && (
              <button
                onClick={(e) => { e.stopPropagation(); handleSwitchServer('trailer'); }}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 ${
                  activeServer === 'trailer' 
                    ? 'bg-gradient-to-r from-[#E50914] to-[#B20710] text-white shadow-md shadow-red-950/60' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Youtube className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">{labels.trailer}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Close Button - Located comfortably BELOW Telegram top bar (right: 4, top: safe-area + 100px). Dims to semi-transparent when idle */}
      <button 
        id="player-close-btn"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className={`
          fixed right-4 z-[10000]
          p-2.5 rounded-full border shadow-2xl backdrop-blur-md
          transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer pointer-events-auto
          ${isControlsDimmed 
            ? 'opacity-35 hover:opacity-100 bg-black/50 text-white/80 border-white/10 hover:bg-[#E50914] hover:text-white hover:border-white/20' 
            : 'opacity-100 bg-black/80 hover:bg-[#E50914] text-white border-white/20 shadow-black/80'
          }
        `}
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 100px)' }}
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

          {/* Animated Bottom Notification: Circle -> Expanded Text Pill -> Auto Hide */}
          <AnimatePresence>
            {activeServer === 'primary' && (hintState === 'circle' || hintState === 'expanded') && (
              <div 
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {hintState === 'circle' ? (
                  <motion.button
                    key="circle-hint"
                    initial={{ y: 50, opacity: 0, scale: 0.6 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 420, damping: 25 }}
                    onClick={() => setHintState('expanded')}
                    className="relative w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl shadow-black/80 hover:scale-105 active:scale-95 border-2 border-white/80 cursor-pointer"
                    aria-label="Language options"
                  >
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E50914] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#E50914]"></span>
                    </span>
                    <Globe className="w-5 h-5 text-[#E50914]" />
                  </motion.button>
                ) : (
                  <motion.div
                    key="expanded-hint"
                    initial={{ y: 30, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 20, opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 350, damping: 26 }}
                    className="flex items-center gap-3 p-2 pl-3.5 pr-2 bg-white/95 hover:bg-white text-neutral-900 rounded-full border border-white/40 shadow-2xl shadow-black/90 backdrop-blur-xl max-w-[92vw] sm:max-w-md"
                  >
                    {/* Icon container */}
                    <div className="w-8 h-8 rounded-full bg-red-100 text-[#E50914] flex items-center justify-center shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>

                    {/* Text block */}
                    <div 
                      className="flex flex-col text-left cursor-pointer select-none"
                      onClick={handleHintSwitch}
                    >
                      <span className="text-[12px] font-bold tracking-tight text-neutral-900 leading-tight flex items-center gap-1.5">
                        {labels.hintTitle}
                        <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wide">
                          ORIG / ENG
                        </span>
                      </span>
                      <span className="text-[10px] text-neutral-600 font-medium leading-tight">
                        {labels.hintDesc}
                      </span>
                    </div>

                    {/* Action button */}
                    <button
                      onClick={handleHintSwitch}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#E50914] hover:bg-[#b80710] text-white text-[11px] font-bold rounded-full shadow transition-all active:scale-95 shrink-0 ml-1 cursor-pointer"
                    >
                      <span>{labels.hintAction}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Dismiss cross */}
                    <button
                      onClick={() => setHintState('dismissed')}
                      className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors shrink-0 cursor-pointer"
                      aria-label="Dismiss hint"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
