/// <reference types="vitest" />
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@lilypad/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  test: {
    globals: true,
  },
});
