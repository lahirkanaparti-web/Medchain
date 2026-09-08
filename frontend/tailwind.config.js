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
        trust: {
          50: '#f0f7f9',
          100: '#e0eff3',
          500: '#0F4C5C',
          600: '#0c3d4a',
          700: '#082d37',
          900: '#04171d',
        },
        genuine: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#059669',
          600: '#047857',
        },
        suspect: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#dc2626',
          600: '#b91c1c',
        }
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace']
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(15, 76, 92, 0.06), 0 2px 6px -1px rgba(15, 76, 92, 0.04)',
        'soft-lg': '0 10px 30px -4px rgba(15, 76, 92, 0.08), 0 4px 12px -2px rgba(15, 76, 92, 0.04)',
        'trust-glow': '0 0 25px -5px rgba(15, 76, 92, 0.25)',
      }
    },
  },
  plugins: [],
}
