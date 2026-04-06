
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    react(),
    legacy({
      // Lowering targets to support very old Android 5 WebViews (Chrome 38+)
      targets: ['Android >= 5', 'Chrome >= 38', 'Safari >= 10', 'iOS >= 10'],
      // Add more comprehensive polyfills for older engines
      polyfills: true,
      modernPolyfills: true
    })
  ],
  base: './', // Важливо для GitHub Pages та Mini Apps
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Force unique filenames for every build to kill cache
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`
      }
    }
  }
});
