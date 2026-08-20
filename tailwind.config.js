/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: 'var(--surface, #0b0d12)',
          card: 'var(--surface-card, #131722)',
          raised: 'var(--surface-raised, #1a1f2c)',
        },
        accent: {
          DEFAULT: 'var(--accent, #8b5cf6)',
          soft: 'var(--accent-soft, #a78bfa)',
          dim: 'var(--accent-dim, rgba(139,92,246,0.15))',
        },
      },
      boxShadow: {
        glow: '0 0 24px 0 var(--accent-dim, rgba(139,92,246,0.35))',
        card: '0 8px 32px rgba(0,0,0,0.35)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        'float-slow': 'float 8s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
