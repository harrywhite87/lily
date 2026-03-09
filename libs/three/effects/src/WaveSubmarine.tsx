/// <reference types="vite/client" />
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useDebugControls } from '@lilypad/debug';
import type { FolderControl } from '@lilypad/debug';
import {
  resolveWaterOverrides,
  sampleWaterHeightResolved,
  sampleWaterNormalResolved,
  type WaterOverrides,
  type HullDebugInfo,
} from './WaterSurface';

type GLTFResult = {
  scene: THREE.Group;
};

const CONTROL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

interface WaveSubmarineProps {
  url?: string;
  overrides?: WaterOverrides;
  scale?: number | THREE.Vector3Tuple;
  defaultModelYawOffset?: number;
  debugHull?: React.RefObject<HullDebugInfo | null>;
}

function useKeyboard() {
  const keys = useRef<Set<string>>(new Set());

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (!CONTROL_KEYS.has(e.code)) {
        return;
      }
      e.preventDefault();
      keys.current.add(e.code);
    };
    const onUp = (e: KeyboardEvent) => {
      if (!CONTROL_KEYS.has(e.code)) {
        return;
      }
      e.preventDefault();
      keys.current.delete(e.code);
    };
    const onBlur = () => keys.current.clear();

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  return keys;
}

export function WaveSubmarine({
  url = `${import.meta.env.BASE_URL}submarine.glb`,
  overrides,
  scale = [20, 20, 20],
  defaultModelYawOffset = Math.PI / 2,
  debugHull,
}: WaveSubmarineProps) {
  const groupRef = useRef<THREE.Group>(null);
  const arrowRef = useRef<THREE.ArrowHelper>(null);
  const gltf = useGLTF(url) as unknown as GLTFResult;

  const headingRef = useRef(0);
  const velocityRef = useRef(0);
  const posRef = useRef(new THREE.Vector3(0, 0, 0));
  const lastWallRef = useRef<number | null>(null);
  const accTimeRef = useRef(0);
  const resetRef = useRef(false);

  const keys = useKeyboard();

  const doReset = useCallback(() => {
    resetRef.current = true;
  }, []);

  const [subCtrl] = useDebugControls(
    'Submarine',
    () => ({
      Movement: {
        type: 'folder' as const,
        title: 'Movement',
        controls: {
          maxSpeed: { value: 5.0, min: 0.5, max: 20.0, step: 0.25 },
          acceleration: { value: 2.5, min: 0.5, max: 15.0, step: 0.25 },
          deceleration: { value: 3.0, min: 0.5, max: 15.0, step: 0.25 },
          reverseRatio: { value: 0.4, min: 0.0, max: 1.0, step: 0.05 },
          turnRate: { value: 1.8, min: 0.2, max: 5.0, step: 0.1 },
          turnDecay: { value: 0.5, min: 0.0, max: 1.0, step: 0.05 },
        },
      } satisfies FolderControl,
      'Wave Response': {
        type: 'folder' as const,
        title: 'Wave Response',
        controls: {
          hullLength: { value: 20.0, min: 0.0, max: 24.0, step: 0.1 },
          hullWidth: { value: 1.5, min: 0.0, max: 8.0, step: 0.1 },
          hullSamples: { value: 8, min: 4, max: 16, step: 1 },
          waveInfluence: { value: 1.0, min: 0.0, max: 2.0, step: 0.05 },
          verticalOffset: { value: 0.12, min: -1.0, max: 1.0, step: 0.01 },
          showHullDebug: { value: false },
        },
      } satisfies FolderControl,
      Alignment: {
        type: 'folder' as const,
        title: 'Alignment',
        controls: {
          showForwardArrow: { value: false },
          modelYawOffset: { value: defaultModelYawOffset, min: -Math.PI, max: Math.PI, step: 0.01 },
        },
      } satisfies FolderControl,
      'Reset': { type: 'button' as const, label: 'Reset', onClick: doReset },
    }),
    [doReset, defaultModelYawOffset],
  );

  const waveConfig = useMemo(() => resolveWaterOverrides(overrides), [overrides]);
  const model = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of materials) {
          (m as THREE.MeshStandardMaterial).fog = true;
        }
      }
    });
    return cloned;
  }, [gltf]);

  const tmp = useMemo(
    () => ({
      up: new THREE.Vector3(0, 1, 0),
      forward: new THREE.Vector3(0, 0, -1),
      right: new THREE.Vector3(1, 0, 0),
      forwardOrtho: new THREE.Vector3(0, 0, -1),
      basisZ: new THREE.Vector3(),
      blendedUp: new THREE.Vector3(0, 1, 0),
      worldUp: new THREE.Vector3(0, 1, 0),
      sampleNormal: new THREE.Vector3(),
      basis: new THREE.Matrix4(),
      modelFix: new THREE.Quaternion(),
      arrowDir: new THREE.Vector3(),
    }),
    [],
  );

  const avgWaveHeight = useCallback(
    (cx: number, cz: number, t: number, heading: number, hLen: number, hWid: number, samples: number) => {
      let sum = sampleWaterHeightResolved(cx, cz, t, waveConfig);
      let count = 1;
      const halfLen = hLen * 0.5;
      const halfWid = hWid * 0.5;

      if (halfLen > 0.01 || halfWid > 0.01) {
        const cosH = Math.cos(heading);
        const sinH = Math.sin(heading);
        const step = (Math.PI * 2) / samples;

        for (let i = 0; i < samples; i += 1) {
          const angle = i * step;
          const lx = Math.cos(angle) * halfLen;
          const lz = Math.sin(angle) * halfWid;
          const wx = cx + lx * cosH - lz * sinH;
          const wz = cz + lx * sinH + lz * cosH;
          sum += sampleWaterHeightResolved(wx, wz, t, waveConfig);
          count += 1;
        }
      }

      return sum / count;
    },
    [waveConfig],
  );

  const avgWaveNormal = useCallback(
    (cx: number, cz: number, t: number, heading: number, hLen: number, hWid: number, samples: number, target: THREE.Vector3) => {
      sampleWaterNormalResolved(cx, cz, t, waveConfig, waveConfig.normalEpsilon, target);
      let nx = target.x;
      let ny = target.y;
      let nz = target.z;
      let count = 1;
      const halfLen = hLen * 0.5;
      const halfWid = hWid * 0.5;

      if (halfLen > 0.01 || halfWid > 0.01) {
        const cosH = Math.cos(heading);
        const sinH = Math.sin(heading);
        const step = (Math.PI * 2) / samples;

        for (let i = 0; i < samples; i += 1) {
          const angle = i * step;
          const lx = Math.cos(angle) * halfLen;
          const lz = Math.sin(angle) * halfWid;
          const wx = cx + lx * cosH - lz * sinH;
          const wz = cz + lx * sinH + lz * cosH;
          sampleWaterNormalResolved(wx, wz, t, waveConfig, waveConfig.normalEpsilon, tmp.sampleNormal);
          nx += tmp.sampleNormal.x;
          ny += tmp.sampleNormal.y;
          nz += tmp.sampleNormal.z;
          count += 1;
        }
      }

      target.set(nx / count, ny / count, nz / count).normalize();
      return target;
    },
    [waveConfig, tmp.sampleNormal],
  );

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    const ctrl = subCtrl as Record<string, unknown>;
    const maxSpeed = Math.max((ctrl.maxSpeed as number) ?? 5.0, 0.001);
    const acceleration = (ctrl.acceleration as number) ?? 2.5;
    const deceleration = (ctrl.deceleration as number) ?? 3.0;
    const reverseRatio = (ctrl.reverseRatio as number) ?? 0.4;
    const turnRate = (ctrl.turnRate as number) ?? 1.8;
    const turnDecay = (ctrl.turnDecay as number) ?? 0.5;
    const hullLength = (ctrl.hullLength as number) ?? 4.0;
    const hullWidth = (ctrl.hullWidth as number) ?? 1.5;
    const hullSamples = Math.max(4, Math.round((ctrl.hullSamples as number) ?? 8));
    const waveInfluence = (ctrl.waveInfluence as number) ?? 1.0;
    const verticalOffset = (ctrl.verticalOffset as number) ?? 0.12;
    const showHullDebug = (ctrl.showHullDebug as boolean) ?? false;
    const showForwardArrow = (ctrl.showForwardArrow as boolean) ?? false;
    const modelYawOffset = (ctrl.modelYawOffset as number) ?? defaultModelYawOffset;

    if (resetRef.current) {
      resetRef.current = false;
      headingRef.current = 0;
      velocityRef.current = 0;
      posRef.current.set(0, 0, 0);
      accTimeRef.current = 0;
      lastWallRef.current = null;
    }

    const wallTime = clock.getElapsedTime();
    if (lastWallRef.current === null) {
      lastWallRef.current = wallTime;
    }
    const dt = Math.min(wallTime - lastWallRef.current, 0.1);
    lastWallRef.current = wallTime;
    accTimeRef.current += dt;
    const t = accTimeRef.current;

    const k = keys.current;
    const throttle = (k.has('ArrowUp') ? 1 : 0) - (k.has('ArrowDown') ? 1 : 0);
    const steer = (k.has('ArrowRight') ? 1 : 0) - (k.has('ArrowLeft') ? 1 : 0);

    let vel = velocityRef.current;
    const maxReverse = -maxSpeed * reverseRatio;

    if (throttle > 0) {
      vel = Math.min(vel + acceleration * dt, maxSpeed);
    } else if (throttle < 0) {
      vel = Math.max(vel - acceleration * dt, maxReverse);
    } else if (vel > 0) {
      vel = Math.max(vel - deceleration * dt, 0);
    } else if (vel < 0) {
      vel = Math.min(vel + deceleration * dt, 0);
    }
    velocityRef.current = vel;

    const speedFrac = Math.abs(vel) / maxSpeed;
    const turnAuthority = THREE.MathUtils.lerp(0.45, 1.0, Math.min(speedFrac, 1.0));
    const effectiveTurn = turnRate * Math.pow(turnAuthority, turnDecay);
    headingRef.current += steer * effectiveTurn * dt;

    const heading = headingRef.current;
    const dirX = Math.sin(heading);
    const dirZ = -Math.cos(heading);

    const pos = posRef.current;
    pos.x += dirX * vel * dt;
    pos.z += dirZ * vel * dt;

    const hullHeading = heading - Math.PI / 2;
    const avgHeight = avgWaveHeight(pos.x, pos.z, t, hullHeading, hullLength, hullWidth, hullSamples);
    const baseWaterLevel = -waveConfig.waveDepth;
    const waveY = THREE.MathUtils.lerp(baseWaterLevel, avgHeight, waveInfluence) + verticalOffset;
    pos.y = waveY;

    avgWaveNormal(pos.x, pos.z, t, hullHeading, hullLength, hullWidth, hullSamples, tmp.up);
    const normalBlend = Math.min(waveInfluence, 1.0);
    tmp.blendedUp.copy(tmp.worldUp).lerp(tmp.up, normalBlend).normalize();

    const lookAheadDist = Math.max(0.12, hullLength * 0.25);
    const x2 = pos.x + dirX * lookAheadDist;
    const z2 = pos.z + dirZ * lookAheadDist;
    const avgHeight2 = avgWaveHeight(x2, z2, t, hullHeading, hullLength, hullWidth, hullSamples);
    const waveY2 = THREE.MathUtils.lerp(baseWaterLevel, avgHeight2, waveInfluence) + verticalOffset;
    const pitchSlope = (waveY2 - waveY) / lookAheadDist;

    tmp.forward.set(dirX, pitchSlope, dirZ).normalize();
    tmp.right.crossVectors(tmp.forward, tmp.blendedUp);
    if (tmp.right.lengthSq() < 1e-6) {
      tmp.right.crossVectors(tmp.forward, tmp.worldUp);
    }
    if (tmp.right.lengthSq() < 1e-6) {
      tmp.right.set(1, 0, 0);
    } else {
      tmp.right.normalize();
    }

    tmp.forwardOrtho.crossVectors(tmp.blendedUp, tmp.right);
    if (tmp.forwardOrtho.lengthSq() < 1e-6) {
      tmp.forwardOrtho.set(dirX, 0, dirZ).normalize();
    } else {
      tmp.forwardOrtho.normalize();
    }

    // forwardOrtho is the world-forward direction (≈ local -Z).
    // makeBasis expects the local +Z column, which is the opposite.
    tmp.basisZ.copy(tmp.forwardOrtho).negate();
    tmp.basis.makeBasis(tmp.right, tmp.blendedUp, tmp.basisZ);
    group.quaternion.setFromRotationMatrix(tmp.basis);

    const rollAmount = -steer * speedFrac * 0.08;
    group.rotateZ(rollAmount);

    tmp.modelFix.setFromAxisAngle(tmp.worldUp, modelYawOffset);
    group.quaternion.multiply(tmp.modelFix);
    group.position.copy(pos);

    const info = debugHull?.current;
    if (info) {
      info.center.set(pos.x, pos.z);
      info.length = hullLength;
      info.width = hullWidth;
      info.heading = hullHeading;
      info.show = showHullDebug;
    }

    const arrow = arrowRef.current;
    if (arrow) {
      arrow.visible = showForwardArrow;
      if (showForwardArrow) {
        arrow.position.copy(pos);
        arrow.position.y += 0.5;
        tmp.arrowDir.copy(tmp.forwardOrtho);
        tmp.arrowDir.y = 0;
        if (tmp.arrowDir.lengthSq() < 1e-6) {
          tmp.arrowDir.set(dirX, 0, dirZ);
        }
        tmp.arrowDir.normalize();
        arrow.setDirection(tmp.arrowDir);
      }
    }
  });

  return (
    <>
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
      <arrowHelper
        ref={arrowRef}
        visible={false}
        args={[
          new THREE.Vector3(0, 0, -1),
          new THREE.Vector3(0, 0, 0),
          3,
          0x00ff88,
          0.6,
          0.3,
        ]}
      />
    </>
  );
}

useGLTF.preload(`${import.meta.env.BASE_URL}submarine.glb`);
