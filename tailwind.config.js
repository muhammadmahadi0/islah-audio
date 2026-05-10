/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        spotify: {
          bg: '#121212',
          'bg-secondary': '#181818',
          'bg-tertiary': '#282828',
          'surface-hover': '#3E3E3E',
          accent: '#1DB954',
          'accent-hover': '#1ED760',
          text: '#FFFFFF',
          'text-secondary': '#B3B3B3',
          'text-muted': '#727272',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};