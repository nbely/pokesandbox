import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#202225',
        secondary: '#5865f2',
        gray: {
          1300: '#000000',
          1200: '#141414',
          1100: '#1f1f1f',
          1000: '#262626',
          900: '#434343',
          800: '#595959',
          700: '#8c8c8c',
          600: '#bfbfbf',
          500: '#d9d9d9',
          400: '#f0f0f0',
          300: '#f5f5f5',
          200: '#fafafa',
          100: '#ffffff',
        },
        gold: {
          1000: '#613400',
          900: '#874d00',
          800: '#ad6800',
          700: '#d48806',
          600: '#faad14',
          500: '#ffc53d',
          400: '#ffd666',
          300: '#ffe58f',
          200: '#fff1b8',
          100: '#fffbe6',
        },
        dgold: {
          1000: '#faedb5',
          900: '#f8df8b',
          800: '#f3cc62',
          700: '#e8b339',
          600: '#d89614',
          500: '#aa7714',
          400: '#7c5914',
          300: '#594214',
          200: '#443111',
          100: '#2b2111',
        }
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
