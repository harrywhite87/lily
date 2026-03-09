import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Form Elements/Input',
  component: Input,
  args: {
    placeholder: 'Enter value…',
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const WithValue: Story = {
  args: { defaultValue: 'Hello, world' },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Read only' },
};
