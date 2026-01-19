
import { Movie } from '../types';

const API_KEY = '4dac8d33b5f9ef7b7c69d94b3f9cd56b';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';
// Змінено з w500 на w780 для кращої якості на Retina/OLED дисплеях мобільних телефонів
const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w780';

// Keep requests object for legacy or specific calls if needed
const requests = {
  fetchTopRated: `/movie/top_rated?api_key=${API_KEY}&language=en-US`,
};

const genreMap: { [key: number]: string } = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10765: 'Sci-Fi & Fantasy'
};

const mapResultToMovie = (result: any): Movie => {
  // Determine if it is TV or Movie based on media_type field or presence of 'name' vs 'title'
  const isTv = result.media_type === 'tv' || !!result.name;

  return {
    id: result.id.toString(),
    title: result.title || result.name || result.original_name,
    description: result.overview,
    bannerUrl: result.backdrop_path ? `${IMAGE_BASE_URL}${result.backdrop_path}` : '',
    posterUrl: result.poster_path ? `${POSTER_BASE_URL}${result.poster_path}` : '',
    genre: result.genre_ids ? result.genre_ids.map((id: number) => genreMap[id] || 'General') : ['General'],
    duration: 'N/A',
    rating: result.vote_average ? result.vote_average.toFixed(1) : 'NR',
    year: parseInt((result.release_date || result.first_air_date || '2024').substring(0, 4)),
    match: result.vote_average ? Math.round(result.vote_average * 10) : 0,
    mediaType: isTv ? 'tv' : 'movie',
  };
};

// Generic fetch
export const fetchMovies = async (url: string): Promise<Movie[]> => {
  try {
    const request = await fetch(`${BASE_URL}${url}`);
    const data = await request.json();
    return data.results.filter((m: any) => m.backdrop_path || m.poster_path).map(mapResultToMovie);
  } catch (error) {
    console.error("Error fetching movies:", error);
    return [];
  }
};

// Dedicated function for paginated trending movies
export const fetchTrending = async (page: number = 1, language: string = 'en-US'): Promise<Movie[]> => {
  try {
    const url = `${BASE_URL}/trending/all/week?api_key=${API_KEY}&language=${language}&page=${page}`;
    const request = await fetch(url);
    const data = await request.json();
    return data.results
      .filter((m: any) => m.poster_path)
      .map(mapResultToMovie);
  } catch (error) {
    console.error("Error fetching trending:", error);
    return [];
  }
};

// Fetch Movies only
export const fetchDiscoverMovies = async (page: number = 1, language: string = 'en-US'): Promise<Movie[]> => {
    try {
      const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=${language}&sort_by=popularity.desc&page=${page}`;
      const request = await fetch(url);
      const data = await request.json();
      return data.results.filter((m: any) => m.poster_path).map((m: any) => ({...mapResultToMovie(m), mediaType: 'movie'}));
    } catch (error) {
      return [];
    }
};

// Fetch TV Shows only
export const fetchDiscoverTV = async (page: number = 1, language: string = 'en-US'): Promise<Movie[]> => {
    try {
      const url = `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=${language}&sort_by=popularity.desc&page=${page}`;
      const request = await fetch(url);
      const data = await request.json();
      return data.results.filter((m: any) => m.poster_path).map((m: any) => ({...mapResultToMovie(m), mediaType: 'tv'}));
    } catch (error) {
      return [];
    }
};

// Fetch Cartoons (Animation Genre ID = 16)
export const fetchDiscoverCartoons = async (page: number = 1, language: string = 'en-US'): Promise<Movie[]> => {
    try {
      const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=${language}&with_genres=16&sort_by=popularity.desc&page=${page}`;
      const request = await fetch(url);
      const data = await request.json();
      return data.results.filter((m: any) => m.poster_path).map((m: any) => ({...mapResultToMovie(m), mediaType: 'movie'}));
    } catch (error) {
      return [];
    }
};

export const searchContent = async (query: string, language: string = 'en-US'): Promise<Movie[]> => {
    if (!query) return [];
    try {
        const url = `${BASE_URL}/search/multi?api_key=${API_KEY}&language=${language}&query=${encodeURIComponent(query)}&page=1&include_adult=false`;
        const request = await fetch(url);
        const data = await request.json();
        return data.results
            .filter((m: any) => m.media_type !== 'person' && (m.poster_path || m.backdrop_path))
            .map(mapResultToMovie);
    } catch (error) {
        console.error("Error searching content:", error);
        return [];
    }
}

export const fetchMovieLogo = async (movieId: string, isTv: boolean): Promise<string | undefined> => {
  try {
    const endpoint = isTv ? 'tv' : 'movie';
    const request = await fetch(`${BASE_URL}/${endpoint}/${movieId}/images?api_key=${API_KEY}`);
    
    if (!request.ok) return undefined;

    const data = await request.json();
    const logo = data.logos?.find((l: any) => l.iso_639_1 === 'en' || l.iso_639_1 === null);
    
    if (logo) {
      return `${IMAGE_BASE_URL}${logo.file_path}`;
    }
    return undefined;
  } catch (error) {
    return undefined;
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
  fetchMovieLogo
};
