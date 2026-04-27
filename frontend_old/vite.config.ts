import { defineConfig } from 'vite';

/**
 * Vite config for Music Finder Frontend.
 *
 * - Dev server runs on :5173
 * - /api/* requests are proxied to the backend at :3000
 *   This means in `src/api.ts` you can fetch('/api/search?q=...')
 *   without worrying about CORS in development.
 */
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
