import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  build: {
    // Remove the externalization of @mui/icons-material to fix loading issues
  },
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',  // your gateway
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:8003',  // wherever socket server runs
        changeOrigin: true,
        ws: true,  // ← this is the key part
      }
    }
  },

  // preview: {
  //   host: true,
  //   allowedHosts: true
  // }
})
