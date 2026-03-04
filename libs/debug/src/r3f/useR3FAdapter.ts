import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useDebugStore } from '../core/store';
import type { SceneNode, CameraState } from './types';

/* ─── helpers ─── */

function buildSceneGraph(scene: THREE.Object3D): SceneNode[] {
  const nodes: SceneNode[] = [];
  scene.traverse((obj) => {
    nodes.push({
      uuid: obj.uuid,
      name: obj.name || '(unnamed)',
      type: obj.type,
      parentUuid: obj.parent ? obj.parent.uuid : null,
      childrenUuids: obj.children.map((c) => c.uuid),
      visible: obj.visible,
    });
  });
  return nodes;
}

const RAD2DEG = 180 / Math.PI;

function getCameraState(
  camera: THREE.Camera,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controls?: any,
): CameraState {
  const pos: [number, number, number] = [
    camera.position.x,
    camera.position.y,
    camera.position.z,
  ];
  const rot: [number, number, number] = [
    camera.rotation.x * RAD2DEG,
    camera.rotation.y * RAD2DEG,
    camera.rotation.z * RAD2DEG,
  ];

  const isPerspective = camera instanceof THREE.PerspectiveCamera;
  const fov = isPerspective ? camera.fov : 0;

  const state: CameraState = {
    position: pos,
    rotation: rot,
    fov,
    near: isPerspective ? camera.near : 0.1,
    far: isPerspective ? camera.far : 1000,
  };

  // OrbitControls: detect target from the controls object
  if (controls?.target instanceof THREE.Vector3) {
    state.target = [controls.target.x, controls.target.y, controls.target.z];
  }

  return state;
}

/* ─── adapter hook ─── */

/**
 * R3F adapter that samples renderer metrics every frame and builds
 * a scene-graph snapshot at a throttled rate.
 */
export function useR3FAdapter(opts: { sceneGraphHz: number }) {
  const { gl, scene, camera, controls } = useThree();
  const setMetrics = useDebugStore((s) => s.setMetrics);
  const setSceneGraph = useDebugStore((s) => s.setSceneGraph);
  const setSceneRef = useDebugStore((s) => s.setSceneRef);

  // Push scene ref into store so HTML-portal panels can access it
  const sceneStored = useRef(false);
  if (!sceneStored.current) {
    setSceneRef(scene);
    sceneStored.current = true;
  }

  // FPS smoothing (exponential moving average)
  const fpsRef = useRef({ lastT: performance.now(), emaFps: 0 });

  // Throttle scene graph updates
  const sgRef = useRef({
    last: 0,
    intervalMs: 1000 / Math.max(1, opts.sceneGraphHz),
  });

  useFrame(() => {
    const now = performance.now();
    const dt = now - fpsRef.current.lastT;
    fpsRef.current.lastT = now;

    const instFps = dt > 0 ? 1000 / dt : 0;
    const alpha = 0.08;
    fpsRef.current.emaFps = fpsRef.current.emaFps
      ? fpsRef.current.emaFps + alpha * (instFps - fpsRef.current.emaFps)
      : instFps;

    const info = gl.info;
    const render = info.render;

    setMetrics({
      fps: fpsRef.current.emaFps,
      frameMs: dt,
      drawCalls: render.calls,
      triangles: render.triangles,
      points: render.points,
      lines: render.lines,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      camera: getCameraState(camera, controls),
    });

    // Scene graph snapshot (throttled)
    if (now - sgRef.current.last >= sgRef.current.intervalMs) {
      sgRef.current.last = now;
      setSceneGraph(buildSceneGraph(scene));
    }
  });
}
