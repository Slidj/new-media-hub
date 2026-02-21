
// Update: TMDB Service - Added fetchUpcoming
import { Movie, Cast, Video } from '../types';
import { MOVIES } from '../constants';

const API_KEY = '4dac8d33b5f9ef7b7c69d94b3f9cd56b';
const BASE_URL = 'https://api.themoviedb.org/3';

// OPTIMIZATION:
// w1280 is much lighter than 'original' but looks great on phones for banners
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w1280'; 
// w780 is good for high-res details view
const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w780';
// w342 is perfect for the 3-column grid (much faster scroll)
const SMALL_POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w342';
// w185 for cast profiles
const PROFILE_BASE_URL = 'https://image.tmdb.org/t/p/w185';

// Keep requests object for legacy or specific calls if needed
const requests = {
  fetchTopRated: `/movie/top_rated?api_key=${API_KEY}&language=en-US`,
};

// Multilingual Genre Map
const genreMap: Record<string, Record<number, string>> = {
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

const mapResultToMovie = (result: any, language: string = 'en-US'): Movie => {
  // Determine if it is TV or Movie based on media_type field or presence of 'name' vs 'title'
  const isTv = result.media_type === 'tv' || !!result.name;
  
  // Use correct genre map based on locale, fallback to English if not found
  const currentGenreMap = genreMap[language] || genreMap['en-US'];

  return {
    id: result.id.toString(),
    title: result.title || result.name || result.original_name,
    description: result.overview,
    bannerUrl: result.backdrop_path ? `${IMAGE_BASE_URL}${result.backdrop_path}` : '',
    posterUrl: result.poster_path ? `${POSTER_BASE_URL}${result.poster_path}` : '',
    smallPosterUrl: result.poster_path ? `${SMALL_POSTER_BASE_URL}${result.poster_path}` : '',
    genre: result.genre_ids ? result.genre_ids.map((id: number) => currentGenreMap[id] || 'General') : ['General'],
    duration: 'N/A', // Placeholder, will be fetched in Modal
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
    const request = await fetch(`${BASE_URL}${url}`);
    if (!request.ok) throw new Error(request.statusText);
    const data = await request.json();
    return data.results
        .filter((m: any) => m.backdrop_path || m.poster_path)
        .map((m: any) => mapResultToMovie(m, language));
  } catch (error) {
    console.error("Error fetching movies:", error);
    return MOVIES;
  }
};

// Dedicated function for paginated trending movies
export const fetchTrending = async (page: number = 1, language: string = 'en-US'): Promise<Movie[]> => {
  try {
    const url = `${BASE_URL}/trending/all/week?api_key=${API_KEY}&language=${language}&page=${page}`;
    const request = await fetch(url);
    if (!request.ok) throw new Error(`HTTP Error: ${request.status}`);
    const data = await request.json();
    return data.results
      .filter((m: any) => m.poster_path)
      .map((m: any) => mapResultToMovie(m, language));
  } catch (error) {
    console.error("Error fetching trending:", error);
    return page === 1 ? MOVIES : [];
  }
};

// REPLACED: Fetch Upcoming (Smart Netflix-Style Hype List)
export const fetchUpcoming = async (page: number = 1, language: string = 'en-US'): Promise<Movie[]> => {
  try {
    // FIX: Use LOCAL time to get the correct "today" date string, not UTC.
    // This prevents "yesterday" issues in timezones ahead of UTC (like Ukraine).
    const todayDate = new Date();
    const offset = todayDate.getTimezoneOffset();
    const localDate = new Date(todayDate.getTime() - (offset*60*1000));
    const todayStr = localDate.toISOString().split('T')[0];
    
    // Look ahead 6 months to find the REAL hits
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6);
    const futureStr = futureDate.toISOString().split('T')[0];
    
    // STRATEGY CHANGE:
    // Instead of sorting by date (which gives us low-budget trash released tomorrow),
    // we sort by POPULARITY.DESC within the future date range.
    // This gives us the MOST ANTICIPATED movies/shows.
    // The UI component then sorts these "Hits" by date to create the timeline.

    // 1. Fetch Popular Upcoming Movies
    // popularity.gte=10 ensures some level of global awareness
    // region=US ensures dates are consistent with global theatrical releases
    const moviesUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=${language}&page=${page}&region=US&primary_release_date.gte=${todayStr}&primary_release_date.lte=${futureStr}&sort_by=popularity.desc&popularity.gte=10&with_release_type=2|3&include_adult=false&include_video=false`;

    // 2. Fetch Popular Upcoming TV Shows
    // Just looking for new seasons/shows airing soon
    const tvUrl = `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=${language}&page=${page}&first_air_date.gte=${todayStr}&first_air_date.lte=${futureStr}&sort_by=popularity.desc&popularity.gte=10&include_null_first_air_dates=false&include_adult=false`;

    // Run in parallel
    const [moviesRes, tvRes] = await Promise.all([
        fetch(moviesUrl),
        fetch(tvUrl)
    ]);

    let results: any[] = [];

    if (moviesRes.ok) {
        const data = await moviesRes.json();
        const movies = data.results
             // Double check dates to ensure they are in future (API strictness varies)
            .filter((m: any) => m.backdrop_path && m.release_date >= todayStr)
            .map((m: any) => ({...mapResultToMovie(m, language), mediaType: 'movie'}));
        results = [...results, ...movies];
    }

    if (tvRes.ok) {
        const data = await tvRes.json();
        const shows = data.results
            .filter((m: any) => m.backdrop_path && m.first_air_date >= todayStr)
            .map((m: any) => ({...mapResultToMovie(m, language), mediaType: 'tv'}));
        results = [...results, ...shows];
    }
    
    // We return the mixed bag of Popular Future content.
    // The ComingSoonView component handles the sorting by Date.
    return results;

  } catch (error) {
    console.error("Error fetching upcoming:", error);
    return [];
  }
};

// Fetch Movies only
export const fetchDiscoverMovies = async (page: number = 1, language: string = 'en-US'): Promise<Movie[]> => {
    try {
      const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=${language}&sort_by=popularity.desc&page=${page}`;
      const request = await fetch(url);
      if (!request.ok) throw new Error(`HTTP Error: ${request.status}`);
      const data = await request.json();
      return data.results
        .filter((m: any) => m.poster_path)
        .map((m: any) => ({...mapResultToMovie(m, language), mediaType: 'movie'}));
    } catch (error) {
      console.error("Error fetching discover movies:", error);
      return page === 1 ? MOVIES.filter(m => m.mediaType === 'movie') : [];
    }
};

