
import { Movie } from '../types';
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
    duration: 'N/A',
    rating: result.vote_average ? result.vote_average.toFixed(1) : 'NR',
    year: parseInt((result.release_date || result.first_air_date || '2024').substring(0, 4)),
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
    // Return static backup data if API fails so the app isn't empty
    return page === 1 ? MOVIES : [];
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
      // Fallback: just return movies, might not be cartoons but better than nothing
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
        // Basic local search on backup data
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

export const fetchExternalIds = async (id: string, type: 'movie' | 'tv'): Promise<string | null> => {
    try {
        const url = `${BASE_URL}/${type}/${id}/external_ids?api_key=${API_KEY}`;
        const request = await fetch(url);
        if (!request.ok) throw new Error(`HTTP Error: ${request.status}`);
        const data = await request.json();
        return data.imdb_id || null;
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
  searchContent,
  fetchMovieLogo,
  fetchExternalIds
};
