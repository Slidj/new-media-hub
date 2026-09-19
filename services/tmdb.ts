// Update: TMDB Service - High Availability Dual-Domain with Cache & Graceful Fallback
import { Movie, Cast, Video } from '../types';
import { MOVIES } from '../constants';
import { getHeroQuality, getRowQuality } from '../utils/settings';

export const API_KEY = '4dac8d33b5f9ef7b7c69d94b3f9cd56b';
export const TMDB_PRIMARY_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_BACKUP_BASE_URL = 'https://api.tmdb.org/3';
export const BASE_URL = TMDB_PRIMARY_BASE_URL;

// Dynamic Image URLs based on settings
const getBannerBaseUrl = () => {
    const q = getHeroQuality();
    if (q === 'high') return 'https://image.tmdb.org/t/p/original';
    if (q === 'low') return 'https://image.tmdb.org/t/p/w300';
    return 'https://image.tmdb.org/t/p/w780';
};

const getPosterBaseUrl = () => {
    const q = getHeroQuality();
    if (q === 'high') return 'https://image.tmdb.org/t/p/w780';
    if (q === 'low') return 'https://image.tmdb.org/t/p/w342';
    return 'https://image.tmdb.org/t/p/w500';
};

const getSmallPosterBaseUrl = () => {
    const q = getRowQuality();
    if (q === 'high') return 'https://image.tmdb.org/t/p/w342';
    if (q === 'low') return 'https://image.tmdb.org/t/p/w92';
    return 'https://image.tmdb.org/t/p/w185';
};

const PROFILE_BASE_URL = 'https://image.tmdb.org/t/p/w185';

// High-performance in-memory and sessionStorage cache
const memoryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 6 * 60 * 1000; // 6 minutes

/**
 * Robust fetch helper that:
 * 1. Checks memory & sessionStorage cache
 * 2. Tries primary TMDB domain (api.themoviedb.org)
 * 3. Automatically fails over to backup TMDB domain (api.tmdb.org) on network/DNS/adblocker failure
 * 4. Implements request timeout via AbortController
 * 5. Returns stale cached data if offline/completely blocked
 */
export const fetchTMDBJson = async (
  endpointOrUrl: string,
  options: { timeoutMs?: number; skipCache?: boolean } = {}
): Promise<any | null> => {
  // Normalize endpoint to relative path starting with /
  let endpoint = endpointOrUrl;
  if (endpoint.startsWith('https://api.themoviedb.org/3')) {
    endpoint = endpoint.replace('https://api.themoviedb.org/3', '');
  } else if (endpoint.startsWith('https://api.tmdb.org/3')) {
    endpoint = endpoint.replace('https://api.tmdb.org/3', '');
  } else if (endpoint.startsWith('http')) {
    // If external URL, extract pathname + search
    try {
      const u = new URL(endpoint);
      endpoint = u.pathname.replace(/^\/3/, '') + u.search;
    } catch {}
  }

  if (!endpoint.startsWith('/')) {
    endpoint = `/${endpoint}`;
  }

  const cacheKey = `tmdb_cache_v2_${endpoint}`;

  // 1. Check in-memory cache
  if (!options.skipCache) {
    const memItem = memoryCache.get(cacheKey);
    if (memItem && (Date.now() - memItem.timestamp < CACHE_TTL_MS)) {
      return memItem.data;
    }

    // 2. Check sessionStorage
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const stored = window.sessionStorage.getItem(cacheKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (Date.now() - parsed.timestamp < CACHE_TTL_MS * 3)) {
            memoryCache.set(cacheKey, parsed);
            return parsed.data;
          }
        }
      }
    } catch {}
  }

  const domains = [TMDB_PRIMARY_BASE_URL, TMDB_BACKUP_BASE_URL];
  const timeoutMs = options.timeoutMs || 7000;

  for (let d = 0; d < domains.length; d++) {
    const domain = domains[d];
    const targetUrl = `${domain}${endpoint}`;

    for (let attempt = 0; attempt < 2; attempt++) {
      let timeoutId: any = null;
      try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(targetUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const entry = { data, timestamp: Date.now() };
          memoryCache.set(cacheKey, entry);
          try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
              window.sessionStorage.setItem(cacheKey, JSON.stringify(entry));
            }
          } catch {}
          return data;
        }

        if (response.status === 404) {
          return null;
        }

        // If 429 or 5xx, wait briefly and retry or try alternate domain
        if (attempt === 0) {
          await new Promise(r => setTimeout(r, 250));
        }
      } catch (networkError) {
        if (timeoutId) clearTimeout(timeoutId);
        // Failover to next attempt or backup domain
        if (attempt === 0) {
          await new Promise(r => setTimeout(r, 200));
        }
      }
    }
  }

  // Graceful fallback to expired cache if network is completely down
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const stale = window.sessionStorage.getItem(cacheKey);
      if (stale) {
        const parsed = JSON.parse(stale);
        if (parsed?.data) return parsed.data;
      }
    }
  } catch {}

  return null;
};

