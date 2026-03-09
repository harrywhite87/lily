import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SelectInput } from './widgets';
import type { SelectControl } from './types';

function SelectInputStory(props: {
  label: string;
  value: string;
  options: string[];
}) {
  const [value, setValue] = useState(props.value);
  const control: SelectControl = {
    type: 'select',
    value: props.value,
    options: props.options,
    label: props.label,
  };
  return (
    <SelectInput
      name="select"
      control={control}
      value={value}
      onChange={setValue}
    />
  );
}

const meta: Meta<typeof SelectInputStory> = {
  title: 'Debug Controls/SelectInput',
  component: SelectInputStory,
  args: {
    label: 'Blend Mode',
    value: 'additive',
    options: ['additive', 'normal', 'multiply', 'screen'],
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
type Story = StoryObj<typeof SelectInputStory>;

export const Default: Story = {};
