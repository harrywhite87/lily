import type { ObjectInspectorSurface } from '@lilypad/shared';
import type { ParticleCloudTuning } from './types';

export const DEFAULT_PARTICLE_CLOUD_TUNING: ParticleCloudTuning = {
  count: 30_000,
  pointSize: 2.0,
  drift: 0.15,
  pulse: 1.0,
  color: '#ffffff',
  opacity: 0.8,
};

export function createParticleCloudInspectorSurface(params: {
  title?: string;
  get: () => ParticleCloudTuning;
  set: (patch: Partial<ParticleCloudTuning>) => void;
}): ObjectInspectorSurface {
  const { get, set } = params;

  return {
    title: params.title ?? 'Particle Cloud',
    fields: [
      {
        kind: 'number',
        key: 'count',
        label: 'Particle Count',
        min: 500,
        max: 200_000,
        step: 500,
        get: () => get().count,
        set: (value) => set({ count: Math.max(1, Math.round(value)) }),
      },
      {
        kind: 'number',
        key: 'pointSize',
        label: 'Point Size',
        min: 0.1,
        max: 64,
        step: 0.1,
        get: () => get().pointSize,
        set: (value) => set({ pointSize: value }),
      },
      {
        kind: 'number',
        key: 'drift',
        label: 'Drift',
        min: 0,
        max: 5,
        step: 0.01,
        get: () => get().drift,
        set: (value) => set({ drift: value }),
      },
      {
        kind: 'number',
        key: 'pulse',
        label: 'Pulse',
        min: 0,
        max: 8,
        step: 0.01,
        get: () => get().pulse,
        set: (value) => set({ pulse: value }),
      },
      {
        kind: 'color',
        key: 'color',
        label: 'Color',
        get: () => get().color,
        set: (value) => set({ color: value }),
      },
      {
        kind: 'number',
        key: 'opacity',
        label: 'Opacity',
        min: 0,
        max: 1,
        step: 0.01,
        get: () => get().opacity,
        set: (value) => set({ opacity: value }),
      },
    ],
  };
}
