
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
  const t = translations[lang];

  useEffect(() => {
    const handleScroll = () => {
      // Logic: Show only when very close to top (less than 100px scrolled)
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

  return (
    <div 
      className={`
        fixed left-0 w-full z-50 px-4 md:px-12 flex gap-3 overflow-x-auto no-scrollbar
        transition-all duration-500 ease-in-out pointer-events-none
        ${isVisible ? 'top-[70px] opacity-100' : 'top-[20px] opacity-0'}
      `}
    >
        {/* We wrap buttons in a container that allows pointer events so we can click them even if the main container is pointer-events-none (hack for smooth fade out) */}
        <div className={`flex gap-3 pointer-events-auto ${!isVisible ? 'pointer-events-none' : ''}`}>
            {categories.map((cat, index) => (
                <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`
                        whitespace-nowrap px-4 py-1.5 rounded-[4px] text-sm font-bold
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
