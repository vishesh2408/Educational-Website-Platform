/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  // Use class strategy and support the app's `.dark-theme` class from ThemeContext.
  darkMode: ['class', '.dark-theme'],
  theme: {
    container: {
      padding: '0rem',
    },
    extend: {
      keyframes: {
        move: {
          '0%, 100%': { transform: 'translate(-30px, -30px)' },
          '25%': { transform: 'translate(30px, -30px)' },
          '50%': { transform: 'translate(30px, 30px)' },
          '75%': { transform: 'translate(-30px, 30px)' },
        },
        'pulse-glow': {
          '0%, 100%': {
            'box-shadow': '0 0 15px rgba(20, 184, 166, 0.15)',
            'border-color': 'rgba(20, 184, 166, 0.4)',
          },
          '50%': {
            'box-shadow': '0 0 25px rgba(20, 184, 166, 0.3)',
            'border-color': 'rgba(20, 184, 166, 0.7)',
          },
        },
        'solution-glow': {
          '0%, 100%': {
            'box-shadow': '0 0 20px rgba(16, 185, 129, 0.1)',
            'border-color': 'rgba(16, 185, 129, 0.3)',
          },
          '50%': {
            'box-shadow': '0 0 30px rgba(16, 185, 129, 0.25)',
            'border-color': 'rgba(16, 185, 129, 0.6)',
          },
        },
        'slide-down': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'heart-pop': {
          '0%': { transform: 'scale(0) rotate(-15deg)', opacity: '0' },
          '50%': { transform: 'scale(1.4) rotate(0deg)', opacity: '0.95' },
          '70%': { transform: 'scale(1.1) rotate(5deg)', opacity: '0.95' },
          '100%': { transform: 'scale(0) rotate(0deg)', opacity: '0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        move: 'move 4s infinite',
        'pulse-glow': 'pulse-glow 4s infinite ease-in-out',
        'solution-glow': 'solution-glow 4s infinite ease-in-out',
        'slide-down': 'slide-down 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'heart-pop': 'heart-pop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'fade-in-up': 'fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'scale-in': 'scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      colors: {
        'color-primary': '#1F9D8D',
        // Override emerald 50 to match requested color f0fdfa
        emerald: {
          50: '#f0fdfa'
        },
        'color-primary-dark': '#167468',
        'color-secondary': '#E2E8F0',
        'color-text-light': '#4B5563',
        'color-text-dark': '#E5E7EB',
        'color-card-bg-light': '#ffffff',
        'color-card-bg-dark': '#1F2937',
        'color-border-dark': '#374151',
        'color-search-bg-light': '#ffffff',
        'color-search-bg-dark': '#374151',
        'color-search-border': '#1F9D8D',
      },
    },
  },
  plugins: [],
};

