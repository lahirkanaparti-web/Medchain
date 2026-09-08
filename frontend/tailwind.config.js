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
        clinical: {
          50: '#f4f6fb',
          100: '#e2e8f5',
          200: '#c5d2eb',
          500: '#1e3a8a',
          800: '#0f1e36',
          900: '#0a1424',
        },
        genuine: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#10b981',
          600: '#05603a',
          700: '#044d2e',
          900: '#022c19',
        },
        suspect: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#991b1b',
          700: '#7f1d1d',
          900: '#450a0a',
        },
        paper: '#ffffff',
        canvas: '#f8fafc',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'doc': '0 1px 3px 0 rgba(15, 30, 54, 0.05)',
        'stamp': '0 0 0 1px rgba(15, 30, 54, 0.1), 0 4px 12px rgba(15, 30, 54, 0.08)',
      }
    },
  },
  plugins: [],
}
