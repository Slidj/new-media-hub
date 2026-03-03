
import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Plus, Check, ThumbsUp, ThumbsDown, Share2, Youtube } from 'lucide-react';
import { Movie, Cast, Video } from '../types';
import { Language, translations } from '../utils/translations';
import { API } from '../services/tmdb';
import { Haptics } from '../utils/haptics';
import { Audio } from '../utils/audio';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';

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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  // Extended Content States
  const [cast, setCast] = useState<Cast[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Trailer Player State
  const [playingTrailerKey, setPlayingTrailerKey] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];
  const dragControls = useDragControls();

  const handleDragEnd = (event: any, info: PanInfo) => {
      if (info.offset.y > 100 || info.velocity.y > 500) {
          handleClose();
      }
  };

  useEffect(() => {
    if (movie) {
      // 1. Reset Everything
      setIsHighResLoaded(false);
      
      setDuration(null);
      setTagline(null);
      setLogoUrl(null);
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
              const [detailsData, castData, videoData, recData, fetchedLogo] = await Promise.all([
                  API.fetchMovieDetails(movie.id, movie.mediaType),
                  API.fetchCredits(movie.id, movie.mediaType),
                  API.fetchVideos(movie.id, movie.mediaType),
                  API.fetchRecommendations(movie.id, movie.mediaType, lang === 'uk' ? 'uk-UA' : lang === 'ru' ? 'ru-RU' : 'en-US'),
                  API.fetchMovieLogo(movie.id, movie.mediaType === 'tv')
              ]);

              if (!isMounted) return;

              if (movie.duration && movie.duration !== 'N/A') setDuration(movie.duration);
              else if (detailsData.duration) setDuration(detailsData.duration);

              if (detailsData.tagline) setTagline(detailsData.tagline);
              
              setLogoUrl(movie.logoUrl || fetchedLogo || null);
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

  const handleShare = () => {
      Haptics.medium();
      Audio.playClick();
      
      const shareUrl = `https://t.me/my_mediahub_bot/app?startapp=${movie?.id}`;
      const shareText = `${t.watchOn} "${movie?.title}"`;

      if (window.Telegram?.WebApp?.showPopup) {
           const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
           window.Telegram.WebApp.openTelegramLink(tgShareUrl);
      } else if (navigator.share) {
          navigator.share({
              title: movie?.title,
              text: shareText,
              url: shareUrl
          }).catch(console.error);
      } else {
          window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
      }
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
        <motion.div 
            key="modal-wrapper"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center pointer-events-auto"
        >
        {/* Overlay - Fade Animation */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-black/90"
            onClick={handleClose}
        />

        {/* Modal Card - Slide Up Animation */}
        <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="relative w-full h-[calc(100dvh-40px)] md:h-auto md:max-h-[90vh] md:max-w-4xl bg-[#181818] shadow-2xl ring-1 ring-white/10 rounded-t-3xl md:rounded-2xl overflow-hidden flex flex-col will-change-transform mt-auto md:mt-0"
        >
            {/* Drag Handle (Mobile) */}
            <div 
                className="absolute top-0 left-0 right-0 h-12 flex justify-center items-start pt-3 z-[60] md:hidden cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => dragControls.start(e)}
                style={{ touchAction: "none" }}
            >
                <div className="w-12 h-1.5 bg-white/40 rounded-full shadow-sm pointer-events-none"></div>
            </div>

            {/* Close Button */}
            <motion.button 
                initial={{ opacity: 0, scale: 0, rotate: -180 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, duration: 0.7, type: "spring", bounce: 0.4 }}
                onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                }}
                className="absolute z-50 h-8 w-8 md:h-10 md:w-10 rounded-full bg-black/80 hover:bg-[#2a2a2a] border border-white/10 grid place-items-center transition-colors duration-300 top-12 right-4 md:top-4 md:right-4 hover:scale-110 active:scale-95"
            >
                <X className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </motion.button>

            {/* Scroll Container */}
            <div ref={scrollRef} className="overflow-y-auto overflow-x-hidden h-full no-scrollbar overscroll-contain pb-safe bg-[#181818]">
                
                {/* HERO IMAGE AREA */}
                <div className="relative w-full bg-[#181818]">
                    <div className="block md:hidden relative w-full aspect-video overflow-hidden bg-[#222]">
                        {/* Low Res Placeholder (Blurry) */}
                        <img 
                            src={movie.smallPosterUrl}
                            alt=""
                            className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-700 ${isHighResLoaded ? 'opacity-0' : 'opacity-100'} blur-sm scale-105`}
                        />
                        
                        {/* High Res Image (Fade In) */}
                        <img 
                            src={movie.bannerUrl || movie.posterUrl}
                            alt={movie.title}
                            className={`absolute inset-0 w-full h-full object-cover object-top z-10 transition-opacity duration-700 ${isHighResLoaded ? 'opacity-100' : 'opacity-0'}`}
                            loading="eager"
                            decoding="async"
                            onLoad={() => setIsHighResLoaded(true)}
                        />
                        
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#181818] via-[#181818]/80 to-transparent z-20 pointer-events-none"></div>
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
                <motion.div 
                    className="relative z-20 px-4 md:px-10 pb-8 space-y-6 pt-4 md:pt-0 md:-mt-32"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: {
                                staggerChildren: 0.1,
                                delayChildren: 0.3
                            }
                        }
                    }}
                >

                    {/* Title / Logo */}
                    <motion.div 
                        variants={{
                            hidden: { opacity: 0, scale: 0.95, y: 20 },
                            visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                        }}
                        className="flex justify-center items-center w-full min-h-[60px]"
                    >
                        {logoUrl ? (
                            <img 
                                src={logoUrl} 
                                alt={movie.title} 
                                className="max-h-20 md:max-h-28 max-w-[80%] object-contain drop-shadow-2xl"
                                loading="lazy"
                            />
                        ) : (
                            <h2 className="text-3xl md:text-4xl font-black text-white text-center drop-shadow-lg">
                                {movie.title}
                            </h2>
                        )}
                    </motion.div>

                    {/* Metadata Row */}
                    <motion.div 
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                        }}
                        className="flex items-center justify-center gap-3 text-sm font-medium text-gray-300 drop-shadow-md"
                    >
                        <span className="text-[#46d369] font-bold">{movie.match}% {t.match}</span>
                        <span>{movie.year}</span>
                        <span className="bg-[#404040] text-white px-1.5 py-0.5 rounded-[2px] text-xs border border-white/20 uppercase">{movie.rating}</span>
                        {duration && duration !== 'N/A' && (
                            <span>{duration}</span>
                        )}
                        <span className="border border-white/40 px-1 rounded-[2px] text-[10px] uppercase">HD</span>
                    </motion.div>

                    {/* Play Button */}
                    <motion.div 
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                        }}
                    >
                        <button 
                            onClick={handlePlayClick}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold rounded-[4px] active:scale-[0.98] transition shadow-xl bg-white text-black hover:bg-white/90"
                        >
                            <Play className="w-7 h-7 fill-black" />
                            <span className="text-lg font-bold">{t.play}</span>
                        </button>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div 
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                        }}
                        className="grid grid-cols-4 gap-3"
                    >
                        <button 
                            onClick={() => {
                                Haptics.light();
                                Audio.playClick();
                                onToggleList?.(movie);
                            }}
                            className="relative flex items-center justify-center h-10 rounded-[4px] active:scale-[0.98] transition border overflow-hidden bg-[#2a2a2a] text-white/90 hover:bg-[#333] border-white/10"
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
                            className="flex items-center justify-center h-10 rounded-[4px] active:scale-[0.98] transition border bg-[#2a2a2a] text-white/90 hover:bg-[#333] border-white/10"
                        >
                            <ThumbsUp className={`w-5 h-5 ${isLiked ? 'text-white fill-white' : ''}`} />
                        </button>
                        
                        <button 
                            onClick={() => {
                                Haptics.light();
                                Audio.playClick();
                                onToggleDislike?.(movie);
                            }}
                            className="flex items-center justify-center h-10 rounded-[4px] active:scale-[0.98] transition border bg-[#2a2a2a] text-white/90 hover:bg-[#333] border-white/10"
                        >
                            <ThumbsDown className={`w-5 h-5 ${isDisliked ? 'text-white fill-white' : ''}`} />
                        </button>
                        <button 
                            onClick={handleShare}
                            className="flex items-center justify-center h-10 rounded-[4px] active:scale-[0.98] transition border bg-[#2a2a2a] text-white/90 hover:bg-[#333] border-white/10"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                    </motion.div>

                    {/* Tabs & Content */}
                    <motion.div 
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                        }}
                    >
                        
                        <div className="flex gap-6 border-b border-white/20 mb-4 overflow-x-auto no-scrollbar">
                            <button 
                                onClick={() => handleTabChange('overview')}
                                className={`pb-3 text-sm md:text-base font-bold uppercase transition-colors whitespace-nowrap ${
                                    activeTab === 'overview' 
                                    ? 'text-white border-b-2 border-[#E50914]' 
                                    : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {t.overview}
                            </button>
                            <button 
                                onClick={() => handleTabChange('trailers')}
                                className={`pb-3 text-sm md:text-base font-bold uppercase transition-colors whitespace-nowrap ${
                                    activeTab === 'trailers' 
                                    ? 'text-white border-b-2 border-[#E50914]' 
                                    : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {t.trailers}
                            </button>
                            <button 
                                onClick={() => handleTabChange('more_like_this')}
                                className={`pb-3 text-sm md:text-base font-bold uppercase transition-colors whitespace-nowrap ${
                                    activeTab === 'more_like_this' 
                                    ? 'text-white border-b-2 border-[#E50914]' 
                                    : 'text-gray-400 hover:text-white'
                                }`}
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
                </motion.div>
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
        </motion.div>
    )}
    </AnimatePresence>
  );
};
