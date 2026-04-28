/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        card: {
          'dark-blue': '#1a3a5c',
          blue: '#2563eb',
          white: '#f8fafc',
          yellow: '#eab308',
          orange: '#f97316',
          red: '#ef4444',
          back: '#166534',
        },
      },
      fontFamily: {
        game: ['"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
