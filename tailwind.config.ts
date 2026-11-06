import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // Evita que o reset global do Tailwind altere as telas CSS existentes.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        background: 'var(--card-bg)',
        foreground: 'var(--text-primary)',
        primary: { DEFAULT: 'var(--primary-color)', foreground: '#ffffff' },
        secondary: { DEFAULT: 'var(--bg-color)', foreground: 'var(--text-primary)' },
        destructive: { DEFAULT: 'var(--danger-color)', foreground: '#ffffff' },
        muted: { DEFAULT: 'var(--bg-color)', foreground: 'var(--text-secondary)' },
        accent: { DEFAULT: 'var(--bg-color)', foreground: 'var(--text-primary)' },
        border: 'var(--border-color)',
        input: 'var(--border-color)',
        ring: 'var(--primary-color)',
      },
      borderRadius: { lg: '0.5rem', md: '0.375rem', sm: '0.25rem' },
    },
  },
  plugins: [],
} satisfies Config
