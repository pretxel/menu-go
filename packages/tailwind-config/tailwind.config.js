module.exports = {
  content: [
    '../../packages/ui/components/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#FAFAF5',
        ink: '#0F0F0F',
        bone: '#F2EFE3',
        tomato: '#FF3B2E',
        'tomato-dark': '#D62A1F',
        lime: '#D9F25C',
        'lime-dark': '#B5CC3F',
        mustard: '#FFC83D',
        sky: '#7BB7FF',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-display)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        brut: '4px 4px 0 0 #0F0F0F',
        'brut-sm': '2px 2px 0 0 #0F0F0F',
        'brut-lg': '6px 6px 0 0 #0F0F0F',
        'brut-xl': '10px 10px 0 0 #0F0F0F',
        'brut-tomato': '4px 4px 0 0 #FF3B2E',
        'brut-lime': '4px 4px 0 0 #D9F25C',
        'brut-press': '1px 1px 0 0 #0F0F0F',
      },
      borderWidth: {
        3: '3px',
      },
      keyframes: {
        sticker: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        slidein: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        sticker: 'sticker 3s ease-in-out infinite',
        slidein: 'slidein 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards',
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [],
};
