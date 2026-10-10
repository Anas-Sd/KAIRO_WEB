/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "background": "#12131a",
        "surface": "#12131a",
        "surface-dim": "#12131a",
        "surface-bright": "#383941",
        "surface-container-lowest": "#0d0e15",
        "surface-container-low": "#1a1b22",
        "surface-container": "#1e1f26",
        "surface-container-high": "#292931",
        "surface-container-highest": "#33343c",
        "surface-variant": "#33343c",
        "on-surface": "#e3e1ec",
        "on-surface-variant": "#c8c4d9",
        "outline": "#918ea2",
        "outline-variant": "#474556",
        "primary": "#c5c0ff",
        "primary-container": "#5a45ff",
        "on-primary": "#ffffff",
        "on-primary-container": "#e8e4ff",
        "secondary": "#00f5a0",
        "secondary-container": "#114a38",
        "on-secondary": "#003825",
        "on-secondary-container": "#a7f8d4",
        "tertiary": "#ffb77d",
        "tertiary-container": "#9e5400",
        "on-tertiary": "#4d2600",
        "error": "#ffb4ab",
        "error-container": "#93000a",
        "on-error": "#690005",
        "on-error-container": "#ffdad6"
      },
      borderRadius: {
        "DEFAULT": "0.75rem",
        "lg": "1.25rem",
        "xl": "2rem",
        "full": "9999px"
      },
      fontFamily: {
        "sans": ["Inter", "sans-serif"],
        "display": ["Roboto Flex", "sans-serif"],
      }
    }
  },
  plugins: [],
}
