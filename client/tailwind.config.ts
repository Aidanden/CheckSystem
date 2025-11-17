import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#dc4446',
          600: '#c53a3c',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        secondary: {
          50: '#fdfaf7',
          100: '#faf5ef',
          200: '#f5ebe0',
          300: '#ede0d1',
          400: '#e5d5c2',
          500: '#d4c4b0',
          600: '#c4b49f',
          700: '#b3a48e',
          800: '#8a7d6e',
          900: '#6b6158',
        },
      },
    },
  },
  plugins: [],
}
export default config

