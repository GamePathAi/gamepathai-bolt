import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    compression(), // Generates .gz files for static assets
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
  },
  publicDir: 'public',
});
