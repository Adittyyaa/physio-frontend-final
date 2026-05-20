/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      colors: {
        teal: {
          DEFAULT: '#0f766e',
          light: '#14b8a6',
          soft: '#ccfbf1',
          dim: '#134e4a',
        },
      },
    },
  },
  plugins: [],
}
