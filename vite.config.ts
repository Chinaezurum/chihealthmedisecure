/// <reference types="node" />
import { defineConfig } from 'vitest/config';
import react from "@vitejs/plugin-react";
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

// ESM-safe __dirname for Vite config
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'ChiHealth MediSecure',
        short_name: 'ChiHealth',
        description: 'Comprehensive healthcare management platform with AI-powered features',
        theme_color: '#40e0d0',
        background_color: '#0a1929',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/i\.pravatar\.cc\//i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'avatar-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  server: {
    // Proxy API requests to the backend during development
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      // Proxy WebSocket connections. Use http target and changeOrigin so the
      // dev server correctly performs the HTTP upgrade to WebSocket on the
      // backend in a variety of dev environments.
      "/ws": {
        target: "http://localhost:8080",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  optimizeDeps: {
    // Do not pre-bundle the Node-only SDK. Use a browser shim via alias instead.
    // Excluding the package prevents Vite's optimizeDeps from attempting to
    // resolve and pre-bundle the server-only SDK which causes the dev server
    // to fail with 'Failed to resolve entry for package "@google/genai"'.
    exclude: ['@google/genai'],
    esbuildOptions: {
      target: "esnext",
    },
  },
  resolve: {
    conditions: ["browser", "module", "import"],
    alias: {
      // Resolve @google/genai imports in the browser to a small runtime shim
      '@google/genai': resolve(__dirname, 'src/shims/genai-shim.ts')
    }
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./setupTests.ts",
    // Exclude e2e, backend, and node_modules to avoid picking up tests shipped with deps
    exclude: ["e2e/**/*", "backend/**/*", "node_modules/**"],
  },
});
