
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
  
  // Active Server State (Fixed to 1 for now until Server 2 is verified)
  const [activeServer] = useState<1 | 2>(1); 

  // Watch Time Tracking Refs
  const accumulatedTimeRef = useRef(0); 
  const timerRef = useRef<any>(null); 
  const isTabActiveRef = useRef(true); 

  // --- SERVER 1 CONFIGURATION (Ashdi/Rstprg) ---
  const SERVER_1_BASE = 'https://api.rstprgapipt.com/balancer-api/iframe';
  const SERVER_1_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ3ZWJTaXRlIjoiMzQiLCJpc3MiOiJhcGktd2VibWFzdGVyIiwic3ViIjoiNDEiLCJpYXQiOjE3NDMwNjA3ODAsImp0aSI6IjIzMTQwMmE0LTM3NTMtNGQ';

  // --- SERVER 2 CONFIGURATION (VideoCDN / Kinoserial) - BACKUP ---
  // const SERVER_VIDEOCDN_BASE = 'https://tv-1-kinoserial.net/embed';
  // const SERVER_VIDEOCDN_TOKEN = '1a3ff41a822fc5be328b7c6a91b7f2fb';

  // --- SERVER 3 CONFIGURATION (FlixCDN) ---
  // Format: https://player0.flixcdn.space/show/imdb/tt1234567
  // const SERVER_2_BASE = 'https://player0.flixcdn.space/show/imdb';

  useEffect(() => {
    // Блокуємо скрол на сторінці під час перегляду
    document.body.style.overflow = 'hidden';
    setIsLoading(true);

    const preparePlayer = async () => {
        try {
            // Отримуємо всі зовнішні ID
            const externalIds = await API.fetchExternalIds(movie.id, movie.mediaType);
            const kpId = externalIds?.id_kp || externalIds?.kinopoisk_id;
            const imdbId = externalIds?.imdb_id;
            const title = encodeURIComponent(movie.title);

            // --- SERVER 1 LOGIC (Ashdi) ---
            const BASE_URL = 'https://api.rstprgapipt.com/balancer-api/iframe';
            
            let finalUrl = '';

            // STRICT STRATEGY: Match the user's working link exactly
            if (kpId) {
                // If we have KP ID, send ONLY what is in the working example
                const params = new URLSearchParams();
                params.append('token', SERVER_1_TOKEN);
                params.append('kp', kpId.toString());
                params.append('autoplay', '1');
                params.append('disabled_share', '1');
                
                finalUrl = `${BASE_URL}?${params.toString()}`;
            } 
            else if (imdbId) {
                // Fallback to IMDB if no KP
                const params = new URLSearchParams();
                params.append('token', SERVER_1_TOKEN);
                params.append('imdb', imdbId);
                params.append('autoplay', '1');
                params.append('disabled_share', '1');
                
                finalUrl = `${BASE_URL}?${params.toString()}`;
            }
            else {
                // Last resort: TMDB + Title
                const params = new URLSearchParams();
                params.append('token', SERVER_1_TOKEN);
                params.append('tmdb', movie.id.toString());
                params.append('title', movie.title);
                params.append('autoplay', '1');
                params.append('disabled_share', '1');
                
                finalUrl = `${BASE_URL}?${params.toString()}`;
            }
            
            console.log("Generated Embed URL:", finalUrl);
            setEmbedUrl(finalUrl);
            
        } catch (e) {
            console.error("Failed to prepare player url", e);
            // Fallback
            setEmbedUrl(`${SERVER_1_BASE}?token=${SERVER_1_TOKEN}&title=${encodeURIComponent(movie.title)}`);
        }
    };

    preparePlayer();

    const dimTimer = setTimeout(() => {
      setIsControlsDimmed(true);
    }, 3000);

    // Increase timeout to 10s to avoid flashing error state
    const loadTimer = setTimeout(() => {
      setIsLoading(false);
    }, 10000);

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

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center pointer-events-auto">
      
      {/* SERVER SWITCHER HIDDEN */}

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
        style={{ top: 'calc(70px + env(safe-area-inset-top))' }}
      >
        <X className="w-8 h-8" />
      </button>

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black">
          <Loader2 className="w-12 h-12 text-[#E50914] animate-spin mb-4" />
          <p className="text-gray-400 text-xs font-bold tracking-widest uppercase animate-pulse">
             Loading Player...
          </p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && !embedUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-black text-center px-6">
            <div className="text-[#E50914] text-5xl mb-4">:(</div>
            <h3 className="text-white text-xl font-bold mb-2">Video Not Found</h3>
            <p className="text-gray-400 text-sm max-w-md">
                We couldn't find this title. It might be missing or blocked.
            </p>
            <button 
                onClick={onClose}
                className="mt-6 px-6 py-2 bg-white text-black font-bold rounded hover:bg-gray-200 transition"
            >
                Close Player
            </button>
        </div>
      )}

      {/* Iframe Player */}
      {embedUrl && (
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
      )}
    </div>
  );
};
