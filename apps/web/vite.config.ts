import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/lilypad-demo/',
  plugins: [react()],
  resolve: {
    alias: {
      '@lilypad/page-layout': path.resolve(
        __dirname,
        '../../libs/ui/page-layout/src',
      ),
      '@lilypad/shared': path.resolve(__dirname, '../../libs/shared/src'),
      '@lilypad/scroll': path.resolve(__dirname, '../../libs/scroll/src'),
      '@lilypad/animation': path.resolve(__dirname, '../../libs/animation/src'),
      '@lilypad/debug': path.resolve(__dirname, '../../libs/debug/src'),
      '@lilypad/debug-assets': path.resolve(
        __dirname,
        '../../libs/debug-assets/src',
      ),
      '@lilypad/three-assets': path.resolve(__dirname, '../../libs/three/assets/src'),
      '@lilypad/three-path-builder': path.resolve(
        __dirname,
        '../../libs/three/path-builder/src',
      ),
      '@lilypad/three-particle-cloud-demo': path.resolve(
        __dirname,
        '../../libs/three/particle-cloud-demo/src',
      ),
      '@lilypad/three-particles': path.resolve(__dirname, '../../libs/three/particles/src'),
      '@lilypad/three-particles-workbench': path.resolve(
        __dirname,
        '../../libs/three/particles-workbench/src',
      ),
      '@lilypad/three-model-runtime': path.resolve(
        __dirname,
        '../../libs/three/model-runtime/src',
      ),
      '@lilypad/three-swarm-demo': path.resolve(
        __dirname,
        '../../libs/three/swarm-demo/src',
      ),
      '@lilypad/three-battleboard': path.resolve(
        __dirname,
        '../../libs/three/battleboard/src',
      ),
      '@lilypad/three-effects': path.resolve(
        __dirname,
        '../../libs/three/effects/src',
      ),
      '@lilypad/three-scroll-scene': path.resolve(
        __dirname,
        '../../libs/three/scroll-scene/src',
      ),
      '@lilypad/three-fusion-reactor-demo': path.resolve(
        __dirname,
        '../../libs/three/fusion-reactor-demo/src',
      ),
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
