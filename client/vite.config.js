import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../server/public',
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:80',
    },
  },
});
