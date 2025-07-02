import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://chatting-application-1zq7.onrender.com',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/socket.io': {
      target: 'https://chatting-application-1zq7.onrender.com',
      ws: true,
    },
    },
  },
})
