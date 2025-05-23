import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    compression(), // Generates .gz files for static assets
  ],
  base: './', // Isso é crucial para o Electron - garante caminhos relativos
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          // Melhora a performance separando dependências em chunks
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
    // Importante para Electron: preserva os diretórios originais
    assetsDir: 'assets',
    // Gera sourcemaps para debugging
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
  // Adicione isso para garantir que o Electron possa acessar os arquivos locais
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