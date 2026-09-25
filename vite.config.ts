import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
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
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
