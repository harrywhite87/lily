import { useMemo, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useDebugControls } from '@lilypad/debug';
import type { FolderControl } from '@lilypad/debug';
import {
  resolveWaterOverrides,
  sampleWaterHeight,
  sampleWaterNormal,
  type WaterOverrides,
} from '../shaders/WaterSurface';

type GLTFResult = {
  scene: THREE.Group;
};

interface WaveSubmarineProps {
  url?: string;
  overrides?: WaterOverrides;
  scale?: number;
  modelYawOffset?: number;
}

export function WaveSubmarine({
  url = `${import.meta.env.BASE_URL}submarine.glb`,
  overrides,
  scale = 0.5,
  modelYawOffset = -Math.PI / 2,
}: WaveSubmarineProps) {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useGLTF(url) as unknown as GLTFResult;

  // Accumulated simulation time (independent of clock, supports pause/resume)
  const accTimeRef = useRef(0);
  const lastWallRef = useRef<number | null>(null);
  const resetRef = useRef(false);

  const doReset = useCallback(() => {
    resetRef.current = true;
  }, []);

  const [subCtrl] = useDebugControls(
    'Submarine',
    () => ({
      Controls: {
        type: 'folder' as const,
        title: 'Controls',
        controls: {
          playing: { value: true },
          speed: { value: 1.25, min: 0.0, max: 10.0, step: 0.05 },
          angle: { value: 180, min: -180, max: 180, step: 1 },
          lateralAmplitude: { value: 4.0, min: 0.0, max: 15.0, step: 0.1 },
          verticalOffset: { value: 0.12, min: -1.0, max: 1.0, step: 0.01 },
        },
      } satisfies FolderControl,
      '↺ Reset': { type: 'button' as const, label: '↺ Reset', onClick: doReset },
    }),
    [doReset],
  );

  const waveConfig = useMemo(
    () => resolveWaterOverrides(overrides),
    [
      overrides?.waveScale,
      overrides?.waveDepth,
      overrides?.waveDrag,
      overrides?.waveSpeed,
      overrides?.reflectionStrength,
      overrides?.scatterStrength,
      overrides?.sunIntensity,
      overrides?.exposure,
      overrides?.normalEpsilon,
      overrides?.normalSmooth,
      overrides?.fogNear,
      overrides?.fogFar,
      overrides?.fogStrength,
    ],
  );

  const model = useMemo(() => gltf.scene.clone(true), [gltf]);

  const tmp = useMemo(
    () => ({
      position: new THREE.Vector3(),
      nextPosition: new THREE.Vector3(),
      up: new THREE.Vector3(0, 1, 0),
      forward: new THREE.Vector3(1, 0, 0),
      right: new THREE.Vector3(0, 0, 1),
      forwardOrtho: new THREE.Vector3(1, 0, 0),
      basis: new THREE.Matrix4(),
      modelFix: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), modelYawOffset),
    }),
    [modelYawOffset],
  );

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;

    const playing = (subCtrl as Record<string, unknown>).playing as boolean ?? true;
    const speed = (subCtrl as Record<string, unknown>).speed as number ?? 1.25;
    const angleDeg = (subCtrl as Record<string, unknown>).angle as number ?? 180;
    const lateralAmplitude = (subCtrl as Record<string, unknown>).lateralAmplitude as number ?? 4.0;
    const verticalOffset = (subCtrl as Record<string, unknown>).verticalOffset as number ?? 0.12;

    // Handle reset signal from button
    if (resetRef.current) {
      resetRef.current = false;
      accTimeRef.current = 0;
      lastWallRef.current = null;
    }

    const wallTime = clock.getElapsedTime();

    if (lastWallRef.current === null) {
      lastWallRef.current = wallTime;
    }

    const delta = wallTime - lastWallRef.current;
    lastWallRef.current = wallTime;

    if (playing) {
      accTimeRef.current += delta;
    }

    const t = accTimeRef.current;
    const angleRad = (angleDeg * Math.PI) / 180;
    const dirX = Math.cos(angleRad);
    const dirZ = Math.sin(angleRad);
    // Perpendicular direction for lateral sinusoidal drift
    const perpX = -Math.sin(angleRad);
    const perpZ = Math.cos(angleRad);

    const lat = Math.sin(t * 0.15) * lateralAmplitude;
    const x = t * speed * dirX + lat * perpX;
    const z = t * speed * dirZ + lat * perpZ;
    const y = sampleWaterHeight(x, z, t, waveConfig) + verticalOffset;

    const dt = 0.12;
    const lat2 = Math.sin((t + dt) * 0.15) * lateralAmplitude;
    const x2 = (t + dt) * speed * dirX + lat2 * perpX;
    const z2 = (t + dt) * speed * dirZ + lat2 * perpZ;
    const y2 = sampleWaterHeight(x2, z2, t + dt, waveConfig) + verticalOffset;

    tmp.position.set(x, y, z);
    tmp.nextPosition.set(x2, y2, z2);

    sampleWaterNormal(x, z, t, waveConfig, waveConfig.normalEpsilon, tmp.up);
    tmp.forward.copy(tmp.nextPosition).sub(tmp.position).normalize();
    tmp.right.copy(tmp.forward).cross(tmp.up).normalize();
    tmp.forwardOrtho.copy(tmp.up).cross(tmp.right).normalize();

    if (tmp.right.lengthSq() < 1e-6) {
      tmp.right.set(0, 0, 1);
    }
    if (tmp.forwardOrtho.lengthSq() < 1e-6) {
      tmp.forwardOrtho.set(1, 0, 0);
    }

    tmp.basis.makeBasis(tmp.right, tmp.up, tmp.forwardOrtho);
    group.quaternion.setFromRotationMatrix(tmp.basis);
    group.quaternion.multiply(tmp.modelFix);
    group.position.copy(tmp.position);
    group.rotateOnAxis(tmp.forwardOrtho, Math.sin(t * 0.8) * 0.01);
  });

  return (
    <group ref={groupRef} scale={scale}>
      {model ? (
        <primitive object={model} />
      ) : (
        <mesh>
          <capsuleGeometry args={[0.25, 1.6, 8, 16]} />
          <meshStandardMaterial color="#2e2f33" metalness={0.35} roughness={0.55} />
        </mesh>
      )}
    </group>
  );
}

useGLTF.preload(`${import.meta.env.BASE_URL}submarine.glb`);
