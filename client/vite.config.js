import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/exercises',
  plugins: [react()],
  build: {
    outDir: '../server/public',
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: ['lugs-ideapad','verilog.eee.upd.edu.ph'],
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
