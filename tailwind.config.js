/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],

  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        light: "var(--light)",
        arapawa: {
          50: "#f3f5ff",
          100: "#e9ebfe",
          200: "#d5d9ff",
          300: "#b4bbfe",
          400: "#898efc",
          500: "#5b59f9",
          600: "#4437f0",
          700: "#3625dc",
          800: "#2d1fb8",
          900: "#271b97",
          950: "#140f66",
        },
      },
    },
  },
  safelist: [
    "flex",
    "flex-col",
    "flex-row",
    "justify-center",
    "items-center",
    {
      pattern: /font-(thin|light|normal|medium|bold|black)/,
    },
    {
      pattern: /text-(xs|sm|base|lg|xl|2xl|3xl)/,
    },
    {
      pattern: /text-gray-(50|100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /gap-(0|1|2|3|4|5|6|8|10|12|16)/,
    },
  ],
  plugins: [require("@tailwindcss/typography")],
};
