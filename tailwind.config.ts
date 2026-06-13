import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          DEFAULT: "#1B4332",
          mid: "#2D6A4F",
          light: "#52B788",
        },
        tan: {
          DEFAULT: "#E9C46A",
          light: "#FEF9EE",
        },
        cream: "#F8F5F0",
      },
      borderRadius: {
        DEFAULT: "12px",
        sm: "8px",
        lg: "16px",
      },
    },
  },
  plugins: [],
};
export default config;
