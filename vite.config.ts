import { defineConfig } from 'vitest/config';
import react from "@vitejs/plugin-react";
import { resolve } from 'path';
import { fileURLToPath } from 'url';

// ESM-safe __dirname for Vite config
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
    exclude: ["e2e/**/*", "backend/**/*"]
  },
});
