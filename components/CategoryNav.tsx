
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
    // Більш надійна перевірка наявності Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      setIsTelegram(true);
    }

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
        ${!isTelegram ? 'top-[70px] md:top-[90px]' : ''}
      `}
      // Для Telegram встановлюємо значно більший відступ (160px), 
      // оскільки логотип зміщено вниз через mt-24 (96px) + висота логотипа.
      style={isTelegram ? { top: 'calc(160px + env(safe-area-inset-top))' } : undefined}
    >
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-2 w-full items-center justify-center">
            {categories.map((cat, index) => (
                <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`
                        opacity-0 animate-fade-in-up
                        whitespace-nowrap px-4 py-1.5 rounded-[4px] text-sm font-bold flex-shrink-0
                        transition-all duration-300 active:scale-95 border backdrop-blur-md shadow-lg
                        ${activeCategory === cat.id 
                            ? 'bg-white text-black border-white' 
                            : 'bg-black/40 text-white border-white/20 hover:bg-black/60'
                        }
                    `}
                    style={{ 
                        animationDelay: `${index * 100 + 300}ms`,
                        animationFillMode: 'forwards'
                    }}
                >
                    {cat.label}
                </button>
            ))}
        </div>
    </div>
  );
};
