import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff1f0",
          100: "#ffdedb",
          400: "#ff7a68",
          500: "#f7492f",
          600: "#dc3820",
          700: "#b52c18",
        },
      },
    },
  },
  plugins: [],
};

export default config;
