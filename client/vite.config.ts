import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { APP_CONFIG } from '@klavio/shared';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      pwaAssets: { config: true, overrideManifestIcons: true },
      manifest: {
        name: APP_CONFIG.name,
        short_name: APP_CONFIG.shortName,
        description: APP_CONFIG.description,
        lang: 'de-CH',
        theme_color: APP_CONFIG.themeColor,
        background_color: APP_CONFIG.backgroundColor,
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        categories: ['education', 'music'],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,json}'],
        navigateFallback: '/index.html',
        // The very first service worker takes over the open page right away, so
        // the app already works offline during the first visit. Updates still
        // wait for the user (registerType: 'prompt').
        clientsClaim: true,
        // never let the service worker answer API calls from cache
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3100' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
