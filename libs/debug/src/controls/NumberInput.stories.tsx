import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { NumberInput } from './widgets';
import type { NumberControl } from './types';

/* ── Wrapper to make the controlled component interactive ── */
function NumberInputStory(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
}) {
  const [value, setValue] = useState(props.value);
  const control: NumberControl = {
    value: props.value,
    min: props.min,
    max: props.max,
    step: props.step,
    label: props.label,
  };
  return (
    <NumberInput
      name="number"
      control={control}
      value={value}
      onChange={setValue}
    />
  );
}

const meta: Meta<typeof NumberInputStory> = {
  title: 'Debug Controls/NumberInput',
  component: NumberInputStory,
  args: {
    label: 'Speed',
    value: 1.5,
    min: 0,
    max: 10,
    step: 0.1,
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
type Story = StoryObj<typeof NumberInputStory>;

export const Default: Story = {};

export const FineStep: Story = {
  args: {
    label: 'Opacity',
    value: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
  },
};

export const WideRange: Story = {
  args: {
    label: 'Particle Count',
    value: 500,
    min: 0,
    max: 10000,
    step: 100,
  },
};
