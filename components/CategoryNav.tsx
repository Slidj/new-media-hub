
import React, { useState, useEffect } from 'react';
import { Language, translations } from '../utils/translations';

export type Category = 'trending' | 'movies' | 'tv' | 'cartoons';

interface CategoryNavProps {
  lang: Language;
  activeCategory: Category;
  onSelectCategory: (category: Category) => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({ lang, activeCategory, onSelectCategory }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isTelegram, setIsTelegram] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    // Detect Telegram environment to adjust spacing
    if (window.Telegram?.WebApp?.initData) {
      setIsTelegram(true);
    }

    const handleScroll = () => {
      // Logic: Show only when very close to top (less than 80px scrolled)
      // Otherwise hide to give more screen space for content
      const scrollTop = window.scrollY;
      setIsVisible(scrollTop < 80);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const categories: { id: Category; label: string }[] = [
    { id: 'trending', label: t.trending },
    { id: 'movies', label: t.movies },
    { id: 'tv', label: t.tvShows },
    { id: 'cartoons', label: t.cartoons },
  ];

  // Dynamic positioning logic
  // For Telegram: Header has huge mt-24 (96px) + content (~40px) + mb-4 (16px) ~= 152px offset needed
  // We place it at 140px to sit nicely below the logo area.
  const telegramTop = isVisible ? 'top-[140px]' : 'top-[90px]';
  
  // For Web: Header is ~70px height total
  const webTop = isVisible ? 'top-[70px]' : 'top-[20px]';

  const topClass = isTelegram ? telegramTop : webTop;

  return (
    <div 
      className={`
        fixed left-0 w-full z-50 px-3 md:px-12 flex justify-start md:justify-start
        transition-all duration-500 ease-in-out pointer-events-none
        ${topClass}
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
        {/* Scrollable container with pointer events enabled */}
        <div className={`flex gap-2 pointer-events-auto overflow-x-auto no-scrollbar pb-2 w-full ${!isVisible ? 'pointer-events-none' : ''}`}>
            {categories.map((cat, index) => (
                <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`
                        whitespace-nowrap px-3 py-1.5 rounded-[4px] text-xs md:text-sm font-bold flex-shrink-0
                        transition-all duration-300 active:scale-95 shadow-lg
                        opacity-0 animate-slide-in-left
                        ${activeCategory === cat.id 
                            ? 'bg-white text-black' 
                            : 'bg-black/60 text-white hover:bg-black/80 backdrop-blur-md border border-white/20'
                        }
                    `}
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    {cat.label}
                </button>
            ))}
        </div>
    </div>
  );
};
