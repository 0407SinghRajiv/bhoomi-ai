/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'Sora', 'Manrope', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      colors: {
        bhoomi: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          cardHover: '#F1F5F9',
          border: '#E2E8F0',
          borderDark: '#CBD5E1',
          primary: '#2563EB',
          primaryHover: '#1D4ED8',
          indigo: '#4F46E5',
          indigoHover: '#4338CA',
          accent: '#0284C7',
          success: '#059669',
          warning: '#D97706',
          danger: '#DC2626',
          muted: '#64748B',
          textMuted: '#64748B',
          textDark: '#0F172A',
          textBody: '#334155',
        }
      },
    },
  },
  plugins: [],
}
