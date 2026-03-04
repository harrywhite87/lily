import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { DebugOverlay, useObjectInspectorSurface } from '@lilypad/debug';
import {
  ParticleCloud,
  createParticleCloudInspectorSurface,
  extractGeometry,
  normalizeGeometry,
  type ParticleCloudTuning,
} from '@lilypad/three-particles';
import styles from './ParticleCloudDemoPage.module.scss';

const SUB_URL = `${import.meta.env.BASE_URL}submarine.glb`;
useGLTF.preload(SUB_URL);

function useParticleCloudInspector(
  title: string,
  initial: ParticleCloudTuning,
) {
  const pointsRef = useRef<THREE.Points | null>(null);
  const [tuning, setTuning] = useState<ParticleCloudTuning>(initial);
  const tuningRef = useRef(tuning);

  useEffect(() => {
    tuningRef.current = tuning;
  }, [tuning]);

  const surface = useMemo(
    () =>
      createParticleCloudInspectorSurface({
        title,
        get: () => tuningRef.current,
        set: (patch) =>
          setTuning((prev) => ({
            ...prev,
            ...patch,
          })),
      }),
    [title],
  );

  useObjectInspectorSurface(pointsRef, surface);

  return { pointsRef, tuning };
}

function SubmarineCloud() {
  const { scene } = useGLTF(SUB_URL);
  const { pointsRef, tuning } = useParticleCloudInspector('Submarine Cloud', {
    count: 10000,
    pointSize: 24,
    drift: 0.08,
    pulse: 0.6,
    color: '#4fc3f7',
    opacity: 0.85,
  });

  const geo = useMemo(() => {
    const extracted = extractGeometry(scene);
    if (!extracted) return new THREE.BoxGeometry(1, 1, 1);
    normalizeGeometry(extracted, 1.8);
    return extracted;
  }, [scene]);

  return (
    <ParticleCloud
      ref={pointsRef}
      name="Submarine Cloud"
      geometry={geo}
      count={tuning.count}
      pointSize={tuning.pointSize}
      drift={tuning.drift}
      pulse={tuning.pulse}
      color={tuning.color}
      opacity={tuning.opacity}
    />
  );
}

function DonutCloud() {
  const { pointsRef, tuning } = useParticleCloudInspector('Donut Cloud', {
    count: 25_000,
    pointSize: 24,
    drift: 0.25,
    pulse: 1.5,
    color: '#ce93d8',
    opacity: 0.6,
  });

  const geo = useMemo(() => {
    const g = new THREE.TorusGeometry(2.8, 0.35, 16, 48);
    // Rotate to XZ plane so the orbit code (which operates in XZ around Y) is correct
    g.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    return g;
  }, []);

  return (
    <ParticleCloud
      ref={pointsRef}
      name="Donut Cloud"
      geometry={geo}
      count={tuning.count}
      pointSize={tuning.pointSize}
      drift={tuning.drift}
      pulse={tuning.pulse}
      color={tuning.color}
      opacity={tuning.opacity}
      swarmSpeed={0.5}
      swarmFocus={0.6}
      orbitSpeed={0.3}
    />
  );
}

function Scene() {
  return (
    <>
      <color attach="background" args={['#060612']} />
      <fog attach="fog" args={['#060612', 12, 28]} />

      <ambientLight intensity={0.08} />
      <pointLight
        position={[3, 4, 3]}
        intensity={0.5}
        color="#4fc3f7"
        distance={15}
        decay={2}
      />
      <pointLight
        position={[-3, 2, -3]}
        intensity={0.3}
        color="#ce93d8"
        distance={12}
        decay={2}
      />

      <Suspense fallback={null}>
        <SubmarineCloud />
      </Suspense>
      <DonutCloud />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={18}
      />
      <DebugOverlay />
    </>
  );
}

export function ParticleCloudDemoPage() {
  return (
    <div className={styles.page}>
      <Canvas
        camera={{ fov: 50, near: 0.1, far: 100, position: [0, 2, 7] }}
        gl={{ antialias: true }}
      >
        <Scene />
      </Canvas>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.dot} style={{ background: '#4fc3f7' }} />
          Submarine cloud
        </div>
        <div className={styles.legendItem}>
          <span className={styles.dot} style={{ background: '#ce93d8' }} />
          Donut cloud
        </div>
        <div className={styles.legendItem}>
          Select a cloud in Inspector scene panel to edit custom fields.
        </div>
      </div>
    </div>
  );
}
