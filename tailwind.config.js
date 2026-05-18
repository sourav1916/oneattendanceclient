// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // This is crucial - must be 'class' not 'media'
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      // Custom screens/breakpoints - only between 280px and 400px
      screens: {
        'xsm': {               // Only applies from 280px to 400px
          'min': '280px',
          'max': '480px'
        },
      },
      colors: {
        // You can add custom colors here
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}