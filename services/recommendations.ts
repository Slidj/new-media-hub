import { Movie } from '../types';
import { API_KEY, BASE_URL, mapResultToMovie, genreMap, fetchTMDBJson } from './tmdb';

interface UserTasteProfile {
  watchHistory: Movie[];
  likedMovieIds: string[];
  dislikedMovieIds: string[];
  myList: Movie[];
  catalogMovies?: Movie[];
  lang: string;
}

export interface SmartRecommendationsData {
  movies: Movie[];
  primaryGenreName?: string;
  hasPersonalData: boolean;
  subtitle: string;
}

// Comprehensive synonym mapping for all TMDB Genres across Ukrainian, Russian and English
const GENRE_SYNONYMS: Record<string, number> = {
  // Action (28)
  'бойовик': 28, 'бойовики': 28, 'екшн': 28, 'екшн і пригоди': 28, 'екшн та пригоди': 28, 'боевик': 28, 'боевики': 28, 'экшн': 28, 'экшн и приключения': 28, 'action': 28, 'action & adventure': 28,
  // Adventure (12)
  'пригоди': 12, 'пригода': 12, 'приключения': 12, 'приключение': 12, 'adventure': 12,
  // Animation (16)
  'мультфільм': 16, 'мультфільми': 16, 'мультик': 16, 'мультики': 16, 'анімація': 16, 'мультфильм': 16, 'мультфильмы': 16, 'анимация': 16, 'animation': 16, 'cartoon': 16,
  // Comedy (35)
  'комедія': 35, 'комедії': 35, 'комедия': 35, 'комедии': 35, 'comedy': 35,
  // Crime (80)
  'кримінал': 80, 'кримінальний': 80, 'криминал': 80, 'криминальный': 80, 'crime': 80,
  // Documentary (99)
  'документальний': 99, 'документальні': 99, 'документалка': 99, 'документальный': 99, 'документальные': 99, 'documentary': 99,
  // Drama (18)
  'драма': 18, 'драми': 18, 'драмы': 18, 'drama': 18,
  // Family (10751)
  'сімейний': 10751, 'сімейні': 10751, 'для сім’ї': 10751, 'для сім\'ї': 10751, 'семейный': 10751, 'семейные': 10751, 'для семьи': 10751, 'family': 10751,
  // Fantasy (14)
  'фентезі': 14, 'фэнтези': 14, 'fantasy': 14,
  // History (36)
  'історичний': 36, 'історичні': 36, 'історія': 36, 'исторический': 36, 'исторические': 36, 'история': 36, 'history': 36,
  // Horror (27)
  'жахи': 27, 'жах': 27, 'хоррор': 27, 'хоррори': 27, 'ужасы': 27, 'ужас': 27, 'horror': 27,
  // Music (10402)
  'музика': 10402, 'музичний': 10402, 'музыка': 10402, 'музыкальный': 10402, 'music': 10402,
  // Mystery (9648)
  'містика': 9648, 'детектив': 9648, 'детективи': 9648, 'таємниця': 9648, 'мистика': 9648, 'тайна': 9648, 'mystery': 9648,
  // Romance (10749)
  'мелодрама': 10749, 'мелодрами': 10749, 'романтика': 10749, 'романтичний': 10749, 'любов': 10749, 'любовний': 10749, 'мелодрамы': 10749, 'любовный': 10749, 'romance': 10749,
  // Sci-Fi (878)
  'фантастика': 878, 'наукова фантастика': 878, 'научная фантастика': 878, 'sci-fi': 878, 'scifi': 878, 'science fiction': 878, 'фантастика і фентезі': 878, 'фантастика и фэнтези': 878,
  // Thriller (53)
  'трилер': 53, 'трилери': 53, 'триллер': 53, 'триллеры': 53, 'thriller': 53,
  // War (10752)
  'військовий': 10752, 'військові': 10752, 'війна': 10752, 'про війну': 10752, 'военный': 10752, 'военные': 10752, 'война': 10752, 'war': 10752,
  // Western (37)
  'вестерн': 37, 'вестерни': 37, 'вестерны': 37, 'western': 37
};

