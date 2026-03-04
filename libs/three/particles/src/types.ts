import type { MutableRefObject } from 'react';
import type * as THREE from 'three';

/* ─── MeshSource ─── */

/**
 * A geometry source for the particle morph.
 * - `BufferGeometry` — used directly
 * - `Object3D` — geometries extracted and merged via `extractGeometry()`
 * - `string` — treated as a URL, loaded via GLTFLoader
 */
export type MeshSource = THREE.BufferGeometry | THREE.Object3D | string;

/* ─── Transition ─── */

export type EasingFn = (t: number) => number;

export type TransitionRequest = {
  from: MeshSource;
  to: MeshSource;
  durationMs?: number;
  easing?: EasingFn;
};

/* ─── Imperative handle ─── */

export type ParticleMorphHandle = {
  /** Trigger an animated transition between two mesh sources. */
  transition: (req: TransitionRequest) => Promise<void>;
  /** Directly set the morph progress (0..1). */
  setProgress: (p: number) => void;
};

/* ─── Component props ─── */

export type ParticlesMorphProps = {
  from: THREE.BufferGeometry;
  to: THREE.BufferGeometry;
  count?: number;
  /** If provided, controls progress (0..1). If omitted and autoPlay is true, auto-animates. */
  progress?: number;
  /** Enable auto ping-pong animation (default: true when progress is not provided) */
  autoPlay?: boolean;
  pointSize?: number;
  turbulence?: number;
  color?: THREE.ColorRepresentation;
  opacity?: number;
  /** Auto-animation speed */
  speed?: number;
  /** Live position offset for the "from" mesh (read each frame) */
  fromOffset?: MutableRefObject<THREE.Vector3>;
  /** Live position offset for the "to" mesh (read each frame) */
  toOffset?: MutableRefObject<THREE.Vector3>;
};

/* ─── ParticleCloud (static, single geometry) ─── */

export type ParticleCloudProps = {
  /** The source geometry to sample particle positions from. */
  geometry: THREE.BufferGeometry;
  /** Optional name for scene graph selection. */
  name?: string;
  /** Number of particles (default: 30000) */
  count?: number;
  /** Point size (default: 2.0) */
  pointSize?: number;
  /** Noise-based drift amount (default: 0.15) */
  drift?: number;
  /** Alpha pulse speed — 0 for static, higher for faster (default: 1.0) */
  pulse?: number;
  color?: THREE.ColorRepresentation;
  opacity?: number;
  /** Position of the particle cloud group */
  position?: [number, number, number];
  /** Rotation (Euler) */
  rotation?: [number, number, number];
  /** Scale (uniform or per-axis) */
  scale?: number | [number, number, number];
  /**
   * Rotation speed (rad/s) of the dense swarm cluster around the ring.
   * Set to 0 (default) to disable the swarm effect entirely.
   */
  swarmSpeed?: number;
  /**
   * How tightly particles bunch toward the swarm center (0–1).
   * 0 = no bunching, 1 = maximum contraction. Default: 0.6
   */
  swarmFocus?: number;
  /**
   * Speed (rad/s) at which particles orbit around the ring.
   * Set to 0 (default) to disable orbital motion.
   */
  orbitSpeed?: number;
};

/* ─── Swarm (path-following flock) ─── */

export type SwarmProps = {
  /** Major radius of the orbit ring — distance from center to tube centerline (default: 3.0) */
  ringRadius?: number;
  /** Minor radius — half-thickness of the tube (default: 0.5) */
  tubeRadius?: number;
  /** Number of particles (default: 10000) */
  count?: number;
  /** Point size (default: 20) */
  pointSize?: number;
  /**
   * [min, max] orbit speed range (rad/s). Each particle gets a random speed
   * within this range so they all move at different rates. Default: [0.15, 0.6]
   */
  speedRange?: [number, number];
  /** Noise-based drift amount for organic feel (default: 0.12) */
  drift?: number;
  /** Alpha pulse speed (default: 1.0) */
  pulse?: number;
  color?: THREE.ColorRepresentation;
  opacity?: number;
  /**
   * Number of dense bands evenly spaced around the ring (default: 0 = uniform).
   * E.g. 3 creates three brighter, denser clusters as you look around the donut.
   */
  densityWaves?: number;
  /**
   * How strongly the density banding shows (0–1, default: 0.6).
   * 0 = no effect, 1 = troughs fade completely to dark.
   */
  densityStrength?: number;
  /** Position of the swarm group */
  position?: [number, number, number];
  /** Rotation (Euler) */
  rotation?: [number, number, number];
  /** Scale */
  scale?: number | [number, number, number];
};

export type ParticleCloudTuning = {
  count: number;
  pointSize: number;
  drift: number;
  pulse: number;
  color: string;
  opacity: number;
};
