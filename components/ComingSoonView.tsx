
import React, { useState, useEffect } from 'react';
import { Bell, Info, Share2, Play } from 'lucide-react';
import { Movie } from '../types';
import { API } from '../services/tmdb';
import { Language, translations } from '../utils/translations';

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
    const loadUpcoming = async () => {
        setLoading(true);
        const locale = lang === 'uk' ? 'uk-UA' : lang === 'ru' ? 'ru-RU' : 'en-US';
        const data = await API.fetchUpcoming(1, locale);
        setMovies(data);
        setLoading(false);
    };
    loadUpcoming();
  }, [lang]);

  const toggleReminder = (e: React.MouseEvent, movieId: string) => {
      e.stopPropagation();
      const newSet = new Set(remindedMovies);
      if (newSet.has(movieId)) {
          newSet.delete(movieId);
      } else {
          newSet.add(movieId);
          if (window.Telegram?.WebApp?.HapticFeedback) {
             window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
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
          <div className="pt-[100px] pb-24 px-4 space-y-8 bg-black min-h-screen">
              {Array.from({ length: 3 }).map((_, i) => (
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
    <div className="min-h-screen bg-black pt-[100px] pb-24 overflow-y-auto no-scrollbar">
      
      {/* Header */}
      <div className="px-6 mb-6 flex items-center gap-3">
          <div className="p-2 bg-[#E50914] rounded-full">
            <Bell className="w-5 h-5 text-white fill-white" />
          </div>
          <h2 className="text-xl font-bold text-white">{t.comingSoon}</h2>
      </div>

      <div className="space-y-8">
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
                    <div className="w-[60px] md:w-[80px] shrink-0 flex flex-col items-center pt-2 sticky top-[100px] h-fit">
                        <span className="text-gray-400 text-sm md:text-base font-bold tracking-wider">{month}</span>
                        <span className="text-white text-3xl md:text-4xl font-black">{day}</span>
                    </div>

                    {/* Right Column: Content */}
                    <div className="flex-1 pr-4 md:pr-12 cursor-pointer" onClick={() => onMovieSelect(movie)}>
                        
                        {/* Image Block */}
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-[#181818] mb-4 shadow-lg border border-white/5">
                            <img 
                                src={movie.bannerUrl || movie.posterUrl} 
                                alt={movie.title}
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-500"
                                loading="lazy"
                            />
                            
                            {/* Play Icon Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 scale-50 group-hover:scale-100">
                                    <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                                </div>
                            </div>

                            {/* Logo Overlay (simulated with Text) */}
                            <div className="absolute bottom-3 left-3 right-3">
                                <h3 className="text-2xl font-bebas text-white uppercase drop-shadow-lg leading-none tracking-wide text-transparent bg-clip-text bg-gradient-to-t from-white to-gray-300">
                                    {movie.title}
                                </h3>
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm md:text-base font-bold text-white/90">
                                    {t.coming} {day} {month}
                                </span>
                            </div>
                            
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center gap-1" onClick={(e) => toggleReminder(e, movie.id)}>
                                    <Bell className={`w-6 h-6 transition-all duration-300 ${isReminded ? 'text-[#E50914] fill-[#E50914]' : 'text-white'}`} />
                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isReminded ? 'text-[#E50914]' : 'text-gray-400'}`}>
                                        {isReminded ? t.reminded : t.remindMe}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <Info className="w-6 h-6 text-white" />
                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{t.moreInfo}</span>
                                </div>
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="space-y-2">
                            <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">
                                {movie.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {movie.genre.slice(0, 3).map((g, idx) => (
                                    <span key={idx} className="text-[10px] px-2 py-1 bg-[#181818] rounded text-gray-300 border border-white/10">
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
    </div>
  );
};
