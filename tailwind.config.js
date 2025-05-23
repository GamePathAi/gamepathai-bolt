/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        shine: 'shine 1.5s',
      },
      keyframes: {
        shine: {
          '100%': { left: '125%' },
        },
      },
    },
  },
  plugins: [],
  safelist: [
    'bg-cyan-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-red-500',
    'bg-yellow-500',
    'text-cyan-400',
    'text-purple-400',
    'text-green-400',
    'text-red-400',
    'text-yellow-400',
    'border-cyan-500',
    'border-purple-500',
    'border-green-500',
    'border-red-500',
    'border-yellow-500',
  ],
};