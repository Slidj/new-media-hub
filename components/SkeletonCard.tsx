import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-[#181818]">
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
      
      {/* Content placeholders */}
      <div className="absolute bottom-0 left-0 w-full p-2 space-y-2">
        <div className="h-3 w-3/4 bg-white/10 rounded"></div>
        <div className="h-2 w-1/2 bg-white/10 rounded"></div>
      </div>
    </div>
  );
};