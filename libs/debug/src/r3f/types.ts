/* ─── Metrics ─── */

export type CameraState = {
  position: [number, number, number];
  rotation: [number, number, number];
  fov: number;
  near: number;
  far: number;
  target?: [number, number, number];
};

export type MetricsSnapshot = {
  fps: number;
  frameMs: number;
  drawCalls: number;
  triangles: number;
  points: number;
  lines: number;
  geometries: number;
  textures: number;
  camera: CameraState;
};

export const DEFAULT_METRICS: MetricsSnapshot = {
  fps: 0,
  frameMs: 0,
  drawCalls: 0,
  triangles: 0,
  points: 0,
  lines: 0,
  geometries: 0,
  textures: 0,
  camera: {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    fov: 50,
    near: 0.1,
    far: 1000,
  },
};

/* ─── Gizmo ─── */

export type GizmoMode = 'off' | 'translate' | 'rotate' | 'scale';

/* ─── Scene graph ─── */

export type SceneNode = {
  uuid: string;
  name: string;
  type: string;
  parentUuid: string | null;
  childrenUuids: string[];
  visible: boolean;
};
