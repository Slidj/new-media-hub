
import React, { useState, useEffect } from 'react';
import { Bell, Info, Play, MonitorPlay } from 'lucide-react';
import { Movie } from '../types';
import { API } from '../services/tmdb';
import { Language, translations } from '../utils/translations';
import { SkeletonCard } from './SkeletonCard';

interface ComingSoonViewProps {
  onMovieSelect: (movie: Movie) => void;
  lang: Language;
}

export const ComingSoonView: React.FC<ComingSoonViewProps> = ({ onMovieSelect, lang }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [remindedMovies, setRemindedMovies] = useState<Set<string>>(new Set());
  
  const t = translations[lang];

  useEffect(() => {
    let isMounted = true;
    const loadUpcoming = async () => {
        setLoading(true);
        const locale = lang === 'uk' ? 'uk-UA' : lang === 'ru' ? 'ru-RU' : 'en-US';
        const data = await API.fetchUpcoming(1, locale);
        if (isMounted) {
            setMovies(data);
            setLoading(false);
        }
    };
    loadUpcoming();
    return () => { isMounted = false; };
  }, [lang]);

  const toggleReminder = (e: React.MouseEvent, movieId: string) => {
      e.stopPropagation();
      const newSet = new Set(remindedMovies);
      if (newSet.has(movieId)) {
          newSet.delete(movieId);
      } else {
          newSet.add(movieId);
          if (window.Telegram?.WebApp) {
             const tg = window.Telegram.WebApp;
             if (tg.isVersionAtLeast && tg.isVersionAtLeast('6.1') && tg.HapticFeedback) {
                 tg.HapticFeedback.impactOccurred('medium');
             }
          }
      }
      setRemindedMovies(newSet);
  };

  const formatDate = (dateString?: string) => {
      if (!dateString) return { day: '', month: '' };
      const date = new Date(dateString);
      const day = date.getDate();
      const monthNames = lang === 'uk' 
        ? ['СІЧ', 'ЛЮТ', 'БЕР', 'КВІ', 'ТРА', 'ЧЕР', 'ЛИП', 'СЕР', 'ВЕР', 'ЖОВ', 'ЛИС', 'ГРУ']
        : lang === 'ru' 
        ? ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК']
        : ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return { day, month: monthNames[date.getMonth()] };
  };

  if (loading) {
      return (
          <div className="min-h-screen bg-black pt-[130px] px-4 space-y-8 pb-32">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-9 h-9 bg-gray-800 rounded-full animate-pulse"></div>
                 <div className="h-6 w-32 bg-gray-800 rounded animate-pulse"></div>
              </div>
              {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-4">
                      <div className="w-12 pt-2 flex flex-col items-center gap-2">
                          <div className="h-4 w-8 bg-gray-800 rounded"></div>
                          <div className="h-6 w-6 bg-gray-800 rounded"></div>
                      </div>
                      <div className="flex-1 space-y-4">
                          <div className="aspect-video bg-gray-800 rounded-lg"></div>
                          <div className="h-6 w-3/4 bg-gray-800 rounded"></div>
                          <div className="h-4 w-full bg-gray-800 rounded"></div>
                      </div>
                  </div>
              ))}
          </div>
      );
  }

  return (
    // Updated padding-top: safe-area + 120px to account for taller navbar
    <div className="min-h-screen w-full bg-black pt-[calc(120px+env(safe-area-inset-top))] pb-32 md:pb-12 overflow-x-hidden">
      
      {/* Header */}
      <div className="px-4 md:px-12 mb-6 flex items-center gap-3">
          <div className="p-2 bg-[#E50914] rounded-full shadow-lg shadow-red-900/20">
            <Bell className="w-5 h-5 text-white fill-white" />
          </div>
          <h2 className="text-xl font-bold text-white">{t.comingSoon}</h2>
      </div>

      {!loading && movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500 px-6 text-center animate-fade-in-up">
              <MonitorPlay className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">{t.noRecommendations || "No upcoming movies found"}</p>
              <p className="text-sm opacity-50 mt-2">Check back later for new releases.</p>
          </div>
      ) : (
          <div className="space-y-10 px-2 md:px-0">
            {movies.map((movie, index) => {
                const { day, month } = formatDate(movie.releaseDate);
                const isReminded = remindedMovies.has(movie.id);

                return (
                    <div 
                        key={movie.id} 
                        className="flex w-full group opacity-0 animate-fade-in-up"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        {/* Left Column: Date */}
                        <div className="w-[60px] md:w-[100px] shrink-0 flex flex-col items-center pt-2 sticky top-[130px] h-fit z-10">
                            <span className="text-gray-400 text-sm md:text-lg font-bold tracking-wider drop-shadow-md">{month}</span>
                            <span className="text-white text-3xl md:text-5xl font-black drop-shadow-lg">{day}</span>
                        </div>

                        {/* Right Column: Content */}
                        <div className="flex-1 pr-2 md:pr-12 cursor-pointer" onClick={() => onMovieSelect(movie)}>
                            
                            {/* Image Block */}
                            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-[#181818] mb-4 shadow-2xl border border-white/5 group-hover:border-white/20 transition-all duration-300">
                                <img 
                                    src={movie.bannerUrl || movie.posterUrl} 
                                    alt={movie.title}
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-500 transform group-hover:scale-105"
                                    loading="lazy"
                                />
                                
                                {/* Play Icon Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 scale-50 group-hover:scale-100 shadow-xl">
                                        <Play className="w-6 h-6 text-white fill-white ml-1" />
                                    </div>
                                </div>

                                {/* Logo Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/60 to-transparent">
                                    <h3 className="text-xl md:text-3xl font-bebas text-white uppercase drop-shadow-lg leading-none tracking-wide">
                                        {movie.title}
                                    </h3>
                                </div>
                            </div>

                            {/* Action Bar */}
                            <div className="flex items-center justify-between mb-3 px-1">
                                <div className="flex items-center gap-2">
                                    <div className="h-px w-4 bg-red-600/50"></div>
                                    <span className="text-xs md:text-sm font-bold text-white/90 uppercase tracking-widest">
                                        {t.coming} • {day} {month}
                                    </span>
                                </div>
                                
                                <div className="flex gap-5">
                                    <div className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition" onClick={(e) => toggleReminder(e, movie.id)}>
                                        <Bell className={`w-5 h-5 md:w-6 md:h-6 transition-all duration-300 ${isReminded ? 'text-[#E50914] fill-[#E50914]' : 'text-white'}`} />
                                        <span className={`text-[9px] md:text-[10px] uppercase font-bold tracking-wider ${isReminded ? 'text-[#E50914]' : 'text-gray-400'}`}>
                                            {isReminded ? t.reminded : t.remindMe}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition">
                                        <Info className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                        <span className="text-[9px] md:text-[10px] text-gray-400 uppercase font-bold tracking-wider">{t.moreInfo}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Text Content */}
                            <div className="space-y-3 px-1">
                                <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">
                                    {movie.description}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {movie.genre.slice(0, 3).map((g, idx) => (
                                        <span key={idx} className="text-[10px] px-2.5 py-1 bg-[#181818] rounded-full text-gray-300 border border-white/10">
                                            {g}
                                        </span>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                );
            })}
          </div>
      )}
    </div>
  );
};
