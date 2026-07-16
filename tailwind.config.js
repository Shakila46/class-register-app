/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        chalk: {
          bg: '#F7F4EC',
          card: '#FFFFFF',
          line: '#E4DFD0',
        },
        board: {
          900: '#16241C',
          800: '#1F3D2E',
          700: '#2A5240',
          600: '#376B52',
        },
        gold: {
          500: '#D9A441',
          600: '#C08A2A',
          100: '#F6E7C8',
        },
        pass: {
          bg: '#E4F3E8',
          text: '#1F6D3B',
          bar: '#3FA65C',
        },
        fail: {
          bg: '#FBE8E6',
          text: '#B23A2E',
          bar: '#D8493B',
        },
        warn: {
          bg: '#FBF1DC',
          text: '#8A6512',
          bar: '#D9A441',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        card: '10px',
      },
    },
  },
  plugins: [],
}
