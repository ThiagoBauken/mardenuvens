/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sky: {
          deep: '#0e1a2b',
          mid: '#1a2b44',
          soft: '#2b4364',
        },
        cloud: {
          DEFAULT: '#f5f7fa',
          dim: '#cbd5e1',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
