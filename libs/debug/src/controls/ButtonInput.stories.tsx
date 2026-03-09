import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { ButtonInput } from './widgets';
import type { ButtonControl } from './types';

function ButtonInputStory(props: { label: string; onClick: () => void }) {
  const control: ButtonControl = {
    type: 'button',
    label: props.label,
    onClick: props.onClick,
  };
  return <ButtonInput control={control} />;
}

const meta: Meta<typeof ButtonInputStory> = {
  title: 'Debug Controls/ButtonInput',
  component: ButtonInputStory,
  args: {
    label: 'Reset Simulation',
    onClick: fn(),
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
type Story = StoryObj<typeof ButtonInputStory>;

export const Default: Story = {};
