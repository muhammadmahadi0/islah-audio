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
        ink: {
          950: '#060D0A',
          900: '#0A1511',
          800: '#0E1F18',
          700: '#14291F',
          600: '#1C382A',
        },
        brand: {
          DEFAULT: '#10B981',
          light: '#34D399',
          dark: '#059669',
          deep: '#064E3B',
        },
        gold: {
          DEFAULT: '#C9A227',
          light: '#E7C55A',
          dark: '#9A7B1A',
        },
        mist: {
          DEFAULT: '#9DB3A8',
          dark: '#647C71',
        },
        // Backwards-compat with the old Spotify-style tokens
        spotify: {
          bg: '#060D0A',
          'bg-secondary': '#0A1511',
          'bg-tertiary': '#14291F',
          'surface-hover': '#1C382A',
          accent: '#10B981',
          'accent-hover': '#34D399',
          text: '#FFFFFF',
          'text-secondary': '#9DB3A8',
          'text-muted': '#647C71',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Noto Sans Bengali"',
          'sans-serif',
        ],
      },
      boxShadow: {
        glow: '0 0 24px rgba(16, 185, 129, 0.35)',
        'glow-lg': '0 8px 48px rgba(16, 185, 129, 0.35)',
        card: '0 8px 32px rgba(0, 0, 0, 0.45)',
        gold: '0 0 20px rgba(201, 162, 39, 0.30)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        eq: {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s linear infinite',
        'fade-up': 'fade-up 0.5s ease-out both',
      },
    },
  },
  plugins: [],
};
