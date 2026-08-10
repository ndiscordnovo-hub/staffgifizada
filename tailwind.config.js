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
          50: "#FFF0F3",
          100: "#FFD2DC",
          200: "#FFB6C5",
          300: "#FF8DA3",
          400: "#FF5A78",
          500: "#F31845",
          600: "#D9103B",
          700: "#B80D32",
          800: "#9A0F2D",
          900: "#7D1129",
        },
        ink: "#17181D",
        muted: "#6C6F78",
        subtle: "#A1A2A8",
        line: "#ECE8EB",
        paper: "#FFF9FA",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 10px 22px rgba(243,24,69,0.19)",
        card: "0 20px 52px rgba(27,14,20,0.075)",
        "card-sm": "0 10px 22px rgba(20,20,24,0.04)",
        red: "0 14px 30px rgba(243,22,67,0.15)",
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
