/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontSize: {
        'base': '1.0625rem',
        'lg': '1.1875rem',
        'xl': '1.3125rem',
        '2xl': '1.5625rem',
        '3xl': '1.9375rem',
        '4xl': '2.3125rem',
      },
    },
  },
  plugins: [],
};
