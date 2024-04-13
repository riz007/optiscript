/** @type {import('tailwindcss').Config} */
export default {
  content: [],
  css: ["~/assets/css/main.css"],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
};
