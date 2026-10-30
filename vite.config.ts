import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/** The SQLite WebAssembly file is about 0.9 MB; the default precache limit (2 MiB) is raised for headroom. */
const PRECACHE_LIMIT_BYTES = 5 * 1024 * 1024;

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Never reload on its own: a new version waits until the owner taps "Update" (never mid-workout).
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'Workouts',
        short_name: 'Workouts',
        description: 'Personal workout tracker.',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        background_color: '#08090A',
        theme_color: '#08090A',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Everything the app needs runs offline, including the database engine.
        globPatterns: ['**/*.{js,css,html,wasm,png,svg,json}'],
        maximumFileSizeToCacheInBytes: PRECACHE_LIMIT_BYTES,
        navigateFallback: '/index.html',
      },
    }),
  ],
  worker: { format: 'es' },
  // The SQLite package loads its .wasm file relative to itself; pre-bundling would break that path.
  optimizeDeps: { exclude: ['@sqlite.org/sqlite-wasm'] },
  server: { port: 5173 },
});
