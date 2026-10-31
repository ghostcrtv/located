import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base: './' keeps every path relative, so the game works from
// https://<user>.github.io/<repo>/ AND inside a future iPad app (Capacitor)
// without any changes.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'docs', // GitHub Pages can serve straight from /docs on the main branch
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
} as Parameters<typeof defineConfig>[0])
