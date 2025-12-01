/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "rgb(var(--accent))",
        "accent-hover": "rgb(var(--accent-hover))",
        "accent-fg": "rgb(var(--accent-fg))",
        surface: "rgb(var(--surface))",
        "surface-alt": "rgb(var(--surface-alt))",
        bg: "rgb(var(--bg))",
        "bg-muted": "rgb(var(--bg-muted))",
        border: "rgb(var(--border))",
        text: "rgb(var(--text))",
        "text-muted": "rgb(var(--text-muted))",
      },
    },
  },
  plugins: [],
};