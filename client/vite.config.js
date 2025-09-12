import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../server/public',
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': 'http://server:3000',
    },
  },
});
