/** @type {import('tailwindcss').Config} */

// All theme colors resolve through CSS variables (see globals.css) so the
// light/dark toggle re-themes the whole app without touching components.
// NOTE: `white` is remapped to theme foreground — text-white becomes ink
// text in light mode, and white veils (bg-white/5, border-white/10) become
// ink veils. Plain `black` overlays are left untouched.
const v = (name) => `rgb(var(${name}) / <alpha-value>)`;

module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        white: v('--white'),
        ink: {
          950: v('--ink-950'),
          900: v('--ink-900'),
          800: v('--ink-800'),
          700: v('--ink-700'),
          600: v('--ink-600'),
        },
        brand: {
          DEFAULT: v('--brand'),
          light: v('--brand-light'),
          dark: v('--brand-dark'),
          deep: v('--brand-deep'),
        },
        gold: {
          DEFAULT: v('--gold'),
          light: v('--gold-light'),
        },
        mist: {
          DEFAULT: v('--mist'),
          dark: v('--mist-dark'),
        },
        // Backwards-compat with the old Spotify-style tokens
        spotify: {
          bg: v('--ink-950'),
          'bg-secondary': v('--ink-900'),
          'bg-tertiary': v('--ink-700'),
          'surface-hover': v('--ink-600'),
          accent: v('--brand'),
          'accent-hover': v('--brand-light'),
          text: v('--white'),
          'text-secondary': v('--mist'),
          'text-muted': v('--mist-dark'),
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
