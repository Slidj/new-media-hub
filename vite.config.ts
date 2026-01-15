
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Важливо для GitHub Pages та Mini Apps
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
