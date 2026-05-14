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
    allowedHosts: true
  },

  // preview: {
  //   host: true,
  //   allowedHosts: true
  // }
})
