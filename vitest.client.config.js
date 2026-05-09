import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Redirect @monaco-editor/react to a lightweight stub file.
    // This is more reliable than vi.mock() because it happens at the Vite
    // resolver level — before any module loading — so client/node_modules/
    // packages don't bypass the interception.
    alias: {
      '@monaco-editor/react': path.resolve('./tests/unit/client/stubs/monaco-editor.js'),
    },
    // Force all React imports to resolve to the same instance (root node_modules).
    // Prevents "Invalid hook call" errors when client/node_modules also has React.
    dedupe: ['react', 'react-dom'],
  },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/client/**/*.test.{js,jsx}'],
    setupFiles: ['tests/unit/client/setup.js'],
    globals: true,
    // Allow resolution of client-local deps (react, markdown renderers, etc.)
    deps: {
      moduleDirectories: ['node_modules', 'client/node_modules'],
    },
    server: {
      deps: {
        // ESM-only packages from client/node_modules must be inlined so Vite's
        // ESM/CJS interop applies and their React imports are properly deduped.
        inline: [
          'react-markdown',
          'remark-gfm',
          'remark-math',
          'rehype-katex',
          'katex',
        ],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      include: ['client/src/**/*.{js,jsx}'],
      exclude: ['client/node_modules/**'],
    },
  },
});
