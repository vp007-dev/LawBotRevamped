/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        orax: {
          bg: '#0c0e14',
          surface: '#141721',
          card: '#161922',
          'card-hover': '#1b202c',
          'card-nested': '#11131a',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-subtle': 'rgba(255, 255, 255, 0.05)',
          'border-strong': 'rgba(255, 255, 255, 0.14)',
          purple: '#8b5cf6',
          'purple-light': '#a78bfa',
          'purple-glow': 'rgba(139, 92, 246, 0.2)',
          text: '#f1f5f9',
          muted: '#94a3b8',
          subtle: '#64748b'
        }
      },
      boxShadow: {
        'purple-sm': '0 1px 3px rgba(139, 92, 246, 0.2)',
        'purple-glow': '0 2px 10px rgba(139, 92, 246, 0.25)',
        'card-flat': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [],
}