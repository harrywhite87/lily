import * as THREE from 'three';

export type ParticleMeshPresetType = 'procedural' | 'glb' | 'upload';

export interface ParticleMeshPreset {
  label: string;
  value: string;
  type: ParticleMeshPresetType;
  factory?: () => THREE.BufferGeometry;
}

export const DEFAULT_PARTICLE_MESH_PRESETS: ParticleMeshPreset[] = [
  {
    label: 'TorusKnot',
    value: 'torusknot',
    type: 'procedural',
    factory: () => new THREE.TorusKnotGeometry(1.0, 0.32, 260, 36),
  },
  {
    label: 'Icosahedron',
    value: 'icosahedron',
    type: 'procedural',
    factory: () => new THREE.IcosahedronGeometry(1.25, 4),
  },
  {
    label: 'Sphere',
    value: 'sphere',
    type: 'procedural',
    factory: () => new THREE.SphereGeometry(1.2, 64, 64),
  },
  {
    label: 'Torus',
    value: 'torus',
    type: 'procedural',
    factory: () => new THREE.TorusGeometry(1.0, 0.4, 32, 100),
  },
  { label: 'Submarine', value: 'submarine.glb', type: 'glb' },
  { label: 'Table', value: 'Table.glb', type: 'glb' },
  { label: 'Shipyard', value: 'shipyard.glb', type: 'glb' },
  { label: 'Upload...', value: '__upload__', type: 'upload' },
];

export const DEFAULT_PARTICLE_MESH_A = 'TorusKnot';
export const DEFAULT_PARTICLE_MESH_B = 'Icosahedron';
export const DEFAULT_PARTICLE_POSITION_A = new THREE.Vector3(-1.5, 0, 0);
export const DEFAULT_PARTICLE_POSITION_B = new THREE.Vector3(1.5, 0, 0);
