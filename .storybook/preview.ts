import type { Preview } from '@storybook/react';

/* ── Load style-baseline globally ── */
import '../libs/style-baseline/src/tokens.scss';
import '../libs/style-baseline/src/theme-dark.scss';
import '../libs/style-baseline/src/theme-light.scss';
import '../libs/style-baseline/src/reset.scss';
import '../libs/style-baseline/src/typography.scss';
import '../libs/style-baseline/src/globals.scss';

const THEME_BG: Record<string, string> = {
  dark: '#171717',
  light: '#fafafa',
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Global light / dark theme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'dark', icon: 'moon', title: 'Dark' },
          { value: 'light', icon: 'sun', title: 'Light' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'light';
      document.documentElement.setAttribute('data-theme', theme);
      document.body.style.backgroundColor = THEME_BG[theme] ?? THEME_BG.light;
      return Story();
    },
  ],
};

export default preview;
