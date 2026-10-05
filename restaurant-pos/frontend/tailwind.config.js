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
          DEFAULT: "#ea580c", // Orange-600
          foreground: "#ffffff",
        },
        sidebar: "#1f2937", // Gray-800
      }
    },
  },
  plugins: [],
}
