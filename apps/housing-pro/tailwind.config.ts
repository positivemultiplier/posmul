import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pro: {
          bg: "#0B111E",
          card: "#121A2B",
          border: "rgba(255, 255, 255, 0.08)",
          accent: "#38BDF8",
          primary: "#2563EB",
          star: "#F59E0B",
          xmark: "#F43F5E",
          success: "#10B981",
        },
      },
    },
  },
  plugins: [],
};

export default config;

