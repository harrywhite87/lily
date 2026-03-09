import type { Meta, StoryObj } from '@storybook/react';
import { Select } from './Select';

const meta: Meta<typeof Select> = {
  title: 'Form Elements/Select',
  component: Select,
  args: {
    children: undefined,
  },
  render: (args) => (
    <Select {...args}>
      <option value="opt1">Option 1</option>
      <option value="opt2">Option 2</option>
      <option value="opt3">Option 3</option>
    </Select>
  ),
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {};

export const Disabled: Story = {
  render: (args) => (
    <Select {...args} disabled>
      <option>Locked choice</option>
    </Select>
  ),
};
