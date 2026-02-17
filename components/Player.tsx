
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

  // Базовий URL CDN
  const BASE_PLAYER_URL = 'https://68865.svetacdn.in/lQRlkhufNdas';

  useEffect(() => {
    // Блокуємо скрол на сторінці під час перегляду
    document.body.style.overflow = 'hidden';

    const preparePlayer = async () => {
        try {
            // Отримуємо IMDB ID, оскільки він надійніший для CDN, ніж TMDB ID
            const imdbId = await API.fetchExternalIds(movie.id, movie.mediaType);
            
            if (imdbId) {
                setEmbedUrl(`${BASE_PLAYER_URL}?imdb_id=${imdbId}`);
            } else {
                setEmbedUrl(`${BASE_PLAYER_URL}?tmdb_id=${movie.id}`);
            }
        } catch (e) {
            console.error("Failed to prepare player url", e);
            setEmbedUrl(`${BASE_PLAYER_URL}?tmdb_id=${movie.id}`);
        }
    };

    preparePlayer();

    const dimTimer = setTimeout(() => {
      setIsControlsDimmed(true);
    }, 3000);

    const loadTimer = setTimeout(() => {
      setIsLoading(false);
    }, 4000);

    // --- REWARD SYSTEM & TRACKING ---
    
    // 1. Visibility Handler (Only stop if tab is switched/minimized)
    const handleVisibilityChange = () => {
        if (document.hidden) {
            isTabActiveRef.current = false;
        } else {
            isTabActiveRef.current = true;
        }
    };

    // REMOVED: blur/focus listeners. 
    // Clicking the iframe triggers 'blur' on the window, which was wrongly pausing the timer.
    
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 2. Main Tracking Loop
    if (userId) {
        timerRef.current = setInterval(() => {
            // Only count if tab is visually active
            if (isTabActiveRef.current) {
                accumulatedTimeRef.current += 1; 

                // CHANGED: Update every 60 seconds (1 minute) instead of 5 minutes
                if (accumulatedTimeRef.current >= 60) {
                    // Send Reward! (60 seconds)
                    addWatchTimeReward(userId, 60);
                    // Reset accumulator
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
        style={{ top: 'calc(60px + env(safe-area-inset-top))' }}
      >
        <X className="w-8 h-8" />
      </button>

      {(isLoading || !embedUrl) && (
        <div className="absolute inset-0 flex items-center justify-center z-0 bg-black">
          <Loader2 className="w-12 h-12 text-[#E50914] animate-spin" />
        </div>
      )}

      {embedUrl && (
        <div className="w-full h-full relative z-10">
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
      )}
    </div>
  );
};
