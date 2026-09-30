import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// Local HTTPS certificate for the dev server. These files are NOT in git
// (a private key doesn't belong in a repository), so they only exist on a
// machine where they've been generated — e.g. with mkcert:
//   mkcert -key-file localhost-key.pem -cert-file localhost.pem localhost
// Without them the dev server simply runs over plain http, and production
// builds (Vercel) never need them at all.
const KEY_FILE = './localhost-key.pem'
const CERT_FILE = './localhost.pem'
const https = fs.existsSync(KEY_FILE) && fs.existsSync(CERT_FILE)
  ? { key: fs.readFileSync(KEY_FILE), cert: fs.readFileSync(CERT_FILE) }
  : undefined

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
    ...(https ? { https } : {})
  }
})
