import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    proxy: {
      '/v1': {
        target: 'http://localhost:20128',
        changeOrigin: true,
        secure: false
      },
      '/api/v1': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      },
      '/api/kanoon': {
        target: 'https://api.indiankanoon.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/kanoon/, '')
      },
      '/api/bedrock': {
        target: 'https://bedrock-runtime.us-east-1.amazonaws.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/bedrock/, '')
      },
      '/api/sarvam': {
        target: 'https://apps.sarvam.ai',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/sarvam/, '')
      }
    }
  }
})
