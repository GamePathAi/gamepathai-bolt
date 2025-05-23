import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  base: './', // Crucial for Electron - ensures relative paths
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          // Improves performance by separating dependencies into chunks
          vendor: ['react', 'react-dom'],
          ui: ['react-router-dom', 'lucide-react'],
        },
      },
      // Exclude native modules and problematic dependencies
      external: [
        'registry-js',
        'systeminformation',
        'electron',
        'electron-store',
        'node-os-utils',
        'unix-dgram',
        /^node:/
      ]
    },
    // Important for Electron: preserves original directories
    assetsDir: 'assets',
    // Generate sourcemaps for debugging
    sourcemap: true,
  },
  optimizeDeps: {
    exclude: [
      'lucide-react',
      'registry-js',
      'systeminformation',
      'electron-store',
      'node-os-utils',
      'unix-dgram'
    ],
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
  },
  publicDir: 'public',
  // Add this to ensure Electron can access local files
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@electron': resolve(__dirname, 'electron'),
    },
  },
  // Define environment variables to control behavior
  define: {
    'process.env.VITE_IGNORE_NODE_IMPORTS': JSON.stringify('true'),
    'process.env.ELECTRON_RUN': JSON.stringify(process.env.ELECTRON_RUN || 'false')
  }
});