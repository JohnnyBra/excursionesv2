import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // base: './', // ELIMINADO: Usar ruta absoluta por defecto para evitar problemas con assets públicos
  server: {
    port: 3006,
    strictPort: true,
    proxy: {
      // Redirige todas las peticiones que empiecen por /api al backend en puerto 3005
      '/api': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});