import React from 'react';
import { RowProps } from '../types';

export const Row: React.FC<RowProps> = ({ title, movies, onMovieSelect }) => {
  return (
    <div className="space-y-2 md:space-y-4 px-4 md:px-12 my-6 md:my-8">
      <h2 className="text-lg md:text-2xl font-bold text-[#e5e5e5] hover:text-white transition duration-200 cursor-pointer">
        {title}
      </h2>
      
      {/* Grid Layout: 3 columns (vertical cards) as requested */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 md:grid-cols-4 lg:grid-cols-6">
        {movies.map((movie) => (
          <div 
            key={movie.id} 
            className="relative cursor-pointer transition-transform duration-200 hover:scale-105 aspect-[2/3]"
            onClick={() => onMovieSelect(movie)}
          >
            <img
              src={movie.posterUrl}
              className="rounded-md object-cover w-full h-full"
              alt={movie.title}
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
};