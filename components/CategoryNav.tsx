
import React, { useState, useEffect } from 'react';
import { Language, translations } from '../utils/translations';
import { Haptics } from '../utils/haptics';

export type Category = 'trending' | 'movies' | 'tv' | 'cartoons';

interface CategoryNavProps {
  lang: Language;
  activeCategory: Category;
  onSelectCategory: (category: Category) => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({ lang, activeCategory, onSelectCategory }) => {
  const [isVisible, setIsVisible] = useState(true);
  
  const t = translations[lang];

  useEffect(() => {
    const handleScroll = () => {
      // Ховаємо категорії, якщо проскролили більше 50px
      if (window.scrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCategoryClick = (id: Category) => {
      Haptics.selection(); // Subtle tick
      onSelectCategory(id);
  };

  const categories: { id: Category; label: string }[] = [
    { id: 'trending', label: t.trending },
    { id: 'movies', label: t.movies },
    { id: 'tv', label: t.tvShows },
    { id: 'cartoons', label: t.cartoons },
  ];

  return (
    <div 
      className={`
        fixed left-0 w-full z-40
        transition-all duration-500 ease-in-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}
      `}
      style={{ top: 'calc(135px + env(safe-area-inset-top))' }}
    >
        {/* Зовнішній контейнер для центрування */}
        <div className="flex justify-center w-full px-2">
            {/* Внутрішній контейнер */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-full items-center py-1">
                {categories.map((cat, index) => (
                    <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat.id)}
                        className={`
                            opacity-0 animate-fade-in-up
                            whitespace-nowrap px-3 py-1.5 rounded-[4px] text-xs md:text-sm font-bold flex-shrink-0
                            transition-all duration-300 active:scale-95 border backdrop-blur-md shadow-lg
                            ${activeCategory === cat.id 
                                ? 'bg-white text-black border-white' 
                                : 'bg-black/40 text-white border-white/20 hover:bg-black/60'
                            }
                        `}
                        style={{ 
                            animationDelay: `${index * 50}ms`,
                            animationFillMode: 'forwards'
                        }}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>
        </div>
    </div>
  );
};
