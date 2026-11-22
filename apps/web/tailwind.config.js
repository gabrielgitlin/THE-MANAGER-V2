/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Roboto Mono', 'SF Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        none: '0',
        sm:   '0',
        DEFAULT: '0',
        md:   '0',
        lg:   '0',
        xl:   '0',
        '2xl': '0',
        '3xl': '0',
        full: '9999px',
      },
      colors: {
        // Surfaces (dark hierarchy)
        bg: '#0c0c0c',
        surface: {
          DEFAULT: '#141414',
          2: '#1a1a1a',
          3: '#222222',
          4: '#2a2a2a',
        },
        // Borders
        border: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          2: 'rgba(255,255,255,0.10)',
          3: 'rgba(255,255,255,0.15)',
        },
        // Text hierarchy
        t1: '#ffffff',
        t2: '#cccccc',
        t3: '#999999',
        t4: 'rgba(255,255,255,0.08)',
        // Brand accent — The Manager official green
        brand: {
          1: '#009C55',
          2: '#007A43',
          3: '#005C32',
        },
        // Status colors
        status: {
          green: '#009C55',
          'green-bg': 'rgba(0,156,85,0.08)',
          yellow: '#DDAA44',
          'yellow-bg': 'rgba(221,170,68,0.08)',
          orange: '#E08A3C',
          'orange-bg': 'rgba(224,138,60,0.08)',
          red: '#DD5555',
          'red-bg': 'rgba(221,85,85,0.08)',
        },
        // Official brand palette (Brandbook 2025)
        'palette-black':     '#000000', // Pantone Black U
        'palette-blue-gray': '#ccdbe2', // Pantone 643 U
        'palette-cream':     '#eef2ea', // Pantone 9043 U
        'palette-gray':      '#90928f', // Pantone 7539 U
        'palette-green':     '#009c55', // Pantone 7479 U
        // Legacy aliases for compatibility
        primary: '#009C55',
        charcoal: '#ffffff',
      },
      fontSize: {
        'kpi': ['24px', { lineHeight: '1.1', fontWeight: '300' }],
        'kpi-sm': ['22px', { lineHeight: '1.1', fontWeight: '300' }],
        'body': ['14px', { lineHeight: '1.45' }],
        'data': ['13px', { lineHeight: '1.45' }],
        'nav': ['12px', { lineHeight: '1', fontWeight: '500', letterSpacing: '0.05em' }],
        'section': ['12px', { lineHeight: '1', fontWeight: '600', letterSpacing: '0.08em' }],
        'chart-title': ['11px', { lineHeight: '1', fontWeight: '600', letterSpacing: '0.05em' }],
        'micro': ['11px', { lineHeight: '1.4' }],
        'label': ['10px', { lineHeight: '1', fontWeight: '600', letterSpacing: '0.05em' }],
        'tiny': ['9px', { lineHeight: '1' }],
        // Standard sizes
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.8125rem', { lineHeight: '1.25rem' }],
        'base': ['0.875rem', { lineHeight: '1.375rem' }],
        'lg': ['0.9375rem', { lineHeight: '1.375rem' }],
        'xl': ['1rem', { lineHeight: '1.5rem' }],
        '2xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '3xl': ['1.5rem', { lineHeight: '2rem' }],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({ strategy: 'class' }),
  ],
};
