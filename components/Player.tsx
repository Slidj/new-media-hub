
import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Movie } from '../types';
import { API } from '../services/tmdb';

interface PlayerProps {
  movie: Movie;
  onClose: () => void;
}

export const Player: React.FC<PlayerProps> = ({ movie, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [isControlsDimmed, setIsControlsDimmed] = useState(false);

  // Базовий URL CDN
  const BASE_PLAYER_URL = 'https://68865.svetacdn.in/lQRlkhufNdas';

  useEffect(() => {
    // Блокуємо скрол на сторінці під час перегляду
    document.body.style.overflow = 'hidden';

    const preparePlayer = async () => {
        try {
            // Отримуємо IMDB ID, оскільки він надійніший для CDN, ніж TMDB ID
            const imdbId = await API.fetchExternalIds(movie.id, movie.mediaType);
            
            // Формуємо URL
            // Пріоритет: IMDB ID -> TMDB ID
            if (imdbId) {
                setEmbedUrl(`${BASE_PLAYER_URL}?imdb_id=${imdbId}`);
            } else {
                setEmbedUrl(`${BASE_PLAYER_URL}?tmdb_id=${movie.id}`);
            }
        } catch (e) {
            console.error("Failed to prepare player url", e);
            // Fallback
            setEmbedUrl(`${BASE_PLAYER_URL}?tmdb_id=${movie.id}`);
        }
    };

    preparePlayer();

    // Таймер для затемнення контролів (кнопки закриття)
    // Через 3 секунди кнопка стане напівпрозорою
    const dimTimer = setTimeout(() => {
      setIsControlsDimmed(true);
    }, 3000);

    // Fail-safe таймер для лоадера
    const loadTimer = setTimeout(() => {
      setIsLoading(false);
    }, 4000);

    return () => {
      document.body.style.overflow = 'unset';
      clearTimeout(dimTimer);
      clearTimeout(loadTimer);
    };
  }, [movie]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
      {/* Кнопка закриття 
          - top-20: Опущено ще нижче для уникнення конфліктів з інтерфейсом системи/телеграму
          - opacity логіка: стає 30% прозорою через 3 сек, але 100% при наведенні/натисканні
      */}
      <button 
        onClick={onClose}
        className={`
            absolute top-20 right-6 z-[210] p-2.5 
            bg-black/40 text-white rounded-full backdrop-blur-md 
            border border-white/10 shadow-lg
            transition-all duration-700 ease-in-out
            hover:bg-[#E50914] hover:opacity-100 hover:scale-110 active:opacity-100
            ${isControlsDimmed ? 'opacity-30' : 'opacity-100'}
        `}
      >
        <X className="w-8 h-8" />
      </button>

      {/* Лоадер: показуємо поки вантажиться або URL ще не сформовано */}
      {(isLoading || !embedUrl) && (
        <div className="absolute inset-0 flex items-center justify-center z-0 bg-black">
          <Loader2 className="w-12 h-12 text-[#E50914] animate-spin" />
        </div>
      )}

      {/* Iframe з плеєром */}
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
