import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,   // Bind to 0.0.0.0 — makes the server reachable from other devices on the same Wi-Fi
    port: 5173,   // Fixed port so the mobile URL is always predictable
  },
});
