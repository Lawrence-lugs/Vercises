import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/server/**/*.test.js'],
    // Allow resolution of server-local deps (dockerode, express, etc.)
    deps: {
      moduleDirectories: ['node_modules', 'server/node_modules'],
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      include: ['server/**/*.js'],
      exclude: ['server/public/**', 'server/node_modules/**'],
    },
  },
});
