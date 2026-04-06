
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    react(),
    legacy({
      // Chrome 95+ supports almost everything, but legacy plugin will ensure 
      // polyfills for things like top-level await or newer JS features if needed.
      targets: ['Chrome >= 95', 'Safari >= 13', 'iOS >= 13', 'Android >= 9'],
      // We don't need heavy polyfills for Chrome 95, so we keep it light
      polyfills: ['es.promise.finally', 'es/map', 'es/set'],
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
