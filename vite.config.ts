import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string
}
const fallbackCommit = process.env.VITE_APP_COMMIT || '52a7193'

// https://vite.dev/config/
export default defineConfig({
  base: '/newsletter-flow/',
  build: {
    outDir: 'docs',
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  define: {
    __APP_COMMIT__: JSON.stringify(fallbackCommit),
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [react(), tailwindcss()],
})
