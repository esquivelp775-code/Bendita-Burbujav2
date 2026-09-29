import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt': la versión nueva espera a que no haya pedido abierto (src/lib/actualizacion.ts).
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['assets/logo-bendita.jpeg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Bendita Burbuja',
        short_name: 'Bendita Burbuja',
        description: 'Caja, inventario y reportes de Bendita Burbuja',
        theme_color: '#780F0D',
        background_color: '#FEEFC4',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,jpeg,png,svg,ico}'],
        // El service worker viejo sigue sirviendo SU index.html con SUS archivos (los tiene en su
        // precache), así que esperar no deja pantalla en blanco. La versión nueva toma control cuando
        // actualizacion.ts la aplica (sin pedido abierto); clientsClaim la hace efectiva al instante y
        // cleanupOutdatedCaches borra el caché anterior.
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/robots\.txt$/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'fuentes', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