// Multilingual Genre Map
export const genreMap: Record<string, Record<number, string>> = {
  'en-US': {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
    10759: 'Action & Adventure', 10765: 'Sci-Fi & Fantasy'
  },
  'uk-UA': {
    28: 'Бойовик', 12: 'Пригоди', 16: 'Мультфільм', 35: 'Комедія', 80: 'Кримінал',
    99: 'Документальний', 18: 'Драма', 10751: 'Сімейний', 14: 'Фентезі', 36: 'Історичний',
    27: 'Жахи', 10402: 'Музика', 9648: 'Містика', 10749: 'Мелодрама', 878: 'Фантастика',
    10770: 'ТБ Фільм', 53: 'Трилер', 10752: 'Військовий', 37: 'Вестерн',
    10759: 'Екшн і Пригоди', 10765: 'Фантастика і Фентезі'
  },
  'ru-RU': {
    28: 'Боевик', 12: 'Приключения', 16: 'Мультфильм', 35: 'Комедия', 80: 'Криминал',
    99: 'Документальный', 18: 'Драма', 10751: 'Семейный', 14: 'Фэнтези', 36: 'История',
    27: 'Ужасы', 10402: 'Музыка', 9648: 'Мистика', 10749: 'Мелодрама', 878: 'Фантастика',
    10770: 'ТВ Фильм', 53: 'Триллер', 10752: 'Военный', 37: 'Вестерн',
    10759: 'Экшн и Приключения', 10765: 'Фантастика и Фэнтези'
  }
};

export const mapResultToMovie = (result: any, language: string = 'en-US'): Movie => {
  const isTv = result.media_type === 'tv' || !!result.name;
  const currentGenreMap = genreMap[language] || genreMap['en-US'];

  return {
    id: result.id.toString(),
    title: result.title || result.name || result.original_name || 'Untitled',
    description: result.overview || '',
    bannerUrl: result.backdrop_path ? `${getBannerBaseUrl()}${result.backdrop_path}` : '',
    posterUrl: result.poster_path ? `${getPosterBaseUrl()}${result.poster_path}` : '',
    smallPosterUrl: result.poster_path ? `${getSmallPosterBaseUrl()}${result.poster_path}` : '',
    genre: result.genre_ids ? result.genre_ids.map((id: number) => currentGenreMap[id] || 'General') : ['General'],
    genreIds: result.genre_ids || [],
    duration: 'N/A',
    rating: result.vote_average ? result.vote_average.toFixed(1) : 'NR',
    year: parseInt((result.release_date || result.first_air_date || '2024').substring(0, 4)),
    releaseDate: result.release_date || result.first_air_date,
    match: result.vote_average ? Math.round(result.vote_average * 10) : 0,
    mediaType: isTv ? 'tv' : 'movie',
  };
};

