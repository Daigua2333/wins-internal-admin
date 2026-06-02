import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        mist: "#F3F6FB",
        brand: {
          DEFAULT: "#0E7490",
          dark: "#155E75",
          soft: "#CFFAFE",
        },
        accent: "#D97706",
      },
      boxShadow: {
        panel: "0 20px 45px -24px rgba(15, 23, 42, 0.28)",
      },
      backgroundImage: {
        "mesh-radial":
          "radial-gradient(circle at top left, rgba(14,116,144,0.18), transparent 30%), radial-gradient(circle at top right, rgba(217,119,6,0.14), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.96), rgba(243,246,251,0.96))",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
