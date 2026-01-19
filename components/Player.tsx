
import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Movie } from '../types';

interface PlayerProps {
  movie: Movie;
  onClose: () => void;
}

export const Player: React.FC<PlayerProps> = ({ movie, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  // Базовий URL для CDN
  const BASE_PLAYER_URL = 'https://68865.svetacdn.in/lQRlkhufNdas';
  
  // Формування URL залежно від типу медіа (movie або tv)
  const embedUrl = `${BASE_PLAYER_URL}/${movie.mediaType}/${movie.id}`;

  useEffect(() => {
    // Блокування скролу сторінки під час перегляду
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* Кнопка закриття */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-[210] p-2 bg-black/50 hover:bg-[#E50914] text-white rounded-full backdrop-blur-md transition-colors border border-white/20"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Лоадер */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <Loader2 className="w-10 h-10 text-[#E50914] animate-spin" />
        </div>
      )}

      {/* Iframe з плеєром */}
      <iframe
        src={embedUrl}
        title={movie.title}
        className="w-full h-full border-none z-10"
        allowFullScreen
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        onLoad={() => setIsLoading(false)}
        style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.5s ease' }}
      />
    </div>
  );
};
