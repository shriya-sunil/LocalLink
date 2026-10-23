/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coral: {
          DEFAULT: "var(--color-coral)",
          light: "var(--color-coral-light)",
          hover: "var(--color-coral-hover)",
          dark: "var(--color-coral-dark)",
        },
        salmon: {
          DEFAULT: "var(--color-salmon)",
          light: "var(--color-salmon-light)",
          hover: "var(--color-salmon-hover)",
          dark: "var(--color-salmon-dark)",
        },
        sage: {
          DEFAULT: "var(--color-sage)",
          light: "var(--color-sage-light)",
          border: "var(--color-sage-border)",
          hover: "var(--color-sage-hover)",
          dark: "var(--color-sage-dark)",
        },
        teal: {
          DEFAULT: "var(--color-teal)",
          light: "var(--color-teal-light)",
          hover: "var(--color-teal-hover)",
          dark: "var(--color-teal-dark)",
        },
        navy: {
          DEFAULT: "var(--color-navy)",
          light: "var(--color-navy-light)",
          hover: "var(--color-navy-hover)",
          dark: "var(--color-navy-dark)",
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(31, 47, 85, 0.05)',
        'soft-md': '0 4px 16px rgba(31, 47, 85, 0.08)',
        'soft-lg': '0 10px 25px rgba(31, 47, 85, 0.10)',
      }
    },
  },
  plugins: [],
}
