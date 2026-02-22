
import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Plus, Check, ThumbsUp, ThumbsDown, Share2, Youtube } from 'lucide-react';
import { Movie, Cast, Video } from '../types';
import { Language, translations } from '../utils/translations';
import { API } from '../services/tmdb';
import { Haptics } from '../utils/haptics';
import { Audio } from '../utils/audio';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  movie: Movie | null;
  onClose: () => void;
  onPlay: (movie: Movie) => void;
  onMovieSelect?: (movie: Movie) => void;
  onToggleList?: (movie: Movie) => void;
  onToggleLike?: (movie: Movie) => void;
  onToggleDislike?: (movie: Movie) => void;
  isInList?: boolean;
  isLiked?: boolean;
  isDisliked?: boolean; 
  lang: Language;
}

type TabType = 'overview' | 'trailers' | 'more_like_this';

export const Modal: React.FC<ModalProps> = ({ 
    movie, 
    onClose, 
    onPlay, 
    onMovieSelect, 
    onToggleList, 
    onToggleLike, 
    onToggleDislike, 
    isInList = false, 
    isLiked = false, 
    isDisliked = false,
    lang 
}) => {
  const [isHighResLoaded, setIsHighResLoaded] = useState(false);
  const [platform, setPlatform] = useState('');
  
  // Content States
  const [duration, setDuration] = useState<string | null>(null);
  const [tagline, setTagline] = useState<string | null>(null);
  
  // Extended Content States
  const [cast, setCast] = useState<Cast[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Trailer Player State
  const [playingTrailerKey, setPlayingTrailerKey] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];

  useEffect(() => {
    if (movie) {
      // 1. Reset Everything
      setIsHighResLoaded(false);
      
      setDuration(null);
      setTagline(null);
      setCast([]);
      setVideos([]);
      setRecommendations([]);
      setActiveTab('overview');
      setPlayingTrailerKey(null);

      if (scrollRef.current) scrollRef.current.scrollTop = 0;

      if (window.Telegram?.WebApp) {
        setPlatform(window.Telegram.WebApp.platform);
      }
      
      let isMounted = true;

      // 2. Load Secondary Data
      const loadData = async () => {
          try {
              const [detailsData, castData, videoData, recData] = await Promise.all([
                  API.fetchMovieDetails(movie.id, movie.mediaType),
                  API.fetchCredits(movie.id, movie.mediaType),
                  API.fetchVideos(movie.id, movie.mediaType),
                  API.fetchRecommendations(movie.id, movie.mediaType, lang === 'uk' ? 'uk-UA' : lang === 'ru' ? 'ru-RU' : 'en-US'),
              ]);

              if (!isMounted) return;

              if (movie.duration && movie.duration !== 'N/A') setDuration(movie.duration);
              else if (detailsData.duration) setDuration(detailsData.duration);

              if (detailsData.tagline) setTagline(detailsData.tagline);
              
              setCast(castData);
              setVideos(videoData);
              setRecommendations(recData);

          } catch (e) {
              console.error("Modal data error", e);
          }
      };

      loadData();

      // Telegram Back Button Integration
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        if (tg.isVersionAtLeast && tg.isVersionAtLeast('6.1')) {
            tg.BackButton.show();
            tg.BackButton.onClick(handleClose);
            Haptics.light();
        }
      }

      return () => {
        isMounted = false;
        if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          if (tg.isVersionAtLeast && tg.isVersionAtLeast('6.1')) {
            tg.BackButton.offClick(handleClose);
            tg.BackButton.hide();
          }
        }
      };
    }
  }, [movie]);

  const handleClose = () => {
    Haptics.light(); 
    Audio.playClick(); // Sound on close
    onClose();
  };

  const handlePlayClick = () => {
    Haptics.heavy(); 
    Audio.playAction(); // Sound on play
    onPlay(movie!);
  };
  
  const handleRecommendationClick = (recMovie: Movie) => {
      Haptics.medium(); 
      Audio.playPop(); // Sound on select
      if (onMovieSelect) {
          onMovieSelect(recMovie);
      }
  };

  const handleTrailerClick = (videoKey: string) => {
      Haptics.medium();
      Audio.playClick();
      setPlayingTrailerKey(videoKey);
  };

  const handleTabChange = (tab: TabType) => {
      Haptics.selection(); 
      Audio.playClick();
      setActiveTab(tab);
  };

  const getYoutubeOrigin = () => {
      if (typeof window !== 'undefined' && window.location.origin) {
          return window.location.origin;
      }
      return 'https://localhost';
  };

  return (
    <AnimatePresence>
    {movie && (
        // Z-INDEX 100: Above Navbar
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center pointer-events-auto">
        {/* Overlay - Fade Animation */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={handleClose}
        />

        {/* Modal Card - Slide Up Animation */}
        <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`
            relative w-full h-[98vh] md:h-auto md:max-h-[90vh] md:max-w-4xl 
            bg-[#181818] rounded-t-xl md:rounded-lg overflow-hidden shadow-2xl 
            flex flex-col ring-1 ring-white/10
            will-change-transform
            `}
        >
            {/* Close Button */}
            <button 
            onClick={(e) => {
                e.stopPropagation();
                handleClose();
            }}
            className={`
                absolute z-50 h-8 w-8 md:h-10 md:w-10 rounded-full bg-black/60 backdrop-blur-md
                grid place-items-center hover:bg-[#2a2a2a] border border-white/10
                transition-all duration-300
                top-16 right-4 md:top-4 md:right-4
                hover:scale-110 active:scale-95
            `}
            >
            <X className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </button>

            {/* Scroll Container */}
            <div ref={scrollRef} className="overflow-y-auto overflow-x-hidden h-full no-scrollbar overscroll-contain pb-safe bg-[#181818]">
                
                {/* HERO IMAGE AREA */}
                <div className="relative w-full bg-[#181818]">
                    <div className="block md:hidden relative w-full aspect-[2/3] overflow-hidden bg-[#222]">
                        <img 
                            src={movie.smallPosterUrl || movie.posterUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <img 
                            src={movie.posterUrl}
                            alt={movie.title}
                            className={`
                                absolute inset-0 w-full h-full object-cover z-10
                                transition-opacity duration-700 ease-in-out
                                ${isHighResLoaded ? 'opacity-100' : 'opacity-0'}
                            `}
                            loading="eager"
                            decoding="async"
                            onLoad={() => setIsHighResLoaded(true)}
                        />
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#181818] via-[#181818]/60 to-transparent z-20 pointer-events-none"></div>
                    </div>

                    <div className="hidden md:block relative w-full h-[55vh] overflow-hidden bg-[#222]">
                        <img 
                            src={movie.smallPosterUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover object-top"
                        />
                        <img 
                            src={movie.bannerUrl || movie.posterUrl}
                            alt={movie.title}
                            className={`
                                absolute inset-0 w-full h-full object-cover object-top z-10
                                transition-opacity duration-700 ease-in-out
                                ${isHighResLoaded ? 'opacity-100' : 'opacity-0'}
                            `}
                            onLoad={() => setIsHighResLoaded(true)}
                        />
                        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#181818] via-[#181818]/80 to-transparent z-20 pointer-events-none"></div>
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="relative z-20 px-4 md:px-10 pb-8 space-y-6 pt-0 md:-mt-32">

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                    >
                        {/* Metadata Row */}
                        <div className="flex items-center justify-center gap-3 text-sm font-medium text-gray-300 drop-shadow-md">
                            <span className="text-[#46d369] font-bold">{movie.match}% {t.match}</span>
                            <span>{movie.year}</span>
                            <span className="bg-[#404040] text-white px-1.5 py-0.5 rounded-[2px] text-xs border border-white/20 uppercase">{movie.rating}</span>
                            {duration && duration !== 'N/A' && (
                                <span>{duration}</span>
                            )}
                            <span className="border border-white/40 px-1 rounded-[2px] text-[10px] uppercase">HD</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handlePlayClick}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-bold rounded-[4px] hover:bg-white/90 active:scale-[0.98] transition shadow-xl"
                            >
                                <Play className="w-7 h-7 fill-black" />
                                <span className="text-lg font-bold">{t.play}</span>
                            </button>

                            <div className="grid grid-cols-4 gap-3">
                                <button 
                                    onClick={() => {
                                        Haptics.light();
                                        Audio.playClick();
                                        onToggleList?.(movie);
                                    }}
                                    className="relative flex items-center justify-center h-10 bg-[#2a2a2a] text-white/90 rounded-[4px] hover:bg-[#333] active:scale-[0.98] transition border border-white/10 overflow-hidden"
                                >
                                    <div className={`
                                        absolute inset-0 flex items-center justify-center 
                                        transition-all duration-300 ease-in-out
                                        ${isInList ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0'}
                                    `}>
                                        <Plus className="w-6 h-6" />
                                    </div>

                                    <div className={`
                                        absolute inset-0 flex items-center justify-center 
                                        transition-all duration-300 ease-in-out
                                        ${isInList ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'}
                                    `}>
                                        <Check className="w-6 h-6 text-[#E50914]" strokeWidth={3} />
                                    </div>
                                </button>
                                
                                <button 
                                    onClick={() => {
                                        Haptics.light();
                                        Audio.playClick();
                                        onToggleLike?.(movie);
                                    }}
                                    className="flex items-center justify-center h-10 bg-[#2a2a2a] text-white/90 rounded-[4px] hover:bg-[#333] active:scale-[0.98] transition border border-white/10"
                                >
                                    <ThumbsUp className={`w-5 h-5 ${isLiked ? 'text-white fill-white' : ''}`} />
                                </button>
                                
                                <button 
                                    onClick={() => {
                                        Haptics.light();
                                        Audio.playClick();
                                        onToggleDislike?.(movie);
                                    }}
                                    className="flex items-center justify-center h-10 bg-[#2a2a2a] text-white/90 rounded-[4px] hover:bg-[#333] active:scale-[0.98] transition border border-white/10"
                                >
                                    <ThumbsDown className={`w-5 h-5 ${isDisliked ? 'text-white fill-white' : ''}`} />
                                </button>
                                <button className="flex items-center justify-center h-10 bg-[#2a2a2a] text-white/90 rounded-[4px] hover:bg-[#333] active:scale-[0.98] transition border border-white/10">
                                    <Share2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        
                        <div className="flex gap-6 border-b border-white/20 mb-4 overflow-x-auto no-scrollbar">
                            <button 
                                onClick={() => handleTabChange('overview')}
                                className={`pb-3 text-sm md:text-base font-bold uppercase transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'text-white border-b-2 border-[#E50914]' : 'text-gray-400'}`}
                            >
                                {t.overview}
                            </button>
                            <button 
                                onClick={() => handleTabChange('trailers')}
                                className={`pb-3 text-sm md:text-base font-bold uppercase transition-colors whitespace-nowrap ${activeTab === 'trailers' ? 'text-white border-b-2 border-[#E50914]' : 'text-gray-400'}`}
                            >
                                {t.trailers}
                            </button>
                            <button 
                                onClick={() => handleTabChange('more_like_this')}
                                className={`pb-3 text-sm md:text-base font-bold uppercase transition-colors whitespace-nowrap ${activeTab === 'more_like_this' ? 'text-white border-b-2 border-[#E50914]' : 'text-gray-400'}`}
                            >
                                {t.moreLikeThis}
                            </button>
                        </div>

                        <div className="min-h-[200px]">
                            {activeTab === 'overview' && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        {tagline && (
                                            <p className="text-white/60 text-sm italic mb-2 font-medium">"{tagline}"</p>
                                        )}
                                        <p className="text-sm md:text-base leading-relaxed text-white">
                                            {movie.description}
                                        </p>
                                    </div>
                                    {cast.length > 0 && (
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold text-gray-400">{t.cast}</h3>
                                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                                {cast.map((actor) => (
                                                    <div key={actor.id} className="flex-shrink-0 w-20 flex flex-col items-center gap-1">
                                                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800 border border-white/10">
                                                            {actor.profilePath ? (
                                                                <img src={actor.profilePath} alt={actor.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">N/A</div>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-center text-gray-300 leading-tight line-clamp-2">{actor.name}</span>
                                                        <span className="text-[9px] text-center text-gray-500 leading-tight line-clamp-1">{actor.character}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-semibold text-gray-400">{t.genres}</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {movie.genre.map((g, idx) => (
                                                <span key={idx} className="text-xs px-2 py-1 bg-[#262626] rounded text-gray-200">
                                                    {g}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'trailers' && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-3"
                                >
                                    {videos.length > 0 ? (
                                        videos.map((video) => (
                                            <div 
                                                key={video.id} 
                                                className="group flex gap-3 bg-[#1f1f1f] rounded-md overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition border border-white/5"
                                                onClick={() => handleTrailerClick(video.key)}
                                            >
                                                <div className="relative w-32 md:w-40 aspect-video bg-black flex-shrink-0">
                                                    <img 
                                                        src={`https://img.youtube.com/vi/${video.key}/mqdefault.jpg`} 
                                                        alt={video.name}
                                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-8 h-8 rounded-full bg-black/60 border border-white/30 flex items-center justify-center">
                                                            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="py-2 pr-2 flex flex-col justify-center">
                                                    <h4 className="text-sm font-medium text-white line-clamp-2 leading-snug">{video.name}</h4>
                                                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                                        <Youtube className="w-3 h-3" />
                                                        <span>{video.type}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-10 text-center text-gray-500">
                                            {t.noTrailers}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'more_like_this' && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    {recommendations.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-2">
                                            {recommendations.map((recMovie) => (
                                                <div 
                                                    key={recMovie.id} 
                                                    className="aspect-[2/3] bg-[#222] rounded overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200"
                                                    onClick={() => handleRecommendationClick(recMovie)}
                                                >
                                                    <img 
                                                        src={recMovie.posterUrl} 
                                                        alt={recMovie.title} 
                                                        className="w-full h-full object-cover"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-10 text-center text-gray-500">
                                            {t.noRecommendations}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* --- TRAILER PLAYER OVERLAY --- */}
            <AnimatePresence>
                {playingTrailerKey && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[120] bg-black flex flex-col items-center justify-center"
                    >
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setPlayingTrailerKey(null);
                                Haptics.light();
                                Audio.playClick();
                            }}
                            className="absolute top-20 right-6 p-2 bg-[#1a1a1a] text-white rounded-full hover:bg-[#333] transition z-50 group border border-white/10"
                        >
                            <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        </button>

                        <div className="w-full max-w-5xl aspect-video px-0 md:px-10">
                            <iframe
                                src={`https://www.youtube.com/embed/${playingTrailerKey}?autoplay=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&fs=1&playsinline=1&origin=${encodeURIComponent(getYoutubeOrigin())}`}
                                title="YouTube video player"
                                className="w-full h-full shadow-2xl rounded-none md:rounded-lg"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
        </div>
    )}
    </AnimatePresence>
  );
};