// Map localized genre name or subparts to TMDB ID
const getGenreIdFromName = (name: string): number | null => {
  if (!name) return null;
  const clean = name.trim().toLowerCase().replace(/[,/]/g, ' ');
  
  if (GENRE_SYNONYMS[clean]) {
    return GENRE_SYNONYMS[clean];
  }

  for (const [synonym, id] of Object.entries(GENRE_SYNONYMS)) {
    if (clean.includes(synonym) || synonym.includes(clean)) {
      return id;
    }
  }

  // Fallback to genreMap checking
  for (const localeKey of Object.keys(genreMap)) {
    const map = genreMap[localeKey];
    for (const [idStr, gName] of Object.entries(map)) {
      if (gName.toLowerCase() === clean || clean.includes(gName.toLowerCase())) {
        return parseInt(idStr, 10);
      }
    }
  }
  return null;
};

// Safe TMDB fetch helper with dual-domain failover & caching
const safeFetchJson = async (urlOrEndpoint: string): Promise<any | null> => {
  try {
    return await fetchTMDBJson(urlOrEndpoint);
  } catch {
    return null;
  }
};

export const generateSmartRecommendations = async ({
  watchHistory = [],
  likedMovieIds = [],
  dislikedMovieIds = [],
  myList = [],
  catalogMovies = [],
  lang = 'uk'
}: UserTasteProfile): Promise<SmartRecommendationsData> => {
  const locale = lang === 'uk' ? 'uk-UA' : lang === 'ru' ? 'ru-RU' : 'en-US';
  const localizedGenres = genreMap[locale] || genreMap['en-US'];

  // Sets for fast checks
  const watchedSet = new Set<string>(watchHistory.map(m => m.id.toString()));
  const dislikedSet = new Set<string>(dislikedMovieIds.map(id => id.toString()));
  const likedSet = new Set<string>(likedMovieIds.map(id => id.toString()));

  // Pool of known movie objects from current state
  const knownMovieMap = new Map<string, Movie>();
  [...catalogMovies, ...watchHistory, ...myList].forEach(m => {
    if (m && m.id) {
      knownMovieMap.set(m.id.toString(), m);
    }
  });

  // Fetch missing liked/disliked movies from TMDB to ensure 100% taste accuracy
  const missingIds = [...likedMovieIds, ...dislikedMovieIds]
    .filter(id => id && !knownMovieMap.has(id.toString()))
    .slice(0, 10);

  if (missingIds.length > 0) {
    const fetchPromises = missingIds.map(async (id) => {
      let data = await safeFetchJson(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=${locale}`);
      if (!data || !data.id) {
        data = await safeFetchJson(`${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=${locale}`);
      }
      if (data && data.id) {
        const mapped = mapResultToMovie(data, locale);
        knownMovieMap.set(id.toString(), mapped);
      }
    });
    await Promise.allSettled(fetchPromises);
  }

  // 1. ANALYZE USER TASTE PROFILE WITH PRECISE GENRE HIERARCHY
  // Map genre ID -> { score, primaryCount, recencyScore }
  interface GenreStat {
    id: number;
    score: number;
    primaryCount: number;
    recencyBoost: number;
  }

  const genreStatsMap = new Map<number, GenreStat>();
  const getOrCreateStat = (id: number): GenreStat => {
    let stat = genreStatsMap.get(id);
    if (!stat) {
      stat = { id, score: 0, primaryCount: 0, recencyBoost: 0 };
      genreStatsMap.set(id, stat);
    }
    return stat;
  };

  let totalRatingSum = 0;
  let totalRatingCount = 0;
  let tvCount = 0;
  let movieCount = 0;
  let animationCount = 0;

  // Extract ordered genre IDs for a movie (preserving main primary genre at index 0)
  const getMovieGenreIds = (movie: Movie): number[] => {
    let ids: number[] = Array.isArray(movie.genreIds) && movie.genreIds.length > 0 
      ? [...movie.genreIds] 
      : [];

    if (ids.length === 0 && Array.isArray(movie.genre)) {
      movie.genre.forEach(gStr => {
        if (!gStr) return;
        const subParts = gStr.split(/[,/|•]/);
        subParts.forEach(part => {
          const matchedId = getGenreIdFromName(part);
          if (matchedId && !ids.includes(matchedId)) {
            ids.push(matchedId);
          }
        });
      });
    }
    return ids;
  };

  // Process movie tastes with positional genre weighting:
  // Primary (1st) genre = 100% weight, Secondary = 40%, Tertiary = 20%, others = 10%
  const processMovieTastes = (movie: Movie, baseWeight: number, isRecent: boolean = false) => {
    if (movie.rating && movie.rating !== 'NR') {
      const val = parseFloat(movie.rating);
      if (!isNaN(val) && val > 0) {
        totalRatingSum += val;
        totalRatingCount += 1;
      }
    }

    if (movie.mediaType === 'tv') tvCount += 1;
    else movieCount += 1;

    const ids = getMovieGenreIds(movie);
    if (ids.length === 0) return;

    // The FIRST genre is the defining primary archetype
    const primaryId = ids[0];
    const primaryStat = getOrCreateStat(primaryId);
    primaryStat.score += baseWeight * 1.0;
    primaryStat.primaryCount += 1;
    if (isRecent) primaryStat.recencyBoost += 3.0;

    if (primaryId === 16) animationCount += 1;

    // Secondary & Tertiary genres receive diminishing fractional weights
    for (let i = 1; i < ids.length; i++) {
      const gid = ids[i];
      const stat = getOrCreateStat(gid);
      const positionFactor = i === 1 ? 0.40 : i === 2 ? 0.20 : 0.10;
      stat.score += baseWeight * positionFactor;
      if (isRecent) stat.recencyBoost += 0.8;
      if (gid === 16) animationCount += 1;
    }
  };

  // Weight 1: Liked movies (strongest explicit taste signal: +6.0 to +4.0)
  likedMovieIds.forEach((likedId, index) => {
    const known = knownMovieMap.get(likedId.toString());
    if (known) {
      const isRecent = index < 3;
      const weight = Math.max(3.0, 6.0 - index * 0.3);
      processMovieTastes(known, weight, isRecent);
    }
  });

  // Weight 2: Watchlist (+3.5 to +2.0)
  myList.forEach((movie, index) => {
    const isRecent = index < 2;
    const weight = Math.max(2.0, 3.5 - index * 0.15);
    processMovieTastes(movie, weight, isRecent);
  });

  // Weight 3: Watch History (Recency weighted: latest watched +5.0 down to +1.5)
  watchHistory.forEach((movie, index) => {
    const isRecent = index < 3;
    const recencyWeight = Math.max(1.5, 5.0 - index * 0.25);
    processMovieTastes(movie, recencyWeight, isRecent);
  });

  // Weight 4: Disliked movies (negative signal -5.0)
  dislikedMovieIds.forEach(dislikedId => {
    const known = knownMovieMap.get(dislikedId.toString());
    if (known) {
      const ids = getMovieGenreIds(known);
      ids.forEach((id, idx) => {
        const stat = getOrCreateStat(id);
        const factor = idx === 0 ? 5.0 : 2.5;
        stat.score -= factor;
      });
    }
  });

  // Calculate composite rank for each genre and sort descending
  const genreList = Array.from(genreStatsMap.values())
    .map(g => ({
      ...g,
      totalScore: g.score + g.recencyBoost + (g.primaryCount * 1.5)
    }))
    .filter(g => g.totalScore > 0)
    .sort((a, b) => {
      // Sort primarily by composite totalScore
      if (Math.abs(b.totalScore - a.totalScore) > 0.01) {
        return b.totalScore - a.totalScore;
      }
      // Tie breaker 1: Primary occurrence count
      if (b.primaryCount !== a.primaryCount) {
        return b.primaryCount - a.primaryCount;
      }
      // Tie breaker 2: Recency boost
      return b.recencyBoost - a.recencyBoost;
    });

  const topGenreIds = genreList.slice(0, 3).map(g => g.id);
  const primaryGenreId = topGenreIds[0];
  const secondaryGenreId = topGenreIds[1];
  const tertiaryGenreId = topGenreIds[2];

  const primaryGenreName = primaryGenreId ? (localizedGenres[primaryGenreId] || 'Фільми') : undefined;
  const secondaryGenreName = secondaryGenreId ? localizedGenres[secondaryGenreId] : undefined;
  const tertiaryGenreName = tertiaryGenreId ? localizedGenres[tertiaryGenreId] : undefined;

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
    // Pick 1-3 seed movies for direct TMDB recommendations (prioritize liked movies first)
    const seedCandidates: Movie[] = [];
    likedMovieIds.forEach(id => {
      const m = knownMovieMap.get(id.toString());
      if (m && seedCandidates.length < 3) seedCandidates.push(m);
    });
    watchHistory.forEach(m => {
      if (m && seedCandidates.length < 3 && !seedCandidates.some(s => s.id === m.id)) {
        seedCandidates.push(m);
      }
    });
    myList.forEach(m => {
      if (m && seedCandidates.length < 3 && !seedCandidates.some(s => s.id === m.id)) {
        seedCandidates.push(m);
      }
    });

    const minRating = userAvgRating >= 7.5 ? '7.0' : '6.4';
    const queries: Promise<any>[] = [];

    // 2.1 Direct Seed Recommendations (Films similar to what this user explicitly loved/watched)
    seedCandidates.slice(0, 3).forEach(seed => {
      const endpoint = seed.mediaType === 'tv' ? 'tv' : 'movie';
      queries.push(
        safeFetchJson(`${BASE_URL}/${endpoint}/${seed.id}/recommendations?api_key=${API_KEY}&language=${locale}&page=1`)
          .then(data => ({ type: 'seed', seedTitle: seed.title, data }))
      );
    });

    // 2.2 Modern Hits in User's #1 Favorite Genre
    if (primaryGenreId) {
      queries.push(
        safeFetchJson(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=${locale}&with_genres=${primaryGenreId}&sort_by=popularity.desc&vote_count.gte=250&vote_average.gte=${minRating}&primary_release_date.gte=2019-01-01&page=1`)
          .then(data => ({ type: 'modern', data }))
      );
    }

    // 2.3 Hits in User's #2 Favorite Genre
    if (secondaryGenreId) {
      queries.push(
        safeFetchJson(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=${locale}&with_genres=${secondaryGenreId}&sort_by=popularity.desc&vote_count.gte=200&vote_average.gte=${minRating}&page=1`)
          .then(data => ({ type: 'modern', data }))
      );
    }

    // 2.4 Golden Classics in User's #1 Genre (Release <= 2017, High Rating)
    if (primaryGenreId) {
      queries.push(
        safeFetchJson(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=${locale}&with_genres=${primaryGenreId}&sort_by=vote_average.desc&vote_count.gte=700&vote_average.gte=7.5&primary_release_date.lte=2017-12-31&page=1`)
          .then(data => ({ type: 'classic', data }))
      );
    }

    // 2.5 TV Series or Animation if relevant
    if (prefersTv && primaryGenreId) {
      queries.push(
        safeFetchJson(`${BASE_URL}/discover/tv?api_key=${API_KEY}&language=${locale}&with_genres=${primaryGenreId}&sort_by=popularity.desc&vote_count.gte=200&vote_average.gte=7.0&page=1`)
          .then(data => ({ type: 'tv', data }))
      );
    } else if (lovesAnimation) {
      queries.push(
        safeFetchJson(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=${locale}&with_genres=16&sort_by=vote_average.desc&vote_count.gte=600&vote_average.gte=7.5&page=1`)
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
    let matchScore = 78;

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

  // Determine dynamic user subtitle reflecting top genres (capped at max 2 for perfect mobile readability)
  let subtitle = '';
  
  // Format dynamic genre phrase (e.g. "Бойовик" or "Бойовик та Комедія")
  let genrePhrase = '';
  if (primaryGenreName) {
    const top1Score = genreList[0]?.totalScore || 1;
    const top2Score = genreList[1]?.totalScore || 0;

    // Show 2 genres only if secondary genre is strong (at least 65% of top 1 score)
    const hasStrongSecondary = secondaryGenreName && (top2Score >= top1Score * 0.65);

    if (lang === 'uk') {
      genrePhrase = hasStrongSecondary ? `${primaryGenreName} та ${secondaryGenreName}` : primaryGenreName;
      subtitle = `На основі переглядів • ${genrePhrase}`;
    } else if (lang === 'ru') {
      genrePhrase = hasStrongSecondary ? `${primaryGenreName} и ${secondaryGenreName}` : primaryGenreName;
      subtitle = `На основе просмотров • ${genrePhrase}`;
    } else {
      genrePhrase = hasStrongSecondary ? `${primaryGenreName} & ${secondaryGenreName}` : primaryGenreName;
      subtitle = `Based on your taste • ${genrePhrase}`;
    }
  } else if (hasPersonalData) {
    if (lang === 'uk') subtitle = 'На основі вашої історії та вподобань';
    else if (lang === 'ru') subtitle = 'На основе вашей истории и предпочтений';
    else subtitle = 'Based on your watch history and taste';
  } else {
    if (lang === 'uk') subtitle = 'Шедеври кіно та світові хіти';
    else if (lang === 'ru') subtitle = 'Шедевры кино и мировые хиты';
    else subtitle = 'Cinema masterpieces & hits';
  }

  return {
    movies: scoredMovies.slice(0, 18),
    primaryGenreName,
    hasPersonalData,
    subtitle
  };
};
