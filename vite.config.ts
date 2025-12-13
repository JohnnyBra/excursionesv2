import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3006, // Puerto único para toda la app
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});