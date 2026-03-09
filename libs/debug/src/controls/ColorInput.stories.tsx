import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ColorInput } from './widgets';
import type { ColorControl } from './types';

function ColorInputStory(props: { label: string; value: string }) {
  const [value, setValue] = useState(props.value);
  const control: ColorControl = { value: props.value, label: props.label };
  return (
    <ColorInput
      name="color"
      control={control}
      value={value}
      onChange={setValue}
    />
  );
}

const meta: Meta<typeof ColorInputStory> = {
  title: 'Debug Controls/ColorInput',
  component: ColorInputStory,
  args: {
    label: 'Glow Color',
    value: '#3b82f6',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 280, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ColorInputStory>;

export const Default: Story = {};

export const Warm: Story = {
  args: { label: 'Core Color', value: '#ef4444' },
};
