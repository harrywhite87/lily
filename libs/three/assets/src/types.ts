import * as THREE from 'three';

/* ─── Asset kinds ─── */

export type AssetKind = 'primitive' | 'model' | 'texture' | 'material' | 'geometry';

export type AssetSource =
  | { kind: 'builtin' }
  | { kind: 'url'; url: string }
  | { kind: 'file'; file: File; objectUrl: string };

export type PrimitiveType =
  | 'box'
  | 'sphere'
  | 'plane'
  | 'torus'
  | 'cylinder'
  | 'cone';

/* ─── Asset records (metadata only — stored in Zustand) ─── */

export type AssetRecordBase = {
  id: string;
  name: string;
  kind: AssetKind;
  source: AssetSource;
  tags?: string[];
  createdAt: number;
};

export type PrimitiveAssetRecord = AssetRecordBase & {
  kind: 'primitive';
  primitive: PrimitiveType;
  defaults?: {
    position?: THREE.Vector3Tuple;
    rotation?: THREE.Vector3Tuple;
    scale?: THREE.Vector3Tuple;
  };
};

export type ModelAssetRecord = AssetRecordBase & {
  kind: 'model';
  formatHint?: 'glb' | 'gltf';
};

export type TextureAssetRecord = AssetRecordBase & {
  kind: 'texture';
};

export type MaterialAssetRecord = AssetRecordBase & {
  kind: 'material';
  /** Original Three.js material type, e.g. 'MeshStandardMaterial' */
  materialType?: string;
};

export type GeometryAssetRecord = AssetRecordBase & {
  kind: 'geometry';
};

export type AssetRecord =
  | PrimitiveAssetRecord
  | ModelAssetRecord
  | TextureAssetRecord
  | MaterialAssetRecord
  | GeometryAssetRecord;

/* ─── Loaded resources (kept in AssetManager cache, NOT in React state) ─── */

export type LoadedAsset =
  | { kind: 'primitive'; create: () => THREE.Object3D }
  | { kind: 'model'; scene: THREE.Object3D }
  | { kind: 'texture'; texture: THREE.Texture }
  | { kind: 'material'; material: THREE.Material }
  | { kind: 'geometry'; geometry: THREE.BufferGeometry };

/* ─── Material texture bundle ─── */

export type MaterialTextures = {
  map: THREE.Texture | null;
  normalMap: THREE.Texture | null;
  roughnessMap: THREE.Texture | null;
  metalnessMap: THREE.Texture | null;
};

export const EMPTY_TEXTURES: MaterialTextures = {
  map: null,
  normalMap: null,
  roughnessMap: null,
  metalnessMap: null,
};
