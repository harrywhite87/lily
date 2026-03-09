import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import path from 'path';

const config: StorybookConfig = {
  stories: [
    '../libs/debug/src/**/*.stories.@(ts|tsx)',
    '../libs/ui/**/src/**/*.stories.@(ts|tsx)',
  ],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (viteConfig) => {
    return mergeConfig(viteConfig, {
      resolve: {
        alias: {
          '@lilypad/debug': path.resolve(__dirname, '../libs/debug/src/index.ts'),
          '@lilypad/shared': path.resolve(__dirname, '../libs/shared/src/index.ts'),
          '@lilypad/form-elements': path.resolve(
            __dirname,
            '../libs/ui/form-elements/src/index.ts',
          ),
        },
      },
    });
  },
};

export default config;
