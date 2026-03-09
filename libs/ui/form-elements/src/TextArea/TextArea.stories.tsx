import type { Meta, StoryObj } from '@storybook/react';
import { TextArea } from './TextArea';

const meta: Meta<typeof TextArea> = {
  title: 'Form Elements/TextArea',
  component: TextArea,
  args: {
    placeholder: 'Write something…',
    rows: 4,
  },
};

export default meta;
type Story = StoryObj<typeof TextArea>;

export const Default: Story = {};

export const WithContent: Story = {
  args: { defaultValue: 'Multi-line\ncontent here' },
};
