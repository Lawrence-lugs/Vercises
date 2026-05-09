import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/api/**/*.test.js'],
    // API tests hit a live server — allow generous timeout for Docker spin-up
    testTimeout: 60_000,
    hookTimeout: 30_000,
  },
});
