import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-512.png'],
      manifest: {
        name: 'Apotek Medika Sejahtera',
        short_name: 'ApoMedika',
        description: 'Sistem Kasir & Manajemen Apotek — POS, Inventaris, Shift Karyawan',
        theme_color: '#4f46e5',
        background_color: '#f5f6fa',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-512.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['medical', 'business', 'productivity'],
        shortcuts: [
          {
            name: 'Kasir POS',
            short_name: 'Kasir',
            description: 'Buka halaman kasir transaksi',
            url: '/admin/pos',
            icons: [{ src: 'icon-512.png', sizes: '96x96' }]
          },
          {
            name: 'Inventaris',
            short_name: 'Stok',
            description: 'Cek stok dan inventaris obat',
            url: '/admin/inventory',
            icons: [{ src: 'icon-512.png', sizes: '96x96' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],
})
