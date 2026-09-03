import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  root: process.cwd(),
  plugins: [vue()],
  server: {
    port: 3000,
    open: false,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true
      }
    }
  }
})
