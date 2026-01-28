import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { compression } from 'vite-plugin-compression2'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    compression({
      threshold: 2048, // 2KB
      algorithms: ['gzip'],
    }),
  ],
  css: {
    modules: {
      localsConvention: 'camelCase'
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
        rewriteWsOrigin: true,
      },
    }
  }
})
