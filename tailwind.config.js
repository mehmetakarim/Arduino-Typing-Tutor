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
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Yüzeyler — CSS değişkenlerine bağlı, iki temada otomatik
        base:     'var(--bg-base)',
        surface:  'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        border:   'var(--bg-border)',
        muted:    'var(--bg-muted)',
        // Metin
        primary:   'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        subtle:    'var(--text-muted)',
        // Accent'ler
        'accent-cyan':      'var(--accent-cyan)',
        'accent-cyan-soft': 'var(--accent-cyan-soft)',
        'accent-cyan-deep': 'var(--accent-cyan-deep)',
        'accent-lime':      'var(--accent-lime)',
        'accent-amber':     'var(--accent-amber)',
        'accent-purple':    'var(--accent-purple)',
        'accent-orange':    'var(--accent-orange)',
        'accent-red':       'var(--accent-red)',
      },
      boxShadow: {
        'glow-cyan':   'var(--glow-cyan)',
        'glow-lime':   'var(--glow-lime)',
        'glow-amber':  'var(--glow-amber)',
        'glow-purple': 'var(--glow-purple)',
        card:          'var(--shadow-card)',
      },
      borderRadius: {
        'card': '20px',
        'panel': '16px',
        'control': '12px',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 4px 2px currentColor' },
          '50%': { boxShadow: '0 0 12px 6px currentColor' },
        },
        'key-press': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        wiggle: 'wiggle 0.6s ease-in-out infinite',
        glow: 'glow 1s ease-in-out infinite',
        'key-press': 'key-press 100ms ease-in-out',
      },
    },
  },
  plugins: [],
}