// Generic fetch
export const fetchMovies = async (url: string, language: string = 'en-US'): Promise<Movie[]> => {
  try {
    const data = await fetchTMDBJson(url);
    if (data?.results && Array.isArray(data.results)) {
      return data.results
        .filter((m: any) => m.backdrop_path || m.poster_path)
        .map((m: any) => mapResultToMovie(m, language));
    }
    return MOVIES;
  } catch (error) {
    console.warn("fetchMovies fallback handled:", error);
    return MOVIES;
  }
};

// Dedicated function for paginated trending movies
export const fetchTrending = async (page: number = 1, language: string = 'en-US'): Promise<Movie[]> => {
  try {
    const endpoint = `/trending/all/week?api_key=${API_KEY}&language=${language}&page=${page}`;
    const data = await fetchTMDBJson(endpoint);
    if (data?.results && Array.isArray(data.results)) {
      return data.results
        .filter((m: any) => m.poster_path)
        .map((m: any) => mapResultToMovie(m, language));
    }
    return page === 1 ? MOVIES : [];
  } catch (error) {
    console.warn("fetchTrending fallback handled:", error);
    return page === 1 ? MOVIES : [];
  }
};

// Fetch Upcoming (Smart Netflix-Style Hype List)
export const fetchUpcoming = async (page: number = 1, language: string = 'en-US'): Promise<Movie[]> => {
  try {
    const todayDate = new Date();
    const offset = todayDate.getTimezoneOffset();
    const localDate = new Date(todayDate.getTime() - (offset * 60 * 1000));
    const todayStr = localDate.toISOString().split('T')[0];
    
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6);
    const futureStr = futureDate.toISOString().split('T')[0];

    const moviesUrl = `/discover/movie?api_key=${API_KEY}&language=${language}&page=${page}&region=US&primary_release_date.gte=${todayStr}&primary_release_date.lte=${futureStr}&sort_by=popularity.desc&popularity.gte=10&with_release_type=2|3&include_adult=false&include_video=false`;
    const tvUrl = `/discover/tv?api_key=${API_KEY}&language=${language}&page=${page}&first_air_date.gte=${todayStr}&first_air_date.lte=${futureStr}&sort_by=popularity.desc&popularity.gte=10&include_null_first_air_dates=false&include_adult=false`;

    const [moviesData, tvData] = await Promise.all([
      fetchTMDBJson(moviesUrl),
      fetchTMDBJson(tvUrl)
    ]);

    let results: Movie[] = [];

    if (moviesData?.results) {
      const movies = moviesData.results
        .filter((m: any) => m.backdrop_path && m.release_date >= todayStr)
        .map((m: any) => ({ ...mapResultToMovie(m, language), mediaType: 'movie' as const }));
      results = [...results, ...movies];
    }

    if (tvData?.results) {
      const shows = tvData.results
        .filter((m: any) => m.backdrop_path && m.first_air_date >= todayStr)
        .map((m: any) => ({ ...mapResultToMovie(m, language), mediaType: 'tv' as const }));
      results = [...results, ...shows];
    }
    
    return results;
  } catch (error) {
    console.warn("fetchUpcoming fallback handled:", error);
    return [];
  }
};

// Fetch Movies only
export const fetchDiscoverMovies = async (page: number = 1, language: string = 'en-US'): Promise<Movie[]> => {
  try {
    const endpoint = `/discover/movie?api_key=${API_KEY}&language=${language}&sort_by=popularity.desc&page=${page}`;
    const data = await fetchTMDBJson(endpoint);
    if (data?.results && Array.isArray(data.results)) {
      return data.results
        .filter((m: any) => m.poster_path)
        .map((m: any) => ({ ...mapResultToMovie(m, language), mediaType: 'movie' as const }));
    }
    return page === 1 ? MOVIES.filter(m => m.mediaType === 'movie') : [];
  } catch (error) {
    console.warn("fetchDiscoverMovies fallback handled:", error);
    return page === 1 ? MOVIES.filter(m => m.mediaType === 'movie') : [];
  }
};

