/* ─── Public API ─── */

export { ParticlesMorph } from './ParticlesMorph';
export { ParticleCloud } from './ParticleCloud';
export { Swarm } from './Swarm';
export {
  DEFAULT_PARTICLE_CLOUD_TUNING,
  createParticleCloudInspectorSurface,
} from './inspector';
export {
  sampleSurfacePoints,
  extractGeometry,
  normalizeGeometry,
} from './geometry';

export type {
  MeshSource,
  EasingFn,
  TransitionRequest,
  ParticleMorphHandle,
  ParticlesMorphProps,
  ParticleCloudProps,
  ParticleCloudTuning,
  SwarmProps,
} from './types';
