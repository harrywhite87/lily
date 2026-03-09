/// <reference types="vite/client" />
import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { PageLayout } from '@lilypad/page-layout';
import {
  ParticleCloud,
  Swarm,
  extractGeometry,
  normalizeGeometry,
} from '@lilypad/three-particles';
import styles from './SwarmDemoPage.module.scss';

export const DEFAULT_SWARM_SUBMARINE_URL = `${import.meta.env.BASE_URL}submarine.glb`;
useGLTF.preload(DEFAULT_SWARM_SUBMARINE_URL);

export interface SwarmDemoSceneProps {
  submarineUrl?: string;
}

export interface SwarmDemoPageProps extends SwarmDemoSceneProps {
  background?: string;
  showLegend?: boolean;
}

function SubCloud({ submarineUrl }: { submarineUrl: string }) {
  const { scene } = useGLTF(submarineUrl);

  const geometry = useMemo(() => {
    const extracted = extractGeometry(scene);

    if (!extracted) {
      return new THREE.BoxGeometry(1, 1, 1);
    }

    normalizeGeometry(extracted, 1.8);
    return extracted;
  }, [scene]);

  return (
    <ParticleCloud
      geometry={geometry}
      count={12_000}
      pointSize={22}
      drift={0.06}
      pulse={0.5}
      color="#c8e6f5"
      opacity={0.9}
    />
  );
}

export function SwarmDemoScene({
  submarineUrl = DEFAULT_SWARM_SUBMARINE_URL,
}: SwarmDemoSceneProps) {
  return (
    <>
      <color attach="background" args={['#030a12']} />
      <fog attach="fog" args={['#030a12', 16, 36]} />
      <ambientLight intensity={0.04} />
      <pointLight
        position={[0, 4, 0]}
        intensity={0.6}
        color="#1a6fa8"
        distance={18}
        decay={2}
      />
      <pointLight
        position={[0, -3, 2]}
        intensity={0.25}
        color="#0d3d5c"
        distance={12}
        decay={2}
      />
      <Suspense fallback={null}>
        <SubCloud submarineUrl={submarineUrl} />
      </Suspense>
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

export function SwarmDemoPage({
  background = '#060612',
  showLegend = true,
  submarineUrl = DEFAULT_SWARM_SUBMARINE_URL,
}: SwarmDemoPageProps) {
  return (
    <PageLayout background={background}>
      <Canvas
        camera={{ fov: 45, near: 0.1, far: 100, position: [0, 3.5, 10] }}
        gl={{ antialias: true }}
      >
        <SwarmDemoScene submarineUrl={submarineUrl} />
      </Canvas>
      {showLegend ? (
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.dot} style={{ background: '#c8e6f5' }} />
            Submarine - particle cloud
          </div>
          <div className={styles.legendItem}>
            <span className={styles.dot} style={{ background: '#d0eeff' }} />
            Orbital swarm - varying speeds
          </div>
        </div>
      ) : null}
    </PageLayout>
  );
}