// Fetch TV Shows only
export const fetchDiscoverTV = async (page: number = 1, language: string = 'en-US'): Promise<Movie[]> => {
  try {
    const endpoint = `/discover/tv?api_key=${API_KEY}&language=${language}&sort_by=popularity.desc&page=${page}`;
    const data = await fetchTMDBJson(endpoint);
    if (data?.results && Array.isArray(data.results)) {
      return data.results
        .filter((m: any) => m.poster_path)
        .map((m: any) => ({ ...mapResultToMovie(m, language), mediaType: 'tv' as const }));
    }
    return page === 1 ? MOVIES.filter(m => m.mediaType === 'tv') : [];
  } catch (error) {
    console.warn("fetchDiscoverTV fallback handled:", error);
    return page === 1 ? MOVIES.filter(m => m.mediaType === 'tv') : [];
  }
};

// Fetch Cartoons (Animation Genre ID = 16) - Supports both animated movies and animated TV series
export const fetchDiscoverCartoons = async (page: number = 1, language: string = 'en-US'): Promise<Movie[]> => {
  try {
    const [moviesData, tvData] = await Promise.all([
      fetchTMDBJson(`/discover/movie?api_key=${API_KEY}&language=${language}&with_genres=16&sort_by=popularity.desc&page=${page}`),
      fetchTMDBJson(`/discover/tv?api_key=${API_KEY}&language=${language}&with_genres=16&sort_by=popularity.desc&page=${page}`)
    ]);

    const movies: Movie[] = (moviesData?.results || [])
      .filter((m: any) => m.poster_path)
      .map((m: any) => ({ ...mapResultToMovie(m, language), mediaType: 'movie' as const }));

    const tvShows: Movie[] = (tvData?.results || [])
      .filter((m: any) => m.poster_path)
      .map((m: any) => ({ ...mapResultToMovie(m, language), mediaType: 'tv' as const }));

    const combined = [...movies, ...tvShows].sort((a, b) => (b.match || 0) - (a.match || 0));
    return combined.length > 0 ? combined : (page === 1 ? MOVIES : []);
  } catch (error) {
    console.warn("fetchDiscoverCartoons fallback handled:", error);
    return page === 1 ? MOVIES : [];
  }
};

export const searchContent = async (query: string, language: string = 'en-US'): Promise<Movie[]> => {
  if (!query) return [];
  try {
    const endpoint = `/search/multi?api_key=${API_KEY}&language=${language}&query=${encodeURIComponent(query)}&page=1&include_adult=false`;
    const data = await fetchTMDBJson(endpoint);
    if (data?.results && Array.isArray(data.results)) {
      return data.results
        .filter((m: any) => m.media_type !== 'person' && (m.poster_path || m.backdrop_path))
        .map((m: any) => mapResultToMovie(m, language));
    }
    return MOVIES.filter(m => m.title.toLowerCase().includes(query.toLowerCase()));
  } catch (error) {
    console.warn("searchContent fallback handled:", error);
    return MOVIES.filter(m => m.title.toLowerCase().includes(query.toLowerCase()));
  }
};

export const fetchMovieLogo = async (movieId: string, isTv: boolean): Promise<string | undefined> => {
  try {
    const endpoint = isTv ? 'tv' : 'movie';
    const data = await fetchTMDBJson(`/${endpoint}/${movieId}/images?api_key=${API_KEY}`);
    if (!data) return undefined;

    const logo = data.logos?.find((l: any) => l.iso_639_1 === 'en' || l.iso_639_1 === null) || data.logos?.[0];
    if (logo) {
      return `${getBannerBaseUrl()}${logo.file_path}`;
    }
    return undefined;
  } catch {
    return undefined;
  }
};

