/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],

  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  safelist: [
    "flex",
    "flex-col",
    "flex-row",
    "justify-center",
    "items-center",
    // pseudo-elements 관련 클래스 추가
    {
      pattern: /before:(content-\[.*\]|block|opacity-0)/,
    },
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
