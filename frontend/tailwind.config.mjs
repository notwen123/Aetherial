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
        background: "#0A0A0B",
        foreground: "#FFFFFF",
        primary: "#00D4FF", // X Layer Cyan
        secondary: "#FF00AA", // Industrial Pink
        accent: "#1A1A1E", // Dark Gray accent
        border: "#2A2A2E",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["Space Mono", "monospace"],
      },
      boxShadow: {
        'cyan-glow': '0 0 15px rgba(0, 212, 255, 0.3)',
        'industrial-glow': '0 0 20px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
};
