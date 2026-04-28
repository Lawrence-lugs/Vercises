/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:       '#6B0D1A',
        'primary-hover': '#A52033',
        surface:       '#f8f9fa',
        muted:         '#616161',
        border:        '#dee2e6',
      },
      fontFamily: {
        sans: ['"Source Sans 3"', '"Source Sans Pro"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"Cascadia Code"', '"Fira Mono"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
