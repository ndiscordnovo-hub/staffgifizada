/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff1f1",
          100: "#ffdcdd",
          200: "#ffbabc",
          300: "#ff9195",
          400: "#f76167",
          500: "#e63946",
          600: "#d21f2c",
          700: "#b01722",
          800: "#8f1720",
          900: "#761820",
        },
        ink: {
          900: "#080607",
          850: "#0b0809",
          800: "#110c0e",
          700: "#1a1214",
          600: "#251a1d",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(230,57,70,0.55)",
        card: "0 8px 32px rgba(0,0,0,0.37)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        floaty: "floaty 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
