import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/ShelfLoop/' : '/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1400, // Three.js is large by design — acknowledged
  },
  test: {
    environment: 'node',
    globals: true,
  },
});
