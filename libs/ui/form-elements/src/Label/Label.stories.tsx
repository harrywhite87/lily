import type { Meta, StoryObj } from '@storybook/react';
import { Label } from './Label';

const meta: Meta<typeof Label> = {
  title: 'Form Elements/Label',
  component: Label,
  args: {
    children: 'Field label',
  },
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {};

export const Required: Story = {
  args: { required: true, children: 'Required field' },
};
