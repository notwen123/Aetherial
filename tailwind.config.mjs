/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        foreground: "#FFFFFF",
        primary: "#A3E635", // Bright Green from image
        secondary: "#1A1A1E", // Professional Deep Gray/Black
        accent: "#FFFFFF",
        border: "#1A1A1E",
        zinc: {
          950: "#050505",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["Space Mono", "monospace"],
      },
      boxShadow: {
        'neon-glow': '0 0 15px rgba(163, 230, 53, 0.2)',
        'professional-glow': '0 0 30px rgba(0, 0, 0, 0.8)',
      }
    },
  },
  plugins: [],
};
