import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { BooleanToggle } from './widgets';
import type { BooleanControl } from './types';

function BooleanToggleStory(props: { label: string; value: boolean }) {
  const [value, setValue] = useState(props.value);
  const control: BooleanControl = { value: props.value, label: props.label };
  return (
    <BooleanToggle
      name="toggle"
      control={control}
      value={value}
      onChange={setValue}
    />
  );
}

const meta: Meta<typeof BooleanToggleStory> = {
  title: 'Debug Controls/BooleanToggle',
  component: BooleanToggleStory,
  args: {
    label: 'Auto Rotate',
    value: false,
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
type Story = StoryObj<typeof BooleanToggleStory>;

export const Off: Story = {};

export const On: Story = {
  args: { value: true },
};
