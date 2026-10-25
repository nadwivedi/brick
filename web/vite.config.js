import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The Brick Manager app (frontend/) uses 5173-5175, so the website gets its own port
  server: { port: 5176 },
})
