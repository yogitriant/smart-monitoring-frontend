import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // ⬅️ ini wajib untuk akses dari IP lokal
    port: 5173, // opsional, default juga 5173
  },
});
