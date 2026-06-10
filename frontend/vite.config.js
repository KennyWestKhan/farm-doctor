import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Farm Doctor Ghana',
        short_name: 'Farm Doctor',
        description: 'Crop disease diagnosis in Twi — works offline.',
        theme_color: '#2f7d3a',
        background_color: '#fbf3e4',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the app shell + JS/CSS so the whole diagnosis flow works offline.
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        // Cache OpenStreetMap tiles so the supplier map degrades gracefully offline.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/unpkg\.com\/leaflet.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'leaflet-assets', expiration: { maxEntries: 20 } },
          },
        ],
      },
    }),
  ],
});
