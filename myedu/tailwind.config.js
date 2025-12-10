/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  // Use class strategy and support the app's `.dark-theme` class from ThemeContext.
  darkMode: ['class', '.dark-theme'],
  theme: {
    extend: {
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

