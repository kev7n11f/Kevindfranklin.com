/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d6e0ff',
          300: '#b3c5ff',
          400: '#8099ff',
          500: '#667eea',
          600: '#4d5fd1',
          700: '#3d4ab8',
          800: '#2d3a9f',
          900: '#1e2b86',
        },
        secondary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#764ba2',
          600: '#5e3a82',
          700: '#4a2d68',
          800: '#3b2454',
          900: '#2e1c41',
        },
      },
    },
  },
  plugins: [],
}
