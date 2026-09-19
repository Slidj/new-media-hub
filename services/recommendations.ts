import { Movie } from '../types';
import { API_KEY, BASE_URL, mapResultToMovie, genreMap } from './tmdb';

interface UserTasteProfile {
  watchHistory: Movie[];
  likedMovieIds: string[];
  dislikedMovieIds: string[];
  myList: Movie[];
  lang: string;
}

export interface SmartRecommendationsData {
  movies: Movie[];
  primaryGenreName?: string;
  hasPersonalData: boolean;
  subtitle: string;
}

// Reverse map localized genre name to TMDB ID if needed
const getGenreIdFromName = (name: string, lang: string): number | null => {
  const currentMap = genreMap[lang] || genreMap['en-US'];
  for (const [idStr, gName] of Object.entries(currentMap)) {
    if (gName.toLowerCase() === name.toLowerCase()) {
      return parseInt(idStr, 10);
    }
  }
  // Check English fallback
  for (const [idStr, gName] of Object.entries(genreMap['en-US'])) {
    if (gName.toLowerCase() === name.toLowerCase()) {
      return parseInt(idStr, 10);
    }
  }
  return null;
};

// Safe TMDB fetch helper
const safeFetchJson = async (url: string): Promise<any | null> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const generateSmartRecommendations = async ({
  watchHistory = [],
  likedMovieIds = [],
  dislikedMovieIds = [],
  myList = [],
  lang = 'uk'
}: UserTasteProfile): Promise<SmartRecommendationsData> => {
  const locale = lang === 'uk' ? 'uk-UA' : lang === 'ru' ? 'ru-RU' : 'en-US';
  const localizedGenres = genreMap[locale] || genreMap['en-US'];

  // Sets for exclusions
  const watchedSet = new Set<string>(watchHistory.map(m => m.id.toString()));
  const dislikedSet = new Set<string>(dislikedMovieIds.map(id => id.toString()));
  const likedSet = new Set<string>(likedMovieIds.map(id => id.toString()));

  // 1. ANALYZE USER TASTE PROFILE
  const genreWeights: Record<number, number> = {};
  let totalRatingSum = 0;
  let totalRatingCount = 0;
  let tvCount = 0;
  let movieCount = 0;
  let animationCount = 0;

  // Process movies helper
  const processMovieTastes = (movie: Movie, baseWeight: number) => {
    if (movie.rating && movie.rating !== 'NR') {
      const val = parseFloat(movie.rating);
      if (!isNaN(val) && val > 0) {
        totalRatingSum += val;
        totalRatingCount += 1;
      }
    }

    if (movie.mediaType === 'tv') tvCount += 1;
    else movieCount += 1;

    // Collect genre IDs
    let ids: number[] = movie.genreIds || [];
    if (ids.length === 0 && movie.genre && movie.genre.length > 0) {
      ids = movie.genre
        .map(g => getGenreIdFromName(g, locale))
        .filter((id): id is number => id !== null);
    }

    ids.forEach(id => {
      if (id === 16) animationCount += 1;
      genreWeights[id] = (genreWeights[id] || 0) + baseWeight;
    });
  };

  // Weight 1: Liked movies (highest explicit signal +4)
  const allKnownMovies = [...watchHistory, ...myList];
  likedMovieIds.forEach(likedId => {
    const known = allKnownMovies.find(m => m.id.toString() === likedId);
    if (known) {
      processMovieTastes(known, 4.0);
    }
  });

  // Weight 2: Watchlist (+2.5)
  myList.forEach(movie => {
    processMovieTastes(movie, 2.5);
  });

  // Weight 3: Watch History (Recency weighted: recent items up to +3.5)
  watchHistory.forEach((movie, index) => {
    const recencyWeight = Math.max(1.0, 3.5 - index * 0.15);
    processMovieTastes(movie, recencyWeight);
  });

  // Weight 4: Disliked movies (negative signal -3.0)
  dislikedMovieIds.forEach(dislikedId => {
    const known = allKnownMovies.find(m => m.id.toString() === dislikedId);
    if (known && known.genreIds) {
      known.genreIds.forEach(id => {
        genreWeights[id] = (genreWeights[id] || 0) - 3.0;
      });
    }
  });

  // Sort top genres
  const sortedGenreEntries = Object.entries(genreWeights)
    .map(([id, weight]) => ({ id: parseInt(id, 10), weight }))
    .filter(g => g.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  const topGenreIds = sortedGenreEntries.slice(0, 3).map(g => g.id);
  const primaryGenreId = topGenreIds[0];
  const primaryGenreName = primaryGenreId ? localizedGenres[primaryGenreId] : undefined;

  const hasPersonalData = watchHistory.length > 0 || likedMovieIds.length > 0 || myList.length > 0;
  const userAvgRating = totalRatingCount > 0 ? totalRatingSum / totalRatingCount : 7.2;
  const prefersTv = tvCount > movieCount * 1.5;
  const lovesAnimation = animationCount >= 2;

  // 2. CANDIDATE GATHERING VIA PARALLEL QUERIES
  interface Candidate {
    movie: Movie;
    sourceType: 'seed' | 'modern' | 'classic' | 'tv' | 'curated';
    seedTitle?: string;
  }

  const candidatePool: Candidate[] = [];

  if (hasPersonalData && topGenreIds.length > 0) {
    // Pick 1-2 seed movies for direct TMDB recommendations
    const seedCandidates = [
      ...watchHistory.filter(m => likedSet.has(m.id.toString())),
      ...watchHistory
    ].slice(0, 2);

    const genreFilter = topGenreIds.slice(0, 2).join('|');
    const minRating = userAvgRating >= 7.5 ? '7.0' : '6.5';

    const queries: Promise<any>[] = [];

    // 2.1 Seed Recommendations
    seedCandidates.forEach(seed => {
      const endpoint = seed.mediaType === 'tv' ? 'tv' : 'movie';
      queries.push(
        safeFetchJson(`${BASE_URL}/${endpoint}/${seed.id}/recommendations?api_key=${API_KEY}&language=${locale}&page=1`)
          .then(data => ({ type: 'seed', seedTitle: seed.title, data }))
      );
    });

    // 2.2 Modern Hits in Favorite Genres (2019 - Present)
    queries.push(
      safeFetchJson(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=${locale}&with_genres=${genreFilter}&sort_by=popularity.desc&vote_count.gte=300&vote_average.gte=${minRating}&primary_release_date.gte=2019-01-01&page=1`)
        .then(data => ({ type: 'modern', data }))
    );

    // 2.3 Golden Classics / Older Masterpieces (Year <= 2017, vote_count >= 800, vote_avg >= 7.5)
    // Matches explicit request: "Видавати можна не тільки свіжі фільми чи серіали або мультики а і старіше"
    queries.push(
      safeFetchJson(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=${locale}&with_genres=${genreFilter}&sort_by=vote_average.desc&vote_count.gte=800&vote_average.gte=7.5&primary_release_date.lte=2017-12-31&page=1`)
        .then(data => ({ type: 'classic', data }))
    );

    // 2.4 If user watches TV series or likes Animation, discover them
    if (prefersTv) {
      queries.push(
        safeFetchJson(`${BASE_URL}/discover/tv?api_key=${API_KEY}&language=${locale}&with_genres=${genreFilter}&sort_by=popularity.desc&vote_count.gte=200&vote_average.gte=7.0&page=1`)
          .then(data => ({ type: 'tv', data }))
      );
    } else if (lovesAnimation) {
      queries.push(
        safeFetchJson(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=${locale}&with_genres=16&sort_by=vote_average.desc&vote_count.gte=700&vote_average.gte=7.5&page=1`)
          .then(data => ({ type: 'classic', data }))
      );
    }

    const results = await Promise.allSettled(queries);
    results.forEach(res => {
      if (res.status === 'fulfilled' && res.value?.data?.results) {
        const payload = res.value;
        payload.data.results.forEach((r: any) => {
          if (r.poster_path || r.backdrop_path) {
            candidatePool.push({
              movie: mapResultToMovie(r, locale),
              sourceType: payload.type,
              seedTitle: payload.seedTitle
            });
          }
        });
      }
    });

  } else {
    // 2.5 COLD START / NO HISTORY FALLBACK:
    // Curated high-prestige selection of cinema masterpieces and all-time top hits
    const [classicsRes, modernRes, topTvRes] = await Promise.all([
      safeFetchJson(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=${locale}&sort_by=vote_average.desc&vote_count.gte=10000&vote_average.gte=8.2&page=1`),
      safeFetchJson(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=${locale}&sort_by=popularity.desc&vote_count.gte=2500&vote_average.gte=7.5&page=1`),
      safeFetchJson(`${BASE_URL}/discover/tv?api_key=${API_KEY}&language=${locale}&sort_by=vote_average.desc&vote_count.gte=3000&vote_average.gte=8.2&page=1`)
    ]);

    if (classicsRes?.results) {
      classicsRes.results.slice(0, 8).forEach((r: any) => {
        candidatePool.push({ movie: mapResultToMovie(r, locale), sourceType: 'classic' });
      });
    }
    if (modernRes?.results) {
      modernRes.results.slice(0, 8).forEach((r: any) => {
        candidatePool.push({ movie: mapResultToMovie(r, locale), sourceType: 'modern' });
      });
    }
    if (topTvRes?.results) {
      topTvRes.results.slice(0, 6).forEach((r: any) => {
        candidatePool.push({ movie: mapResultToMovie(r, locale), sourceType: 'tv' });
      });
    }
  }

  // 3. DEDUPLICATION, EXCLUSION FILTER & SMART SCORING
  const seenIds = new Set<string>();
  const scoredMovies: Movie[] = [];
  const topGenreIdSet = new Set<number>(topGenreIds);

  for (const candidate of candidatePool) {
    const movie = candidate.movie;
    const movieId = movie.id.toString();

    // Exclude already watched, disliked or duplicated
    if (watchedSet.has(movieId) || dislikedSet.has(movieId) || seenIds.has(movieId)) {
      continue;
    }
    seenIds.add(movieId);

    // Calculate precision match percentage (85% - 99%)
    let matchScore = 76;

    // Genre overlap bonus (up to +14%)
    const movieGenres = movie.genreIds || [];
    const matchingCount = movieGenres.filter(g => topGenreIdSet.has(g)).length;
    matchScore += Math.min(14, matchingCount * 7);

    // Rating quality bonus (up to +7%)
    const vote = parseFloat(movie.rating) || 7.0;
    if (vote >= 8.2) matchScore += 7;
    else if (vote >= 7.6) matchScore += 4;
    else if (vote >= 7.0) matchScore += 2;

    // Source bonus
    if (candidate.sourceType === 'seed') matchScore += 4;
    if (candidate.sourceType === 'classic' && vote >= 7.8) matchScore += 3;

    // Clamp score
    const finalMatch = Math.min(99, Math.max(84, Math.round(matchScore)));
    movie.match = finalMatch;

    // Localized Reason Badge
    const isClassic = movie.year && movie.year <= 2017 && vote >= 7.6;
    let reason = '';

    if (lang === 'uk') {
      if (candidate.sourceType === 'seed' && candidate.seedTitle) {
        reason = `Схоже на «${candidate.seedTitle.slice(0, 20)}${candidate.seedTitle.length > 20 ? '…' : ''}»`;
      } else if (isClassic) {
        reason = `Золота класика (${movie.year})`;
      } else if (movie.genre && movie.genre[0] && primaryGenreName && movie.genre.includes(primaryGenreName)) {
        reason = `Улюблений жанр: ${primaryGenreName}`;
      } else if (vote >= 8.0) {
        reason = `Топ рейтинг ★${movie.rating}`;
      } else {
        reason = 'Враховуючи ваш смак';
      }
    } else if (lang === 'ru') {
      if (candidate.sourceType === 'seed' && candidate.seedTitle) {
        reason = `Похоже на «${candidate.seedTitle.slice(0, 20)}${candidate.seedTitle.length > 20 ? '…' : ''}»`;
      } else if (isClassic) {
        reason = `Золотая классика (${movie.year})`;
      } else if (movie.genre && movie.genre[0] && primaryGenreName && movie.genre.includes(primaryGenreName)) {
        reason = `Любимый жанр: ${primaryGenreName}`;
      } else if (vote >= 8.0) {
        reason = `Топ рейтинг ★${movie.rating}`;
      } else {
        reason = 'По вашему вкусу';
      }
    } else {
      if (candidate.sourceType === 'seed' && candidate.seedTitle) {
        reason = `Similar to "${candidate.seedTitle.slice(0, 20)}${candidate.seedTitle.length > 20 ? '…' : ''}"`;
      } else if (isClassic) {
        reason = `Classic Gem (${movie.year})`;
      } else if (movie.genre && movie.genre[0] && primaryGenreName && movie.genre.includes(primaryGenreName)) {
        reason = `Favorite: ${primaryGenreName}`;
      } else if (vote >= 8.0) {
        reason = `Top Rated ★${movie.rating}`;
      } else {
        reason = 'Matches your taste';
      }
    }

    movie.recommendationReason = reason;
    scoredMovies.push(movie);
  }

  // Interleave and sort by match score and rating
  scoredMovies.sort((a, b) => b.match - a.match || parseFloat(b.rating) - parseFloat(a.rating));

  // Determine user subtitle
  let subtitle = '';
  if (lang === 'uk') {
    if (primaryGenreName) {
      subtitle = `На основі ваших переглядів • Акцент на ${primaryGenreName}`;
    } else if (hasPersonalData) {
      subtitle = 'На основі вашої історії та вподобань';
    } else {
      subtitle = 'Персональний старт: шедеври кіно та світові хіти';
    }
  } else if (lang === 'ru') {
    if (primaryGenreName) {
      subtitle = `На основе ваших просмотров • Акцент на ${primaryGenreName}`;
    } else if (hasPersonalData) {
      subtitle = 'На основе вашей истории и предпочтений';
    } else {
      subtitle = 'Персональный старт: шедевры кино и мировые хиты';
    }
  } else {
    if (primaryGenreName) {
      subtitle = `Based on your watch activity • Focus on ${primaryGenreName}`;
    } else if (hasPersonalData) {
      subtitle = 'Based on your watch history and taste';
    } else {
      subtitle = 'Curated starter pack: cinema masterpieces & hits';
    }
  }

  return {
    movies: scoredMovies.slice(0, 18),
    primaryGenreName,
    hasPersonalData,
    subtitle
  };
};
