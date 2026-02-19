
import React, { useEffect, useState, useRef } from 'react';
import { X, Loader2, Server, MonitorPlay } from 'lucide-react';
import { Movie } from '../types';
import { API } from '../services/tmdb';
import { addWatchTimeReward } from '../services/firebase';

interface PlayerProps {
  movie: Movie;
  onClose: () => void;
  userId?: number;
}

export const Player: React.FC<PlayerProps> = ({ movie, onClose, userId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [isControlsDimmed, setIsControlsDimmed] = useState(false);
  const [activeServer, setActiveServer] = useState<1 | 2>(1);

  // Watch Time Tracking Refs
  const accumulatedTimeRef = useRef(0); 
  const timerRef = useRef<any>(null); 
  const isTabActiveRef = useRef(true); 

  // --- SERVER 1 CONFIGURATION (Ashdi/Rstprg) ---
  const SERVER_1_BASE = 'https://api.rstprgapipt.com/balancer-api/iframe';
  const SERVER_1_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ3ZWJTaXRlIjoiMzQiLCJpc3MiOiJhcGktd2VibWFzdGVyIiwic3ViIjoiNDEiLCJpYXQiOjE3NDMwNjA3ODAsImp0aSI6IjIzMTQwMmE0LTM3NTMtNGQ';

  // --- SERVER 2 CONFIGURATION (FlixCDN) ---
  // Format: https://player0.flixcdn.space/show/imdb/tt1234567
  const SERVER_2_BASE = 'https://player0.flixcdn.space/show/imdb';

  useEffect(() => {
    // Блокуємо скрол на сторінці під час перегляду
    document.body.style.overflow = 'hidden';
    setIsLoading(true);

    const preparePlayer = async () => {
        try {
            // Отримуємо IMDB ID для точності
            const imdbId = await API.fetchExternalIds(movie.id, movie.mediaType);
            const title = encodeURIComponent(movie.title);

            if (activeServer === 1) {
                // --- SERVER 1 LOGIC (Ashdi) ---
                let params = `token=${SERVER_1_TOKEN}`;
                
                if (imdbId) {
                    params += `&imdb=${imdbId}`;      
                    params += `&imdb_id=${imdbId}`;   
                }

                params += `&tmdb=${movie.id}`;
                params += `&tmdb_id=${movie.id}`;
                params += `&title=${title}`;
                params += `&name=${title}`;
                
                if (movie.mediaType === 'tv') {
                    params += `&type=tv_series`;
                } else {
                    params += `&type=movie`;
                }

                params += `&autoplay=1`;
                setEmbedUrl(`${SERVER_1_BASE}?${params}`);

            } else {
                // --- SERVER 2 LOGIC (FlixCDN) ---
                // Doc: <iframe src="//player0.flixcdn.space/show/imdb/tt2719848" ...>
                
                if (imdbId) {
                    // FlixCDN relies heavily on IMDb ID for this iframe format
                    setEmbedUrl(`${SERVER_2_BASE}/${imdbId}`);
                } else {
                    console.warn("FlixCDN requires IMDb ID, but none found. Switching to fallback or showing error.");
                    // Fallback to Server 1 if no IMDb ID is available for FlixCDN
                    // But for now, let's try to pass just the URL. If it fails, user can switch to Server 1.
                    setEmbedUrl(null); 
                }
            }
            
        } catch (e) {
            console.error("Failed to prepare player url", e);
            // Fallback just in case
            if (activeServer === 1) {
                const fallbackParams = `token=${SERVER_1_TOKEN}&title=${encodeURIComponent(movie.title)}`;
                setEmbedUrl(`${SERVER_1_BASE}?${fallbackParams}`);
            }
        }
    };

    preparePlayer();

    const dimTimer = setTimeout(() => {
      setIsControlsDimmed(true);
    }, 3000);

    // Reset loading state slightly after URL is set to allow iframe to start request
    const loadTimer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

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

    return () => {
      document.body.style.overflow = 'unset';
      clearTimeout(dimTimer);
      clearTimeout(loadTimer);
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [movie, userId, activeServer]);

  // Helper to handle server switch
  const switchServer = (serverId: 1 | 2) => {
      if (activeServer !== serverId) {
          setEmbedUrl(null); // Clear URL to force reload visual
          setActiveServer(serverId);
      }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center pointer-events-auto">
      
      {/* SERVER SWITCHER (Top Center) - HIDDEN UNTIL VERIFICATION */}
      {/* 
      <div 
        className={`
            absolute top-6 left-1/2 -translate-x-1/2 z-[10000]
            flex items-center gap-2 p-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10
            transition-opacity duration-300
            ${isControlsDimmed ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}
        `}
        style={{ top: 'calc(20px + env(safe-area-inset-top))' }}
      >
          <button 
             onClick={() => switchServer(1)}
             className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all
                ${activeServer === 1 
                    ? 'bg-[#E50914] text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }
             `}
          >
              <Server className="w-3 h-3" />
              SERVER 1
          </button>
          <div className="w-px h-4 bg-white/20"></div>
          <button 
             onClick={() => switchServer(2)}
             className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all
                ${activeServer === 2 
                    ? 'bg-[#E50914] text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }
             `}
          >
              <MonitorPlay className="w-3 h-3" />
              SERVER 2
          </button>
      </div>
      */}

      {/* Close Button */}
      <button 
        onClick={onClose}
        className={`
            absolute right-6 z-[9999] p-2.5 
            bg-black/40 text-white rounded-full backdrop-blur-md 
            border border-white/10 shadow-lg
            transition-all duration-700 ease-in-out
            hover:bg-[#E50914] hover:opacity-100 hover:scale-110 active:opacity-100
            ${isControlsDimmed ? 'opacity-30' : 'opacity-100'}
        `}
        style={{ top: 'calc(20px + env(safe-area-inset-top))' }}
      >
        <X className="w-8 h-8" />
      </button>

      {/* Loading State */}
      {(isLoading || !embedUrl) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-0 bg-black">
          <Loader2 className="w-12 h-12 text-[#E50914] animate-spin mb-4" />
          <p className="text-gray-400 text-xs font-bold tracking-widest uppercase animate-pulse">
             {activeServer === 2 && !embedUrl ? "Content ID missing for Server 2" : `Connecting to Server...`}
          </p>
          {activeServer === 2 && !embedUrl && (
             <p className="text-gray-500 text-[10px] mt-2">Try switching to Server 1</p>
          )}
        </div>
      )}

      {/* Iframe Player */}
      {embedUrl ? (
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
        </div>
      ) : null}
    </div>
  );
};
