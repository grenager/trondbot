import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "emoji-rise": {
          "0%": { transform: "translateY(0) scale(1)", opacity: "1" },
          "100%": { transform: "translateY(-60px) scale(1.3)", opacity: "0" },
        },
      },
      animation: {
        "emoji-rise": "emoji-rise 1s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
