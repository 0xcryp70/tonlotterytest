import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  optimizeDeps: {
    exclude: ['fs'], // Exclude 'fs' from dependency optimization
  },
  assetsInclude: ['**/*.PNG', '**/*.JSON'],
  plugins: [react()],
  build: {
    outDir: 'docs'
  },
  server: {
    port: 8080,
    changeOrigin: true,
    secure: false,
    ws: true,
    fs: {
      allow: ['../sdk', './'],
    },
  },
})

