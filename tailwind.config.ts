import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        retail: {
          blue: '#0071dc',
          'blue-dark': '#004f9e',
          'blue-light': '#e6f1fc',
          canvas: '#f5f7fb',
          ink: '#1f2937',
        },
        spark: '#ffc220',
      },
      boxShadow: {
        retail: '0 2px 10px rgba(0, 0, 0, 0.12)',
        panel: '0 1px 3px rgba(31, 41, 55, 0.12)',
      },
    },
  },
  plugins: [],
} satisfies Config;
