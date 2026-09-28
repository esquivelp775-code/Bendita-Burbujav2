import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['assets/logo-bendita.jpeg'],
      manifest: {
        name: 'Bendita Burbuja',
        short_name: 'Bendita Burbuja',
        description: 'Caja, inventario y reportes de Bendita Burbuja',
        theme_color: '#780F0D',
        background_color: '#FEEFC4',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'assets/logo-bendita.jpeg', sizes: '512x512', type: 'image/jpeg' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,jpeg,png,svg,ico}'],
        // Sin esto, un service worker viejo puede quedarse sirviendo un index.html que apunta
        // a JS/CSS de un deploy anterior ya borrado de Netlify — pantalla en blanco permanente
        // hasta que el usuario borre datos del sitio a mano. skipWaiting + clientsClaim hacen
        // que la versión nueva tome control de inmediato en vez de esperar a que se cierren
        // todas las pestañas, y cleanupOutdatedCaches borra el caché de la versión anterior.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
