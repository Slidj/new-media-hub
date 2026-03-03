import React from 'react';

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = "aspect-[2/3]" }) => {
  return (
    <div className={`relative w-full h-full rounded-md overflow-hidden bg-[#181818] ${className}`}>
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
      
      {/* Content placeholders */}
      <div className="absolute bottom-0 left-0 w-full p-2 space-y-2">
        <div className="h-3 w-3/4 rounded bg-white/10"></div>
        <div className="h-2 w-1/2 rounded bg-white/10"></div>
      </div>
    </div>
  );
};