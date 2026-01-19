
export interface Movie {
  id: string;
  title: string;
  description: string;
  bannerUrl: string;
  posterUrl: string;
  smallPosterUrl: string; // New optimized field for grid view
  logoUrl?: string; // New field for clear logo (PNG)
  genre: string[];
  duration: string;
  rating: string;
  year: number;
  match: number;
  mediaType: 'movie' | 'tv';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface RowProps {
  title: string;
  movies: Movie[];
  onMovieSelect: (movie: Movie) => void;
  isLargeRow?: boolean;
}

export interface WebAppUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

// Telegram WebApp Types
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          query_id?: string;
          user?: WebAppUser;
          auth_date?: string;
          hash?: string;
        };
        version: string;
        // Fix: Added platform property to Telegram WebApp interface to resolve TS errors in Navbar
        platform: string;
        isVersionAtLeast: (version: string) => boolean;
        ready: () => void;
        expand: () => void;
        close: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
        };
      };
    };
  }
}
