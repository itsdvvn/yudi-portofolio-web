/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./src/**/*.{astro,html,js,jsx,md,mdoc,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          light: '#fafafa',
          dark: '#080808',
        },
        surface: {
          light: '#f4f4f5',
          dark: '#121212',
        },
        border: {
          light: '#e4e4e7',
          dark: '#222222',
        },
        muted: {
          light: '#71717a',
          dark: '#888888',
        },
        accent: '#00dc82',
      },
      fontFamily: {
        sans: ['"Uncut Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
