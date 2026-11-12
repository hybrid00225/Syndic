import type { Config } from 'tailwindcss';

// Design System Syndic Alpha — couleurs pilotées par variables CSS (voir globals.css).
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        danger: 'hsl(var(--danger))',
        info: 'hsl(var(--info))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      // Trois courbures seulement : contrôles (md), surfaces (lg), pastilles (full).
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 7px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      // Échelle typographique (remplace les tailles arbitraires).
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        ui: ['0.8125rem', { lineHeight: '1.25rem' }],
      },
      // Deux niveaux de profondeur seulement.
      boxShadow: {
        soft: '0 1px 0 0 rgb(40 30 20 / 0.04)',
        lift: '0 1px 2px rgb(40 30 20 / 0.06), 0 12px 32px -8px rgb(40 30 20 / 0.18)',
      },
      keyframes: {
        'pop-in': {
          from: { opacity: '0', transform: 'scale(0.98)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'sheet-in': {
          from: { transform: 'translateX(24px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.14s ease-out both',
        'sheet-in': 'sheet-in 0.18s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
