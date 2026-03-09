import type { Meta, StoryObj } from '@storybook/react';
import { ReadOnlyRow } from './widgets';
import type { ReadOnlyControl } from './types';

function ReadOnlyRowStory(props: {
  label: string;
  value: string | number;
}) {
  const control: ReadOnlyControl = {
    value: props.value,
    editable: false,
    label: props.label,
  };
  return (
    <ReadOnlyRow
      name="readonly"
      control={control}
      value={props.value}
    />
  );
}

const meta: Meta<typeof ReadOnlyRowStory> = {
  title: 'Debug Controls/ReadOnlyRow',
  component: ReadOnlyRowStory,
  args: {
    label: 'FPS',
    value: 60,
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
type Story = StoryObj<typeof ReadOnlyRowStory>;

export const NumericValue: Story = {};

export const StringValue: Story = {
  args: {
    label: 'Renderer',
    value: 'WebGL2',
  },
};
