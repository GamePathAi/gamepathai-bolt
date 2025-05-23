/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        shine: "shine 1.5s",
      },
      keyframes: {
        shine: {
          "0%": { left: "-100%" },
          "100%": { left: "125%" },
        },
      },
    },
  },
  plugins: [],
};