/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // BrewPOS brand palette — warm coffee tones
        brew: {
          50:  '#fdf8f3',
          100: '#f9eddf',
          200: '#f1d9bc',
          300: '#e6be90',
          400: '#d89d60',
          500: '#c97f3a',
          600: '#b8672c',
          700: '#9a5124',
          800: '#7d4120',
          900: '#663620',
          950: '#361a0d',
        },
        espresso: {
          50:  '#f6f3f0',
          100: '#ede5db',
          200: '#d9c9b5',
          300: '#c2a888',
          400: '#aa8560',
          500: '#97703f',
          600: '#7c5a31',
          700: '#634629',
          800: '#503925',
          900: '#423022',
          950: '#221710',
        },
        cream: {
          50:  '#fffef9',
          100: '#fefaee',
          200: '#fdf3d3',
          300: '#fae9a8',
          400: '#f5d96e',
          500: '#efc33a',
        },
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'serif'],
        body:    ['system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
};
