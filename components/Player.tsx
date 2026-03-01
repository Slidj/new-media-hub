
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

  // --- SERVER CONFIGURATION ---
  // Updated with the FULL token from the working example
  const SERVER_BASE = 'https://api.rstprgapipt.com/balancer-api/iframe';
  const SERVER_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ3ZWJTaXRlIjoiMzQiLCJpc3MiOiJhcGktd2VibWFzdGVyIiwic3ViIjoiNDEiLCJpYXQiOjE3NDMwNjA3ODAsImp0aSI6IjIzMTQwMmE0LTM3NTMtNGQ3OS1hNDBjLTA2YTY0MTE0MzNhOSIsInNjb3BlIjoiRExFIn0.4PmKGf512P-ov-tEjwr3gfOVxccjx8SSt28slJXypYU';

  useEffect(() => {
    // Lock scroll
    document.body.style.overflow = 'hidden';
    setIsLoading(true);

    const preparePlayer = async () => {
        try {
            // Fetch external IDs (IMDB is key)
            const externalIds = await API.fetchExternalIds(movie.id, movie.mediaType);
            const imdbId = externalIds?.imdb_id;
            const title = encodeURIComponent(movie.title);

            // Construct URL parameters
            const params = new URLSearchParams();
            params.append('token', SERVER_TOKEN);
            
            if (imdbId) {
                params.append('imdb', imdbId);
            }
            
            params.append('tmdb', movie.id);
            params.append('title', movie.title);
            params.append('autoplay', '1');
            params.append('disabled_share', '1'); // As per working example
            params.append('d', 'media-hub.app'); // Domain parameter for ad configuration

            const finalUrl = `${SERVER_BASE}?${params.toString()}`;
            console.log("Player URL:", finalUrl);
            
            setEmbedUrl(finalUrl);
            
        } catch (e) {
            console.error("Error preparing player:", e);
            // Fallback to just title search if IDs fail
            const params = new URLSearchParams();
            params.append('token', SERVER_TOKEN);
            params.append('title', movie.title);
            setEmbedUrl(`${SERVER_BASE}?${params.toString()}`);
        }
    };

    preparePlayer();

    const dimTimer = setTimeout(() => {
      setIsControlsDimmed(true);
    }, 3000);

    // Timeout to hide loader if iframe takes too long (or fails silently)
    const loadTimer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

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
            bg-black/60 text-white rounded-full 
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
