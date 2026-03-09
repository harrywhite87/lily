import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import { useControlsStore, extractValues } from './store';
import { ControlsPanel } from './ControlsPanel';
import type { ControlSchema } from './types';

/**
 * A realistic mixed-control schema that mirrors what a Three.js demo
 * might register via useDebugControls.
 */
const DEMO_SCHEMA: ControlSchema = {
  particleCount: { value: 2000, min: 100, max: 10000, step: 100, label: 'Particle Count' },
  speed: { value: 1.5, min: 0, max: 10, step: 0.1, label: 'Speed' },
  autoRotate: { value: true, label: 'Auto Rotate' },
  glowColor: { value: '#3b82f6', label: 'Glow Color' },
  blendMode: {
    type: 'select',
    value: 'additive',
    options: ['additive', 'normal', 'multiply', 'screen'],
    label: 'Blend Mode',
  },
  fps: { value: 60, editable: false as const, label: 'FPS' },
  reset: { type: 'button' as const, label: 'Reset', onClick: () => console.log('Reset clicked') },
  advanced: {
    type: 'folder' as const,
    title: 'Advanced',
    collapsed: false,
    controls: {
      turbulence: { value: 0.3, min: 0, max: 1, step: 0.01, label: 'Turbulence' },
      decay: { value: 0.95, min: 0, max: 1, step: 0.01, label: 'Decay' },
      wireframe: { value: false, label: 'Wireframe' },
    },
  },
};

/**
 * Wrapper that seeds the Zustand store before rendering the panel.
 * This simulates what useDebugControls does at runtime.
 */
function ControlsPanelStory() {
  useEffect(() => {
    const store = useControlsStore.getState();
    store.register('Fusion Reactor', DEMO_SCHEMA, 0);
    return () => store.unregister('Fusion Reactor');
  }, []);

  return (
    <div style={{ width: 300, padding: 8 }}>
      <ControlsPanel />
    </div>
  );
}

const meta: Meta<typeof ControlsPanelStory> = {
  title: 'Debug Controls/ControlsPanel',
  component: ControlsPanelStory,
};

export default meta;
type Story = StoryObj<typeof ControlsPanelStory>;

export const MixedControls: Story = {};
