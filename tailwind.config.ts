import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forzaBg: "#0A0A0A",
        forzaCard: "#111111",
        forzaBorder: "#1F1F1F",
        forzaLime: "#A4FF2F",
        forzaTextMuted: "#B5B5B5",
      },
    },
  },
  plugins: [],
};

export default config;