
import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Movie } from '../types';

interface PlayerProps {
  movie: Movie;
  onClose: () => void;
}

export const Player: React.FC<PlayerProps> = ({ movie, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  // Базовий URL CDN
  const BASE_PLAYER_URL = 'https://68865.svetacdn.in/lQRlkhufNdas';
  
  // Використовуємо універсальний параметр tmdb_id.
  // Це дозволяє плеєру автоматично знайти контент (фільм або серіал) у своїй базі,
  // ігноруючи можливі помилки в шляхах типу /movie/ vs /tv-series/
  const embedUrl = `${BASE_PLAYER_URL}?tmdb_id=${movie.id}`;

  useEffect(() => {
    // Блокуємо скрол на сторінці під час перегляду
    document.body.style.overflow = 'hidden';

    // Fail-safe: прибираємо лоадер через 3 секунди, щоб користувач побачив плеєр
    // навіть якщо подія onLoad не спрацювала коректно
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => {
      document.body.style.overflow = 'unset';
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
      {/* Кнопка закриття */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-[210] p-2 bg-black/50 hover:bg-[#E50914] text-white rounded-full backdrop-blur-md transition-colors border border-white/20"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Лоадер */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-0 bg-black">
          <Loader2 className="w-12 h-12 text-[#E50914] animate-spin" />
        </div>
      )}

      {/* Iframe з плеєром */}
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
    </div>
  );
};
