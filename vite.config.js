import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },

  server: {
    host: '0.0.0.0', // Allows listening on all network interfaces
    port: 5173, // Vite's default port, you can change it
    strictPort: true, // Prevents Vite from automatically changing the port
    hmr: {
      clientPort: 5173, // Ensures the HMR port is the same as the server (for hot reload)
    },
    proxy: {
      // Proxy all requests to '/api' to another server
      '/grafana': {
      
        target: `http://192.168.43.229:3000/d-solo/be5aloxll4s1sd/smartbin-monitoring`, // The URL of the remote server
        changeOrigin: true, // Necessary to change the "Host" header to the target URL
        rewrite: (path) => path.replace(/^\/grafana/, ''), // Rewrite the path if needed
        logLevel: 'debug', // Enable debugging for proxy requests
        onError(err, req, res) {
          console.error('[Proxy Error /api]:', err.message);
        },
      },

    },
  },
})
