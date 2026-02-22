import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Play, User } from 'lucide-react';
import { Movie, Activity } from '../types';

interface NowWatchingRowProps {
    title: string;
    activities: Activity[];
    onMovieClick: (movie: Movie) => void;
}

export const NowWatchingRow: React.FC<NowWatchingRowProps> = ({ title, activities, onMovieClick }) => {
    const rowRef = useRef<HTMLDivElement>(null);

    if (activities.length === 0) return null;

    // Deduplicate activities by movieId to avoid showing the same movie multiple times if multiple users are watching it
    // Or maybe show them all? The user said "collect these movements".
    // Let's show the latest 10 unique activities.
    const uniqueActivities = activities.reduce((acc, current) => {
        const x = acc.find(item => item.movieId === current.movieId);
        if (!x) {
            return acc.concat([current]);
        } else {
            return acc;
        }
    }, [] as Activity[]);

    return (
        <div className="mb-8 px-4 md:px-12">
            <div className="flex items-center justify-between mb-4 group cursor-pointer">
                <h2 className="text-lg md:text-xl font-bold text-white group-hover:text-[#E50914] transition-colors flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    {title}
                </h2>
            </div>

            <div className="relative group">
                <div 
                    ref={rowRef}
                    className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {uniqueActivities.map((activity, index) => (
                        <motion.div 
                            key={`${activity.id}-${index}`}
                            className="flex-none w-[280px] md:w-[320px] snap-start"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                        >
                            <div 
                                className="relative aspect-video rounded-lg overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-10 hover:shadow-xl hover:shadow-black/50 border border-white/10 group/card"
                                onClick={() => {
                                    // Construct a minimal Movie object to pass to the handler
                                    // We might need to fetch full details later, but for now this is enough to open modal/player
                                    const movie: Movie = {
                                        id: activity.movieId,
                                        title: activity.movieTitle,
                                        posterUrl: activity.moviePoster,
                                        bannerUrl: activity.movieBackdrop,
                                        description: '', // Will be fetched
                                        rating: 'N/A',
                                        year: 0,
                                        genre: [],
                                        mediaType: activity.mediaType || 'movie', 
                                        match: 0,
                                        smallPosterUrl: activity.moviePoster,
                                        duration: ''
                                    };
                                    onMovieClick(movie);
                                }}
                            >
                                <img 
                                    src={activity.movieBackdrop || activity.moviePoster} 
                                    alt={activity.movieTitle}
                                    className="w-full h-full object-cover opacity-80 group-hover/card:opacity-100 transition-opacity duration-500"
                                    loading="lazy"
                                />
                                
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                                {/* User Info Overlay */}
                                <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
                                    <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-700">
                                        {activity.userPhoto ? (
                                            <img src={activity.userPhoto} alt={activity.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-3 h-3 text-gray-400 m-1" />
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-200 font-medium truncate max-w-[80px]">
                                        {activity.username}
                                    </span>
                                </div>

                                {/* Movie Title */}
                                <div className="absolute bottom-3 left-3 right-3">
                                    <h3 className="text-sm md:text-base font-bold text-white truncate drop-shadow-md">
                                        {activity.movieTitle}
                                    </h3>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                                        <span className="text-[#E50914] font-bold uppercase tracking-wider">
                                            {activity.action === 'watching' ? 'Watching now' : 'Viewing'}
                                        </span>
                                    </div>
                                </div>

                                {/* Play Icon Overlay on Hover */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <Play className="w-5 h-5 text-white fill-white" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
                
                {/* Fade effect on the right to indicate scroll */}
                <div className="absolute top-0 right-0 h-full w-12 bg-gradient-to-l from-black to-transparent pointer-events-none" />
            </div>
        </div>
    );
};
