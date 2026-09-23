/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'document-vellum': '#F3F1EC',
        'pharma-deep': '#0D192B',
        'seal-emerald': '#134E35',
        'quarantine-crimson': '#881337',
        'manifest-slate': '#3A4B5C',
        'stamp-gold': '#D4AF37',
        clinical: {
          50: '#f4f6fb',
          100: '#e2e8f5',
          200: '#c5d2eb',
          500: '#1e3a8a',
          800: '#0d192b',
          900: '#060d17',
        },
        genuine: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#10b981',
          600: '#134e35',
          700: '#0d3826',
          900: '#051910',
        },
        suspect: {
          50: '#fff1f2',
          100: '#ffe4e6',
          500: '#f43f5e',
          600: '#881337',
          700: '#4c0519',
          900: '#26020c',
        },
        paper: '#ffffff',
        canvas: '#F3F1EC',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
        display: ['Plus Jakarta Sans', 'Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        'doc': '0 1px 3px 0 rgba(13, 25, 43, 0.06), 0 1px 2px 0 rgba(13, 25, 43, 0.04)',
        'certificate': '0 4px 20px -2px rgba(13, 25, 43, 0.08), 0 0 0 1px rgba(13, 25, 43, 0.12)',
        'stamp': '0 0 0 2px rgba(19, 78, 53, 0.2), inset 0 0 8px rgba(19, 78, 53, 0.1)',
      }
    },
  },
  plugins: [],
}
