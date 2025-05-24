// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { resolve } from "path";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig({
  plugins: [
    react()
  ],
  base: "./",
  // Crucial for Electron - ensures relative paths
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__vite_injected_original_dirname, "index.html")
      },
      output: {
        manualChunks: {
          // Improves performance by separating dependencies into chunks
          vendor: ["react", "react-dom"],
          ui: ["react-router-dom", "lucide-react"]
        }
      },
      // Exclude native modules and problematic dependencies
      external: [
        "electron",
        "electron-store",
        "node-os-utils",
        "unix-dgram",
        /^node:/
      ]
    },
    // Important for Electron: preserves original directories
    assetsDir: "assets",
    // Generate sourcemaps for debugging
    sourcemap: true
  },
  optimizeDeps: {
    exclude: [
      "registry-js",
      "systeminformation",
      "electron-store",
      "node-os-utils",
      "unix-dgram"
    ],
    include: [
      "zustand",
      "zustand/middleware",
      "crypto-js",
      "zod",
      "idb-keyval",
      "i18next-browser-languagedetector",
      "i18next-http-backend"
    ]
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: [".."]
    }
  },
  publicDir: "public",
  // Add this to ensure Electron can access local files
  resolve: {
    alias: {
      "@": resolve(__vite_injected_original_dirname, "src"),
      "@electron": resolve(__vite_injected_original_dirname, "electron")
    }
  },
  // Define environment variables to control behavior
  define: {
    "process.env.VITE_IGNORE_NODE_IMPORTS": JSON.stringify("true"),
    "process.env.ELECTRON_RUN": JSON.stringify(process.env.ELECTRON_RUN || "false")
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgXSxcbiAgYmFzZTogJy4vJywgLy8gQ3J1Y2lhbCBmb3IgRWxlY3Ryb24gLSBlbnN1cmVzIHJlbGF0aXZlIHBhdGhzXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiAnZGlzdCcsXG4gICAgZW1wdHlPdXREaXI6IHRydWUsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgaW5wdXQ6IHtcbiAgICAgICAgbWFpbjogcmVzb2x2ZShfX2Rpcm5hbWUsICdpbmRleC5odG1sJyksXG4gICAgICB9LFxuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIC8vIEltcHJvdmVzIHBlcmZvcm1hbmNlIGJ5IHNlcGFyYXRpbmcgZGVwZW5kZW5jaWVzIGludG8gY2h1bmtzXG4gICAgICAgICAgdmVuZG9yOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbSddLFxuICAgICAgICAgIHVpOiBbJ3JlYWN0LXJvdXRlci1kb20nLCAnbHVjaWRlLXJlYWN0J10sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgLy8gRXhjbHVkZSBuYXRpdmUgbW9kdWxlcyBhbmQgcHJvYmxlbWF0aWMgZGVwZW5kZW5jaWVzXG4gICAgICBleHRlcm5hbDogW1xuICAgICAgICAnZWxlY3Ryb24nLFxuICAgICAgICAnZWxlY3Ryb24tc3RvcmUnLFxuICAgICAgICAnbm9kZS1vcy11dGlscycsXG4gICAgICAgICd1bml4LWRncmFtJyxcbiAgICAgICAgL15ub2RlOi9cbiAgICAgIF1cbiAgICB9LFxuICAgIC8vIEltcG9ydGFudCBmb3IgRWxlY3Ryb246IHByZXNlcnZlcyBvcmlnaW5hbCBkaXJlY3Rvcmllc1xuICAgIGFzc2V0c0RpcjogJ2Fzc2V0cycsXG4gICAgLy8gR2VuZXJhdGUgc291cmNlbWFwcyBmb3IgZGVidWdnaW5nXG4gICAgc291cmNlbWFwOiB0cnVlLFxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBleGNsdWRlOiBbXG4gICAgICAncmVnaXN0cnktanMnLFxuICAgICAgJ3N5c3RlbWluZm9ybWF0aW9uJyxcbiAgICAgICdlbGVjdHJvbi1zdG9yZScsXG4gICAgICAnbm9kZS1vcy11dGlscycsXG4gICAgICAndW5peC1kZ3JhbSdcbiAgICBdLFxuICAgIGluY2x1ZGU6IFtcbiAgICAgICd6dXN0YW5kJyxcbiAgICAgICd6dXN0YW5kL21pZGRsZXdhcmUnLFxuICAgICAgJ2NyeXB0by1qcycsXG4gICAgICAnem9kJyxcbiAgICAgICdpZGIta2V5dmFsJyxcbiAgICAgICdpMThuZXh0LWJyb3dzZXItbGFuZ3VhZ2VkZXRlY3RvcicsXG4gICAgICAnaTE4bmV4dC1odHRwLWJhY2tlbmQnLFxuICAgIF1cbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgZnM6IHtcbiAgICAgIC8vIEFsbG93IHNlcnZpbmcgZmlsZXMgZnJvbSBvbmUgbGV2ZWwgdXAgdG8gdGhlIHByb2plY3Qgcm9vdFxuICAgICAgYWxsb3c6IFsnLi4nXSxcbiAgICB9LFxuICB9LFxuICBwdWJsaWNEaXI6ICdwdWJsaWMnLFxuICAvLyBBZGQgdGhpcyB0byBlbnN1cmUgRWxlY3Ryb24gY2FuIGFjY2VzcyBsb2NhbCBmaWxlc1xuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMnKSxcbiAgICAgICdAZWxlY3Ryb24nOiByZXNvbHZlKF9fZGlybmFtZSwgJ2VsZWN0cm9uJyksXG4gICAgfSxcbiAgfSxcbiAgLy8gRGVmaW5lIGVudmlyb25tZW50IHZhcmlhYmxlcyB0byBjb250cm9sIGJlaGF2aW9yXG4gIGRlZmluZToge1xuICAgICdwcm9jZXNzLmVudi5WSVRFX0lHTk9SRV9OT0RFX0lNUE9SVFMnOiBKU09OLnN0cmluZ2lmeSgndHJ1ZScpLFxuICAgICdwcm9jZXNzLmVudi5FTEVDVFJPTl9SVU4nOiBKU09OLnN0cmluZ2lmeShwcm9jZXNzLmVudi5FTEVDVFJPTl9SVU4gfHwgJ2ZhbHNlJylcbiAgfVxufSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7QUFDbEIsU0FBUyxlQUFlO0FBRnhCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxNQUFNO0FBQUE7QUFBQSxFQUNOLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLGFBQWE7QUFBQSxJQUNiLGVBQWU7QUFBQSxNQUNiLE9BQU87QUFBQSxRQUNMLE1BQU0sUUFBUSxrQ0FBVyxZQUFZO0FBQUEsTUFDdkM7QUFBQSxNQUNBLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQTtBQUFBLFVBRVosUUFBUSxDQUFDLFNBQVMsV0FBVztBQUFBLFVBQzdCLElBQUksQ0FBQyxvQkFBb0IsY0FBYztBQUFBLFFBQ3pDO0FBQUEsTUFDRjtBQUFBO0FBQUEsTUFFQSxVQUFVO0FBQUEsUUFDUjtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFFQSxXQUFXO0FBQUE7QUFBQSxJQUVYLFdBQVc7QUFBQSxFQUNiO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTO0FBQUEsTUFDUDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixJQUFJO0FBQUE7QUFBQSxNQUVGLE9BQU8sQ0FBQyxJQUFJO0FBQUEsSUFDZDtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFdBQVc7QUFBQTtBQUFBLEVBRVgsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxRQUFRLGtDQUFXLEtBQUs7QUFBQSxNQUM3QixhQUFhLFFBQVEsa0NBQVcsVUFBVTtBQUFBLElBQzVDO0FBQUEsRUFDRjtBQUFBO0FBQUEsRUFFQSxRQUFRO0FBQUEsSUFDTix3Q0FBd0MsS0FBSyxVQUFVLE1BQU07QUFBQSxJQUM3RCw0QkFBNEIsS0FBSyxVQUFVLFFBQVEsSUFBSSxnQkFBZ0IsT0FBTztBQUFBLEVBQ2hGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