// Fetch TV Shows only
export const fetchDiscoverTV = async (page: number = 1, language: string = 'en-US'): Promise<Movie[]> => {
    try {
      const url = `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=${language}&sort_by=popularity.desc&page=${page}`;
      const request = await fetch(url);
      if (!request.ok) throw new Error(`HTTP Error: ${request.status}`);
      const data = await request.json();
      return data.results
        .filter((m: any) => m.poster_path)
        .map((m: any) => ({...mapResultToMovie(m, language), mediaType: 'tv'}));
    } catch (error) {
      console.error("Error fetching discover TV:", error);
      return page === 1 ? MOVIES.filter(m => m.mediaType === 'tv') : [];
    }
};

// Fetch Cartoons (Animation Genre ID = 16)
export const fetchDiscoverCartoons = async (page: number = 1, language: string = 'en-US'): Promise<Movie[]> => {
    try {
      const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=${language}&with_genres=16&sort_by=popularity.desc&page=${page}`;
      const request = await fetch(url);
      if (!request.ok) throw new Error(`HTTP Error: ${request.status}`);
      const data = await request.json();
      return data.results
        .filter((m: any) => m.poster_path)
        .map((m: any) => ({...mapResultToMovie(m, language), mediaType: 'movie'}));
    } catch (error) {
      console.error("Error fetching cartoons:", error);
      return page === 1 ? MOVIES : [];
    }
};

export const searchContent = async (query: string, language: string = 'en-US'): Promise<Movie[]> => {
    if (!query) return [];
    try {
        const url = `${BASE_URL}/search/multi?api_key=${API_KEY}&language=${language}&query=${encodeURIComponent(query)}&page=1&include_adult=false`;
        const request = await fetch(url);
        if (!request.ok) throw new Error(`HTTP Error: ${request.status}`);
        const data = await request.json();
        return data.results
            .filter((m: any) => m.media_type !== 'person' && (m.poster_path || m.backdrop_path))
            .map((m: any) => mapResultToMovie(m, language));
    } catch (error) {
        console.error("Error searching content:", error);
        return MOVIES.filter(m => m.title.toLowerCase().includes(query.toLowerCase()));
    }
}

export const fetchMovieLogo = async (movieId: string, isTv: boolean): Promise<string | undefined> => {
  try {
    const endpoint = isTv ? 'tv' : 'movie';
    const request = await fetch(`${BASE_URL}/${endpoint}/${movieId}/images?api_key=${API_KEY}`);
    
    if (!request.ok) return undefined;

    const data = await request.json();
    const logo = data.logos?.find((l: any) => l.iso_639_1 === 'en' || l.iso_639_1 === null) || data.logos?.[0];
    
    if (logo) {
      return `${IMAGE_BASE_URL}${logo.file_path}`;
    }
    return undefined;
  } catch (error) {
    return undefined;
  }
};

export const fetchCleanImages = async (movieId: string, mediaType: 'movie' | 'tv'): Promise<{ poster?: string; banner?: string }> => {
    try {
        const endpoint = mediaType === 'tv' ? 'tv' : 'movie';
        // We include 'null' (standard for textless) and 'en' as fallback
        const request = await fetch(`${BASE_URL}/${endpoint}/${movieId}/images?api_key=${API_KEY}&include_image_language=null,en`);
        
        if (!request.ok) return {};

        const data = await request.json();
        
        // Priority: Strictly textless (iso_639_1 === null) -> English (en) -> First available
        const cleanPosterObj = data.posters?.find((p: any) => p.iso_639_1 === null) || 
                               data.posters?.find((p: any) => p.iso_639_1 === 'en') || 
                               data.posters?.[0];

        const cleanBannerObj = data.backdrops?.find((b: any) => b.iso_639_1 === null) || 
                               data.backdrops?.find((b: any) => b.iso_639_1 === 'en') || 
                               data.backdrops?.[0];

        return {
            poster: cleanPosterObj ? `${POSTER_BASE_URL}${cleanPosterObj.file_path}` : undefined,
            banner: cleanBannerObj ? `${IMAGE_BASE_URL}${cleanBannerObj.file_path}` : undefined
        };
    } catch (error) {
        console.error("Error fetching clean images:", error);
        return {};
    }
};

export const fetchMovieDetails = async (movieId: string, mediaType: 'movie' | 'tv'): Promise<{ duration: string | null, tagline: string | null }> => {
  try {
    const endpoint = mediaType === 'tv' ? 'tv' : 'movie';
    const request = await fetch(`${BASE_URL}/${endpoint}/${movieId}?api_key=${API_KEY}`);
    
    if (!request.ok) return { duration: null, tagline: null };
    const data = await request.json();

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
        tagline: data.tagline || null
    };

  } catch (error) {
    console.error("Error fetching details", error);
    return { duration: null, tagline: null };
  }
}

export const fetchCredits = async (movieId: string, mediaType: 'movie' | 'tv'): Promise<Cast[]> => {
    try {
        const endpoint = mediaType === 'tv' ? 'tv' : 'movie';
        const request = await fetch(`${BASE_URL}/${endpoint}/${movieId}/credits?api_key=${API_KEY}`);
        
        if (!request.ok) return [];
        const data = await request.json();

        return data.cast
            .filter((p: any) => p.profile_path)
            .slice(0, 15)
            .map((p: any) => ({
                id: p.id,
                name: p.name,
                character: p.character,
                profilePath: `${PROFILE_BASE_URL}${p.profile_path}`
            }));
    } catch (error) {
        return [];
    }
};

export const fetchVideos = async (movieId: string, mediaType: 'movie' | 'tv'): Promise<Video[]> => {
    try {
        const endpoint = mediaType === 'tv' ? 'tv' : 'movie';
        const request = await fetch(`${BASE_URL}/${endpoint}/${movieId}/videos?api_key=${API_KEY}`);
        
        if (!request.ok) return [];
        const data = await request.json();

        return data.results
            .filter((v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
            .map((v: any) => ({
                id: v.id,
                key: v.key,
                name: v.name,
                site: v.site,
                type: v.type
            }));
    } catch (error) {
        return [];
    }
};

export const fetchRecommendations = async (movieId: string, mediaType: 'movie' | 'tv', language: string = 'en-US'): Promise<Movie[]> => {
    try {
        const endpoint = mediaType === 'tv' ? 'tv' : 'movie';
        const url = `${BASE_URL}/${endpoint}/${movieId}/recommendations?api_key=${API_KEY}&language=${language}&page=1`;
        const request = await fetch(url);
        if (!request.ok) return [];
        const data = await request.json();
        return data.results
            .filter((m: any) => m.poster_path)
            .slice(0, 12)
            .map((m: any) => mapResultToMovie(m, language));
    } catch (error) {
        return [];
    }
};

export const fetchMovieDuration = async (movieId: string, mediaType: 'movie' | 'tv'): Promise<string | null> => {
    const details = await fetchMovieDetails(movieId, mediaType);
    return details.duration;
}

export const fetchExternalIds = async (id: string, type: 'movie' | 'tv'): Promise<any> => {
    try {
        const url = `${BASE_URL}/${type}/${id}/external_ids?api_key=${API_KEY}`;
        const request = await fetch(url);
        if (!request.ok) throw new Error(`HTTP Error: ${request.status}`);
        const data = await request.json();
        return data;
    } catch (error) {
        console.error("Error fetching external IDs:", error);
        return null;
    }
};

export const API = {
  requests,
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
  fetchCredits,
  fetchVideos,
  fetchRecommendations
};
