import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/lilypad-demo/',
  plugins: [react()],
  resolve: {
    alias: {
      '@lilypad/shared': path.resolve(__dirname, '../../libs/shared/src'),
      '@lilypad/scroll': path.resolve(__dirname, '../../libs/scroll/src'),
      '@lilypad/animation': path.resolve(__dirname, '../../libs/animation/src'),
      '@lilypad/debug': path.resolve(__dirname, '../../libs/debug/src'),
      '@lilypad/three-assets': path.resolve(__dirname, '../../libs/three/assets/src'),
      '@lilypad/three-particles': path.resolve(__dirname, '../../libs/three/particles/src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  assetsInclude: ['**/*.glb'],
  test: {
    globals: true,
    passWithNoTests: true,
  },
});
