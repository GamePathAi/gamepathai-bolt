// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
import compression from "file:///home/project/node_modules/vite-plugin-compression/dist/index.mjs";
import { resolve } from "path";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    compression()
    // Generates .gz files for static assets
  ],
  base: "./",
  // Isso é crucial para o Electron - garante caminhos relativos
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__vite_injected_original_dirname, "index.html")
      },
      output: {
        manualChunks: {
          // Melhora a performance separando dependências em chunks
          vendor: ["react", "react-dom"],
          ui: ["react-router-dom", "lucide-react"]
        }
      },
      // Exclude native modules and problematic dependencies
      external: [
        "registry-js",
        "systeminformation",
        "electron",
        "electron-store",
        "node-os-utils",
        "unix-dgram",
        /^node:/
      ]
    },
    // Importante para Electron: preserva os diretórios originais
    assetsDir: "assets",
    // Gera sourcemaps para debugging
    sourcemap: true
  },
  optimizeDeps: {
    exclude: [
      "lucide-react",
      "registry-js",
      "systeminformation",
      "electron-store",
      "node-os-utils",
      "unix-dgram"
    ]
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: [".."]
    }
  },
  publicDir: "public",
  // Adicione isso para garantir que o Electron possa acessar os arquivos locais
  resolve: {
    alias: {
      "@": resolve(__vite_injected_original_dirname, "src")
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgY29tcHJlc3Npb24gZnJvbSAndml0ZS1wbHVnaW4tY29tcHJlc3Npb24nO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgY29tcHJlc3Npb24oKSwgLy8gR2VuZXJhdGVzIC5neiBmaWxlcyBmb3Igc3RhdGljIGFzc2V0c1xuICBdLFxuICBiYXNlOiAnLi8nLCAvLyBJc3NvIFx1MDBFOSBjcnVjaWFsIHBhcmEgbyBFbGVjdHJvbiAtIGdhcmFudGUgY2FtaW5ob3MgcmVsYXRpdm9zXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiAnZGlzdCcsXG4gICAgZW1wdHlPdXREaXI6IHRydWUsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgaW5wdXQ6IHtcbiAgICAgICAgbWFpbjogcmVzb2x2ZShfX2Rpcm5hbWUsICdpbmRleC5odG1sJyksXG4gICAgICB9LFxuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIC8vIE1lbGhvcmEgYSBwZXJmb3JtYW5jZSBzZXBhcmFuZG8gZGVwZW5kXHUwMEVBbmNpYXMgZW0gY2h1bmtzXG4gICAgICAgICAgdmVuZG9yOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbSddLFxuICAgICAgICAgIHVpOiBbJ3JlYWN0LXJvdXRlci1kb20nLCAnbHVjaWRlLXJlYWN0J10sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgLy8gRXhjbHVkZSBuYXRpdmUgbW9kdWxlcyBhbmQgcHJvYmxlbWF0aWMgZGVwZW5kZW5jaWVzXG4gICAgICBleHRlcm5hbDogW1xuICAgICAgICAncmVnaXN0cnktanMnLFxuICAgICAgICAnc3lzdGVtaW5mb3JtYXRpb24nLFxuICAgICAgICAnZWxlY3Ryb24nLFxuICAgICAgICAnZWxlY3Ryb24tc3RvcmUnLFxuICAgICAgICAnbm9kZS1vcy11dGlscycsXG4gICAgICAgICd1bml4LWRncmFtJyxcbiAgICAgICAgL15ub2RlOi9cbiAgICAgIF1cbiAgICB9LFxuICAgIC8vIEltcG9ydGFudGUgcGFyYSBFbGVjdHJvbjogcHJlc2VydmEgb3MgZGlyZXRcdTAwRjNyaW9zIG9yaWdpbmFpc1xuICAgIGFzc2V0c0RpcjogJ2Fzc2V0cycsXG4gICAgLy8gR2VyYSBzb3VyY2VtYXBzIHBhcmEgZGVidWdnaW5nXG4gICAgc291cmNlbWFwOiB0cnVlLFxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBleGNsdWRlOiBbXG4gICAgICAnbHVjaWRlLXJlYWN0JyxcbiAgICAgICdyZWdpc3RyeS1qcycsXG4gICAgICAnc3lzdGVtaW5mb3JtYXRpb24nLFxuICAgICAgJ2VsZWN0cm9uLXN0b3JlJyxcbiAgICAgICdub2RlLW9zLXV0aWxzJyxcbiAgICAgICd1bml4LWRncmFtJ1xuICAgIF0sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIGZzOiB7XG4gICAgICAvLyBBbGxvdyBzZXJ2aW5nIGZpbGVzIGZyb20gb25lIGxldmVsIHVwIHRvIHRoZSBwcm9qZWN0IHJvb3RcbiAgICAgIGFsbG93OiBbJy4uJ10sXG4gICAgfSxcbiAgfSxcbiAgcHVibGljRGlyOiAncHVibGljJyxcbiAgLy8gQWRpY2lvbmUgaXNzbyBwYXJhIGdhcmFudGlyIHF1ZSBvIEVsZWN0cm9uIHBvc3NhIGFjZXNzYXIgb3MgYXJxdWl2b3MgbG9jYWlzXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYycpLFxuICAgIH0sXG4gIH0sXG4gIC8vIERlZmluZSBlbnZpcm9ubWVudCB2YXJpYWJsZXMgdG8gY29udHJvbCBiZWhhdmlvclxuICBkZWZpbmU6IHtcbiAgICAncHJvY2Vzcy5lbnYuVklURV9JR05PUkVfTk9ERV9JTVBPUlRTJzogSlNPTi5zdHJpbmdpZnkoJ3RydWUnKSxcbiAgICAncHJvY2Vzcy5lbnYuRUxFQ1RST05fUlVOJzogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYuRUxFQ1RST05fUlVOIHx8ICdmYWxzZScpXG4gIH1cbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxvQkFBb0I7QUFDdFAsT0FBTyxXQUFXO0FBQ2xCLE9BQU8saUJBQWlCO0FBQ3hCLFNBQVMsZUFBZTtBQUh4QixJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUE7QUFBQSxFQUNkO0FBQUEsRUFDQSxNQUFNO0FBQUE7QUFBQSxFQUNOLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLGFBQWE7QUFBQSxJQUNiLGVBQWU7QUFBQSxNQUNiLE9BQU87QUFBQSxRQUNMLE1BQU0sUUFBUSxrQ0FBVyxZQUFZO0FBQUEsTUFDdkM7QUFBQSxNQUNBLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQTtBQUFBLFVBRVosUUFBUSxDQUFDLFNBQVMsV0FBVztBQUFBLFVBQzdCLElBQUksQ0FBQyxvQkFBb0IsY0FBYztBQUFBLFFBQ3pDO0FBQUEsTUFDRjtBQUFBO0FBQUEsTUFFQSxVQUFVO0FBQUEsUUFDUjtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUVBLFdBQVc7QUFBQTtBQUFBLElBRVgsV0FBVztBQUFBLEVBQ2I7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVM7QUFBQSxNQUNQO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sSUFBSTtBQUFBO0FBQUEsTUFFRixPQUFPLENBQUMsSUFBSTtBQUFBLElBQ2Q7QUFBQSxFQUNGO0FBQUEsRUFDQSxXQUFXO0FBQUE7QUFBQSxFQUVYLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssUUFBUSxrQ0FBVyxLQUFLO0FBQUEsSUFDL0I7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUVBLFFBQVE7QUFBQSxJQUNOLHdDQUF3QyxLQUFLLFVBQVUsTUFBTTtBQUFBLElBQzdELDRCQUE0QixLQUFLLFVBQVUsUUFBUSxJQUFJLGdCQUFnQixPQUFPO0FBQUEsRUFDaEY7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
