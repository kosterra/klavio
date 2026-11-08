import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { APP_CONFIG } from '@klavio/shared';
import rootPackage from '../package.json' with { type: 'json' };

// the version of Klavio lives in the root package.json (scripts/version.mjs)
const appVersion = process.env.APP_VERSION ?? rootPackage.version;

export default defineConfig({
  plugins: [
    react(),
    {
      // Link previews need absolute URLs: the server puts in its APP_ORIGIN when it
      // serves the page (server/src/plugins/web.ts); during development relative is enough.
      name: 'klavio-origin',
      transformIndexHtml: (html, ctx) =>
        html.replaceAll('%ORIGIN%', ctx.server ? '' : '__KLAVIO_ORIGIN__'),
    },
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
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    // only the release build of main is the version itself; any other build (develop,
    // local) shows the changes of «Next release» as coming soon
    __APP_RELEASED__: JSON.stringify(process.env.APP_RELEASED === 'true'),
  },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3100' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
