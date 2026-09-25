/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FEEFC4',
        surface: '#FFF7DF',
        card: '#F1DEB6',
        border: '#E1C8A5',
        ink: '#780F0D',
        'ink-dark': '#5E0B0A',
        muted: '#8A5446',
        ok: '#4A7032',
        warn: '#8A6212',
      },
      fontFamily: {
        display: ['"Bodoni Moda"', 'serif'],
        label: ['"Josefin Sans"', 'sans-serif'],
        body: ['Montserrat', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '4px',
      },
    },
  },
  plugins: [],
}
