import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on the local network too, so a phone on the same Wi-Fi can
    // open https://<this PC's IP>:5173
    host: true,
    // The app calls /api (see VITE_API_URL in .env.local) and Vite forwards
    // it to the backend on this machine — so a phone never needs to reach
    // "localhost:3000" itself, and the requests are same-origin (no CORS).
    proxy: {
      '/api': 'http://localhost:3000'
    },
    https: {
      key: fs.readFileSync('./localhost-key.pem'),
      cert: fs.readFileSync('./localhost.pem')
    }
  }
})