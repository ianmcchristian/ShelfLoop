import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/shelfloop/' : '/',
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
  },
});
