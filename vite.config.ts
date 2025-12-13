import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3003,
    strictPort: true, // Fallará si el 3003 está ocupado en lugar de buscar otro
  },
});