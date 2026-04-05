/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        netflix: { red: '#E50914', dark: '#141414', gray: '#e5e5e5' }
      },
      fontFamily: { 
        sans: ['Inter', 'sans-serif'],
        bebas: ['"Bebas Neue"', 'sans-serif']
      },
      animation: { 
        'splash-zoom': 'splash-zoom 2.5s cubic-bezier(0.645, 0.045, 0.355, 1) forwards',
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in-bottom': 'slideInBottom 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'bell-ring': 'bell-ring 4s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite linear',
        'wiggle-periodic': 'wiggle-periodic 5s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        slideInBottom: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' }
        },
        'bell-ring': {
          '0%, 100%': { transform: 'rotate(0)' },
          '5%': { transform: 'rotate(15deg)' },
          '10%': { transform: 'rotate(-15deg)' },
          '15%': { transform: 'rotate(15deg)' },
          '20%': { transform: 'rotate(0)' }
        },
        'wiggle-periodic': {
          '0%, 80%, 100%': { transform: 'rotate(0deg)' },
          '85%': { transform: 'rotate(-15deg)' },
          '90%': { transform: 'rotate(15deg)' },
          '95%': { transform: 'rotate(-10deg)' }
        }
      },
      dropShadow: {
        'logo': '2px 2px 4px rgba(0, 0, 0, 0.5)'
      }
    }
  },
  plugins: [],
}
