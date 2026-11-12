import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 900,
      rolldownOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('/node_modules/three/')) {
                return 'vendor-three-core';
              }
              if (
                id.includes('@react-three') ||
                id.includes('three-stdlib') ||
                id.includes('postprocessing') ||
                id.includes('n8ao') ||
                id.includes('maath') ||
                id.includes('meshline') ||
                id.includes('troika') ||
                id.includes('react-reconciler') ||
                id.includes('its-fine') ||
                id.includes('suspend-react') ||
                id.includes('zustand') ||
                id.includes('camera-controls')
              ) {
                return 'vendor-three-eco';
              }
              if (id.includes('/gsap/') || id.includes('/lenis/')) {
                return 'vendor-motion';
              }
              if (
                id.includes('/node_modules/react/') ||
                id.includes('/node_modules/react-dom/') ||
                id.includes('/node_modules/react-router') ||
                id.includes('/node_modules/scheduler/')
              ) {
                return 'vendor-react';
              }
            }
            return undefined;
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
