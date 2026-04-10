import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        blade: {
          bg: "#f5f4f0",
          surface: "#ffffff",
          border: "#e8e5de",
          accent: "#2d5a4e",
          "accent-light": "#4a8c7a",
          text: "#1a1a18",
          muted: "#8a8578",
          success: "#2d5a4e",
          danger: "#c0392b",
          warning: "#b8860b",
        },
        cream: {
          50: "#fafaf7",
          100: "#f5f4f0",
          200: "#ede9e0",
          300: "#e2ddd3",
          400: "#d4cec3",
        },
        sage: {
          50: "#f0f4f2",
          100: "#d8e8e2",
          200: "#b0d0c6",
          300: "#7db5a7",
          400: "#4a8c7a",
          500: "#2d5a4e",
          600: "#1f3f37",
          700: "#142b25",
        },
        warm: {
          100: "#f5efe6",
          200: "#e8d9c4",
          300: "#d4b896",
          400: "#b8956a",
          500: "#8b6914",
        }
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
