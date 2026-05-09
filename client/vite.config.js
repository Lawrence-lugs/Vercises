import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';

function getCommitHash() {
  if (process.env.COMMIT_HASH) return process.env.COMMIT_HASH;
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
}

function getBuildDate() {
  return new Date().toISOString().slice(0, 10);
}

export default defineConfig({
  base: '/exercises',
  plugins: [react()],
  define: {
    __COMMIT_HASH__: JSON.stringify(getCommitHash()),
    __BUILD_DATE__: JSON.stringify(getBuildDate()),
  },
  build: {
    outDir: '../server/public',
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: ['lugs-ideapad', 'digital.eee.upd.edu.ph', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://server:3000',
        changeOrigin: true,
        secure: false,
      },
    },
    watch: {
      usePolling: true,
      interval: 100, // ms, adjust as needed
    },
  },
});
