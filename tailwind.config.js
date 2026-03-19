/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ABC Diatype', 'system-ui', 'sans-serif'],
        mono: ['ABC Marfa Mono', 'Roboto Mono', 'monospace'],
      },
      letterSpacing: {
        'mono': '0.05em',
      },
      colors: {
        primary: '#009C55',
        black: '#000000',
        beige: '#EEF2EA',
        'light-blue': '#CCDBE2',
        gray: '#90928F',
        green: '#009C55',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],        // 12px
        'sm': ['0.8125rem', { lineHeight: '1.25rem' }],   // 13px
        'base': ['0.875rem', { lineHeight: '1.375rem' }], // 14px
        'lg': ['0.9375rem', { lineHeight: '1.375rem' }],  // 15px
        'xl': ['1rem', { lineHeight: '1.5rem' }],         // 16px
        '2xl': ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
        '3xl': ['1.5rem', { lineHeight: '2rem' }],        // 24px
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};