export const fetchCleanImages = async (movieId: string, mediaType: 'movie' | 'tv'): Promise<{ poster?: string; banner?: string }> => {
  try {
    const endpoint = mediaType === 'tv' ? 'tv' : 'movie';
    const data = await fetchTMDBJson(`/${endpoint}/${movieId}/images?api_key=${API_KEY}&include_image_language=null,en`);
    if (!data) return {};

    const cleanPosterObj = data.posters?.find((p: any) => p.iso_639_1 === null) || 
                           data.posters?.find((p: any) => p.iso_639_1 === 'en') || 
                           data.posters?.[0];

    const cleanBannerObj = data.backdrops?.find((b: any) => b.iso_639_1 === null) || 
                           data.backdrops?.find((b: any) => b.iso_639_1 === 'en') || 
                           data.backdrops?.[0];

    return {
      poster: cleanPosterObj ? `${getPosterBaseUrl()}${cleanPosterObj.file_path}` : undefined,
      banner: cleanBannerObj ? `${getBannerBaseUrl()}${cleanBannerObj.file_path}` : undefined
    };
  } catch {
    return {};
  }
};

export const fetchMovieById = async (movieId: string, mediaType: 'movie' | 'tv' = 'movie', language: string = 'en-US'): Promise<Movie | null> => {
  if (!movieId || movieId === 'undefined' || movieId === 'null') {
    return null;
  }

  const cleanId = movieId.toString().trim();
  if (!cleanId) return null;

  const tmdbLang = language === 'uk' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : language;

  const tryFetch = async (type: 'movie' | 'tv') => {
    const endpoint = `/${type}/${cleanId}?api_key=${API_KEY}&language=${tmdbLang}`;
    const data = await fetchTMDBJson(endpoint);
    if (data) {
      if (data.genres && !data.genre_ids) {
        data.genre_ids = data.genres.map((g: any) => g.id);
      }
      const movie = mapResultToMovie(data, language);
      movie.mediaType = type;
      return movie;
    }
    return null;
  };

  try {
    // 1. Try with requested mediaType
    let result = await tryFetch(mediaType);
    if (result) return result;

    // 2. Fallback to alternative mediaType
    const altType = mediaType === 'tv' ? 'movie' : 'tv';
    result = await tryFetch(altType);
    if (result) return result;

    return null;
  } catch {
    return null;
  }
};

export const fetchMovieDetails = async (movieId: string, mediaType: 'movie' | 'tv', language: string = 'en-US'): Promise<{ duration: string | null, tagline: string | null, title: string | null }> => {
  if (!movieId) return { duration: null, tagline: null, title: null };
  try {
    const endpoint = mediaType === 'tv' ? 'tv' : 'movie';
    const data = await fetchTMDBJson(`/${endpoint}/${movieId}?api_key=${API_KEY}&language=${language}`);
    if (!data) return { duration: null, tagline: null, title: null };

    let durationStr = null;

    if (mediaType === 'movie') {
      const runtime = data.runtime;
      if (runtime) {
        const h = Math.floor(runtime / 60);
        const m = runtime % 60;
        durationStr = `${h}h ${m}m`;
      }
    } else {
      const seasons = data.number_of_seasons;
      if (seasons) {
        durationStr = `${seasons} Season${seasons !== 1 ? 's' : ''}`;
      }
    }

    return {
      duration: durationStr,
      tagline: data.tagline || null,
      title: data.title || data.name || null
    };
  } catch {
    return { duration: null, tagline: null, title: null };
  }
};

export const fetchCredits = async (movieId: string, mediaType: 'movie' | 'tv'): Promise<Cast[]> => {
  try {
    const endpoint = mediaType === 'tv' ? 'tv' : 'movie';
    const data = await fetchTMDBJson(`/${endpoint}/${movieId}/credits?api_key=${API_KEY}`);
    if (!data?.cast) return [];

    return data.cast
      .filter((p: any) => p.profile_path)
      .slice(0, 15)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        character: p.character,
        profilePath: `${PROFILE_BASE_URL}${p.profile_path}`
      }));
  } catch {
    return [];
  }
};

