
import React, { useEffect, useState, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';
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

  // Watch Time Tracking Refs
  const accumulatedTimeRef = useRef(0); 
  const timerRef = useRef<any>(null); 
  const isTabActiveRef = useRef(true); 

  // --- SERVER CONFIGURATION (Ashdi/Rstprg) ---
  const SERVER_BASE = 'https://api.rstprgapipt.com/balancer-api/iframe';
  const SERVER_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ3ZWJTaXRlIjoiMzQiLCJpc3MiOiJhcGktd2VibWFzdGVyIiwic3ViIjoiNDEiLCJpYXQiOjE3NDMwNjA3ODAsImp0aSI6IjIzMTQwMmE0LTM3NTMtNGQ';

  useEffect(() => {
    // Блокуємо скрол на сторінці під час перегляду
    document.body.style.overflow = 'hidden';
    setIsLoading(true);

    const preparePlayer = async () => {
        try {
            // Отримуємо IMDB ID для точності
            const imdbId = await API.fetchExternalIds(movie.id, movie.mediaType);
            const title = encodeURIComponent(movie.title);

            let params = `token=${SERVER_TOKEN}`;
            
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
            setEmbedUrl(`${SERVER_BASE}?${params}`);
            
        } catch (e) {
            console.error("Failed to prepare player url", e);
            // Fallback just in case
            const fallbackParams = `token=${SERVER_TOKEN}&title=${encodeURIComponent(movie.title)}`;
            setEmbedUrl(`${SERVER_BASE}?${fallbackParams}`);
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
  }, [movie, userId]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center pointer-events-auto">
      
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
            Loading Player...
          </p>
        </div>
      )}

      {/* Iframe Player */}
      {embedUrl ? (
        <div className="w-full h-full relative z-10 bg-black">
            <iframe
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
      ) : (
        <div className="relative z-10 text-center px-6">
            <p className="text-gray-400 mb-2">Video source unavailable.</p>
            <button onClick={onClose} className="text-white underline">Close</button>
        </div>
      )}
    </div>
  );
};
