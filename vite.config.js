import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Vite builds the React renderer into dist/renderer/.
// Electron loads dist/renderer/index.html in production,
// or the dev server URL in development.
export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, 'src'),
  base: './',
  build: {
    outDir: resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})