export const fetchVideos = async (movieId: string, mediaType: 'movie' | 'tv'): Promise<Video[]> => {
  try {
    const endpoint = mediaType === 'tv' ? 'tv' : 'movie';
    const data = await fetchTMDBJson(`/${endpoint}/${movieId}/videos?api_key=${API_KEY}`);
    if (!data?.results) return [];

    return data.results
      .filter((v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
      .map((v: any) => ({
        id: v.id,
        key: v.key,
        name: v.name,
        site: v.site,
        type: v.type
      }));
  } catch {
    return [];
  }
};

export const fetchRecommendations = async (movieId: string, mediaType: 'movie' | 'tv', language: string = 'en-US'): Promise<Movie[]> => {
  try {
    const endpoint = mediaType === 'tv' ? 'tv' : 'movie';
    const data = await fetchTMDBJson(`/${endpoint}/${movieId}/recommendations?api_key=${API_KEY}&language=${language}&page=1`);
    if (!data?.results) return [];

    return data.results
      .filter((m: any) => m.poster_path)
      .slice(0, 12)
      .map((m: any) => mapResultToMovie(m, language));
  } catch {
    return [];
  }
};

export const fetchMovieDuration = async (movieId: string, mediaType: 'movie' | 'tv'): Promise<string | null> => {
  const details = await fetchMovieDetails(movieId, mediaType);
  return details.duration;
};

export const fetchExternalIds = async (
  id: string, 
  type?: 'movie' | 'tv', 
  title?: string, 
  year?: number
): Promise<{ imdb_id?: string | null; id?: number; mediaType?: 'movie' | 'tv' } | null> => {
  if (!id && !title) return null;

  const cleanId = id?.toString().trim();
  const isRealNumericId = cleanId && /^\d+$/.test(cleanId) && parseInt(cleanId, 10) > 10;

  const tryEndpoint = async (endpointType: 'movie' | 'tv') => {
    try {
      const data = await fetchTMDBJson(`/${endpointType}/${cleanId}/external_ids?api_key=${API_KEY}`);
      if (data?.imdb_id) {
        return { ...data, mediaType: endpointType };
      }
      return null;
    } catch {
      return null;
    }
  };

  // 1. Try primary requested mediaType
  if (isRealNumericId) {
    const primaryType = type === 'tv' ? 'tv' : 'movie';
    const res1 = await tryEndpoint(primaryType);
    if (res1?.imdb_id) return res1;

    // 2. Try alternate mediaType (movie vs tv)
    const altType = primaryType === 'tv' ? 'movie' : 'tv';
    const res2 = await tryEndpoint(altType);
    if (res2?.imdb_id) return res2;

    // 3. Check direct movie details (TMDB has imdb_id directly in movie details)
    try {
      const details = await fetchTMDBJson(`/movie/${cleanId}?api_key=${API_KEY}`);
      if (details?.imdb_id) {
        return { imdb_id: details.imdb_id, id: details.id, mediaType: 'movie' };
      }
    } catch {}
  }

  // 4. Robust fallback: search by title (and optional year)
  if (title && title.trim().length > 0) {
    try {
      const cleanTitle = title.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim();
      const searchData = await fetchTMDBJson(`/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(cleanTitle)}&include_adult=false&page=1`);
      if (searchData?.results) {
        const candidates = (searchData.results || [])
          .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv');

        for (const candidate of candidates.slice(0, 5)) {
          if (cleanId && candidate.id.toString() === cleanId) continue;
          const candType = candidate.media_type as 'movie' | 'tv';
          const extData = await fetchTMDBJson(`/${candType}/${candidate.id}/external_ids?api_key=${API_KEY}`);
          if (extData?.imdb_id) {
            return { ...extData, mediaType: candType };
          }
        }
      }
    } catch {}
  }

  return null;
};

export const API = {
  requests: {
    fetchTopRated: `/movie/top_rated?api_key=${API_KEY}&language=en-US`,
  },
  fetchTMDBJson,
  fetchMovies,
  fetchTrending,
  fetchDiscoverMovies,
  fetchDiscoverTV,
  fetchDiscoverCartoons,
  fetchUpcoming,
  searchContent,
  fetchMovieLogo,
  fetchCleanImages,
  fetchExternalIds,
  fetchMovieDuration,
  fetchMovieDetails,
  fetchMovieById,
  fetchCredits,
  fetchVideos,
  fetchRecommendations
};
