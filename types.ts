// Update: Types for Coming Soon Feature
export interface Movie {
  id: string;
  title: string;
  description: string;
  bannerUrl: string;
  posterUrl: string;
  smallPosterUrl: string; // New optimized field for grid view
  logoUrl?: string; // New field for clear logo (PNG)
  tagline?: string; // Slogan
  genre: string[];
  duration: string;
  rating: string;
  year: number;
  releaseDate?: string; // New field for Coming Soon
  match: number;
  mediaType: 'movie' | 'tv';
}

export interface Cast {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
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

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string; // ISO string
  type: 'system' | 'reminder' | 'admin';
  isRead: boolean;
  movieId?: string;
  posterUrl?: string;
}

export interface WebAppUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  tickets?: number; // New Reward System
}

export type TabType = 'home' | 'search' | 'coming_soon' | 'my_list';

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
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}