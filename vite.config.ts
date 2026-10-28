import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // satellite.js 7 enthält einen WASM-Teil mit Workern und Top-Level-Await
  worker: { format: 'es' },
  build: { target: 'esnext' },
  server: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': 'http://localhost:3001' },
  },
  test: {
    include: ['shared/**/*.test.ts', 'server/**/*.test.ts', 'src/**/*.test.{ts,tsx}'],
  },
});
