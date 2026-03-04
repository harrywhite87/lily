import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Swarm, ParticleCloud, extractGeometry, normalizeGeometry } from '@lilypad/three-particles';
import styles from './SwarmDemoPage.module.scss';

const SUB_URL = `${import.meta.env.BASE_URL}submarine.glb`;
useGLTF.preload(SUB_URL);

/* ─── Submarine particle cloud ─── */

function SubCloud() {
  const { scene } = useGLTF(SUB_URL);

  const geo = useMemo(() => {
    const extracted = extractGeometry(scene);
    if (!extracted) return new THREE.BoxGeometry(1, 1, 1);
    normalizeGeometry(extracted, 1.8);
    return extracted;
  }, [scene]);

  return (
    <ParticleCloud
      geometry={geo}
      count={12_000}
      pointSize={22}
      drift={0.06}
      pulse={0.5}
      color="#c8e6f5"
      opacity={0.9}
    />
  );
}

/* ─── Scene ─── */

function Scene() {
  return (
    <>
      <color attach="background" args={['#030a12']} />
      <fog attach="fog" args={['#030a12', 16, 36]} />

      <ambientLight intensity={0.04} />
      {/* Blue-teal glow from above — submarine body */}
      <pointLight
        position={[0, 4, 0]}
        intensity={0.6}
        color="#1a6fa8"
        distance={18}
        decay={2}
      />
      {/* Accent fill from below */}
      <pointLight
        position={[0, -3, 2]}
        intensity={0.25}
        color="#0d3d5c"
        distance={12}
        decay={2}
      />

      {/* Submarine as a particle cloud */}
      <Suspense fallback={null}>
        <SubCloud />
      </Suspense>

      {/* Orbital swarm ring — flat in XZ, orbiting around Y axis */}
      <Swarm
        ringRadius={3.2}
        tubeRadius={0.55}
        count={18_000}
        pointSize={18}
        speedRange={[0.08, 0.45]}
        drift={0.18}
        pulse={0.8}
        color="#d0eeff"
        opacity={0.55}
        densityWaves={3}
        densityStrength={0.7}
      />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={22}
      />
    </>
  );
}

/* ─── Page ─── */

export function SwarmDemoPage() {
  return (
    <div className={styles.page}>
      <Canvas
        camera={{ fov: 45, near: 0.1, far: 100, position: [0, 3.5, 10] }}
        gl={{ antialias: true }}
      >
        <Scene />
      </Canvas>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.dot} style={{ background: '#c8e6f5' }} />
          Submarine — particle cloud
        </div>
        <div className={styles.legendItem}>
          <span className={styles.dot} style={{ background: '#d0eeff' }} />
          Orbital swarm — varying speeds
        </div>
      </div>
    </div>
  );
}
