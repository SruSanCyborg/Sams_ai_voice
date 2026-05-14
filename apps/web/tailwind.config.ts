import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        space: {
          950: "#05050f",
          900: "#0a0a1a",
          800: "#0f0f24",
          700: "#1a1a2e",
        },
        violet: {
          500: "#7c3aed",
          400: "#8b5cf6",
          300: "#a78bfa",
        },
        cyan: {
          500: "#06b6d4",
          400: "#22d3ee",
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 8s linear infinite",
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        float: "float 4s ease-in-out infinite",
        sonar: "sonar 2.5s ease-out infinite",
        "sonar-delay": "sonar 2.5s ease-out 0.8s infinite",
        "sonar-delay2": "sonar 2.5s ease-out 1.6s infinite",
        shimmer: "shimmer 4s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        sonar: {
          "0%": { transform: "scale(0.3)", opacity: "0.8" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
