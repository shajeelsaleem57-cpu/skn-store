import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        surface: "var(--color-background)",
        "soft-bg": "var(--color-soft-bg)",
        card: "var(--color-card-bg)",
        accent: "var(--color-accent)",
        success: "var(--color-success)",
        sale: "var(--color-sale)",
        ink: "var(--color-text)",
        muted: "var(--color-muted-text)",
        border: "var(--color-border)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
