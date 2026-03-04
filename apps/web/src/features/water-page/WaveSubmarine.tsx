import { useMemo, useRef, useCallback, useEffect } from 'react';
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

/* ─── Keyboard state helper ─── */
function useKeyboard() {
  const keys = useRef<Set<string>>(new Set());

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => keys.current.add(e.code);
    const onUp = (e: KeyboardEvent) => keys.current.delete(e.code);
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

/* ─── Component ─── */
export function WaveSubmarine({
  url = `${import.meta.env.BASE_URL}submarine.glb`,
  overrides,
  scale = 0.5,
  modelYawOffset = -Math.PI / 2,
}: WaveSubmarineProps) {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useGLTF(url) as unknown as GLTFResult;

  /* Simulation state refs */
  const headingRef = useRef(Math.PI); // initial heading (radians)
  const velocityRef = useRef(0); // current scalar velocity
  const posRef = useRef(new THREE.Vector3(0, 0, 0));
  const lastWallRef = useRef<number | null>(null);
  const accTimeRef = useRef(0);
  const resetRef = useRef(false);

  const keys = useKeyboard();

  const doReset = useCallback(() => {
    resetRef.current = true;
  }, []);

  /* ─── Debug controls ─── */
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
          hullRadius: { value: 2.0, min: 0.0, max: 8.0, step: 0.1 },
          hullSamples: { value: 8, min: 4, max: 16, step: 1 },
          waveInfluence: { value: 1.0, min: 0.0, max: 2.0, step: 0.05 },
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

  /* ─── Pre-allocated scratch vectors for per-frame work ─── */
  const tmp = useMemo(
    () => ({
      up: new THREE.Vector3(0, 1, 0),
      forward: new THREE.Vector3(1, 0, 0),
      right: new THREE.Vector3(0, 0, 1),
      forwardOrtho: new THREE.Vector3(1, 0, 0),
      basis: new THREE.Matrix4(),
      blendedUp: new THREE.Vector3(0, 1, 0),
      worldUp: new THREE.Vector3(0, 1, 0),
      nextPos: new THREE.Vector3(),
      sampleNormal: new THREE.Vector3(),
      avgNormal: new THREE.Vector3(),
      modelFix: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), modelYawOffset),
    }),
    [modelYawOffset],
  );

  /**
   * Sample wave height averaged over a ring of points (hull footprint).
   * Returns the mean height across `samples` evenly-spaced points at `radius`
   * from (cx, cz), plus the centre point itself.
   */
  const avgWaveHeight = useCallback(
    (cx: number, cz: number, t: number, radius: number, samples: number) => {
      // Centre sample
      let sum = sampleWaterHeight(cx, cz, t, waveConfig);
      let count = 1;
      if (radius > 0.01) {
        const step = (Math.PI * 2) / samples;
        for (let i = 0; i < samples; i++) {
          const angle = i * step;
          sum += sampleWaterHeight(
            cx + Math.cos(angle) * radius,
            cz + Math.sin(angle) * radius,
            t,
            waveConfig,
          );
          count++;
        }
      }
      return sum / count;
    },
    [waveConfig],
  );

  /**
   * Sample wave normal averaged over the same hull footprint.
   * Accumulates normals and normalizes the result.
   */
  const avgWaveNormal = useCallback(
    (cx: number, cz: number, t: number, radius: number, samples: number, target: THREE.Vector3) => {
      // Centre normal
      sampleWaterNormal(cx, cz, t, waveConfig, waveConfig.normalEpsilon, target);
      let nx = target.x, ny = target.y, nz = target.z;
      let count = 1;
      if (radius > 0.01) {
        const step = (Math.PI * 2) / samples;
        for (let i = 0; i < samples; i++) {
          const angle = i * step;
          sampleWaterNormal(
            cx + Math.cos(angle) * radius,
            cz + Math.sin(angle) * radius,
            t,
            waveConfig,
            waveConfig.normalEpsilon,
            tmp.sampleNormal,
          );
          nx += tmp.sampleNormal.x;
          ny += tmp.sampleNormal.y;
          nz += tmp.sampleNormal.z;
          count++;
        }
      }
      target.set(nx / count, ny / count, nz / count).normalize();
      return target;
    },
    [waveConfig, tmp.sampleNormal],
  );

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;

    /* ── Read controls ── */
    const ctrl = subCtrl as Record<string, unknown>;
    const maxSpeed = (ctrl.maxSpeed as number) ?? 5.0;
    const acceleration = (ctrl.acceleration as number) ?? 2.5;
    const deceleration = (ctrl.deceleration as number) ?? 3.0;
    const reverseRatio = (ctrl.reverseRatio as number) ?? 0.4;
    const turnRate = (ctrl.turnRate as number) ?? 1.8;
    const turnDecay = (ctrl.turnDecay as number) ?? 0.5;
    const hullRadius = (ctrl.hullRadius as number) ?? 2.0;
    const hullSamples = Math.round((ctrl.hullSamples as number) ?? 8);
    const waveInfluence = (ctrl.waveInfluence as number) ?? 1.0;
    const verticalOffset = (ctrl.verticalOffset as number) ?? 0.12;

    /* ── Handle reset ── */
    if (resetRef.current) {
      resetRef.current = false;
      headingRef.current = Math.PI;
      velocityRef.current = 0;
      posRef.current.set(0, 0, 0);
      accTimeRef.current = 0;
      lastWallRef.current = null;
    }

    /* ── Delta time ── */
    const wallTime = clock.getElapsedTime();
    if (lastWallRef.current === null) lastWallRef.current = wallTime;
    const dt = Math.min(wallTime - lastWallRef.current, 0.1); // clamp to avoid huge jumps
    lastWallRef.current = wallTime;
    accTimeRef.current += dt;
    const t = accTimeRef.current;

    /* ── Read keyboard ── */
    const k = keys.current;
    const throttle =
      (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) -
      (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    const steer =
      (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0) -
      (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0);

    /* ── Velocity (momentum) ── */
    let vel = velocityRef.current;
    const maxReverse = -maxSpeed * reverseRatio;

    if (throttle > 0) {
      vel += acceleration * dt;
      if (vel > maxSpeed) vel = maxSpeed;
    } else if (throttle < 0) {
      vel -= acceleration * dt;
      if (vel < maxReverse) vel = maxReverse;
    } else {
      // Coast to stop (drag)
      if (vel > 0) {
        vel -= deceleration * dt;
        if (vel < 0) vel = 0;
      } else if (vel < 0) {
        vel += deceleration * dt;
        if (vel > 0) vel = 0;
      }
    }
    velocityRef.current = vel;

    /* ── Heading (turning) ── */
    const speedFrac = Math.abs(vel) / maxSpeed;
    const effectiveTurn = turnRate * Math.pow(Math.max(speedFrac, 0.05), turnDecay);
    headingRef.current += steer * effectiveTurn * dt;

    /* ── Integrate position ── */
    const heading = headingRef.current;
    const dirX = Math.cos(heading);
    const dirZ = Math.sin(heading);

    const pos = posRef.current;
    pos.x += dirX * vel * dt;
    pos.z += dirZ * vel * dt;

    /* ── Hull-averaged wave height ── */
    // Sample across the hull footprint and average — a large hullRadius
    // naturally smooths out small waves (big vessel), while a small radius
    // lets every ripple through (small boat).
    const avgHeight = avgWaveHeight(pos.x, pos.z, t, hullRadius, hullSamples);
    const baseWaterLevel = -waveConfig.waveDepth;
    // waveInfluence blends from flat baseline to averaged wave surface
    const waveY = THREE.MathUtils.lerp(baseWaterLevel, avgHeight, waveInfluence) + verticalOffset;
    pos.y = waveY;

    /* ── Hull-averaged normal (orientation) ── */
    avgWaveNormal(pos.x, pos.z, t, hullRadius, hullSamples, tmp.up);

    // Blend averaged normal towards world-up via waveInfluence
    tmp.blendedUp.copy(tmp.worldUp).lerp(tmp.up, Math.min(waveInfluence, 1.0)).normalize();

    // Look-ahead for pitch (also hull-averaged)
    const lookAheadDist = Math.max(0.12, hullRadius * 0.5);
    const x2 = pos.x + dirX * lookAheadDist;
    const z2 = pos.z + dirZ * lookAheadDist;
    const avgHeight2 = avgWaveHeight(x2, z2, t, hullRadius, hullSamples);
    const waveY2 = THREE.MathUtils.lerp(baseWaterLevel, avgHeight2, waveInfluence) + verticalOffset;
    tmp.nextPos.set(x2, waveY2, z2);

    // Forward = direction of travel projected along surface
    tmp.forward.copy(tmp.nextPos).sub(pos).normalize();
    tmp.right.copy(tmp.forward).cross(tmp.blendedUp).normalize();
    tmp.forwardOrtho.copy(tmp.blendedUp).cross(tmp.right).normalize();

    if (tmp.right.lengthSq() < 1e-6) tmp.right.set(0, 0, 1);
    if (tmp.forwardOrtho.lengthSq() < 1e-6) tmp.forwardOrtho.set(1, 0, 0);

    tmp.basis.makeBasis(tmp.right, tmp.blendedUp, tmp.forwardOrtho);
    group.quaternion.setFromRotationMatrix(tmp.basis);
    group.quaternion.multiply(tmp.modelFix);
    group.position.copy(pos);

    // Subtle hull roll when turning
    const rollAmount = -steer * speedFrac * 0.08;
    group.rotateOnAxis(tmp.forwardOrtho, rollAmount);
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
