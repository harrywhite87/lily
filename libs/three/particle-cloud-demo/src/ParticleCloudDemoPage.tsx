/// <reference types="vite/client" />
import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { DebugOverlay, DebugPanel } from '@lilypad/debug';
import { PageLayout } from '@lilypad/page-layout';
import {
  ParticleCloud,
  extractGeometry,
  normalizeGeometry,
  type ParticleCloudTuning,
} from '@lilypad/three-particles';
import { useParticleCloudInspector } from './useParticleCloudInspector';
import styles from './ParticleCloudDemoPage.module.scss';

export const DEFAULT_PARTICLE_CLOUD_SUBMARINE_URL = `${import.meta.env.BASE_URL}submarine.glb`;
useGLTF.preload(DEFAULT_PARTICLE_CLOUD_SUBMARINE_URL);

export interface ParticleCloudDemoSceneProps {
  submarineUrl?: string;
  showDebugOverlay?: boolean;
}

export interface ParticleCloudDemoPageProps extends ParticleCloudDemoSceneProps {
  background?: string;
  showLegend?: boolean;
}

function SubmarineCloud({ submarineUrl }: { submarineUrl: string }) {
  const { scene } = useGLTF(submarineUrl);
  const { pointsRef, tuning } = useParticleCloudInspector('Submarine Cloud', {
    count: 10_000,
    pointSize: 24,
    drift: 0.08,
    pulse: 0.6,
    color: '#4fc3f7',
    opacity: 0.85,
  } satisfies ParticleCloudTuning);

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
      ref={pointsRef}
      name="Submarine Cloud"
      geometry={geometry}
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
  } satisfies ParticleCloudTuning);

  const geometry = useMemo(() => {
    const torus = new THREE.TorusGeometry(2.8, 0.35, 16, 48);
    torus.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    return torus;
  }, []);

  return (
    <ParticleCloud
      ref={pointsRef}
      name="Donut Cloud"
      geometry={geometry}
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

export function ParticleCloudDemoScene({
  submarineUrl = DEFAULT_PARTICLE_CLOUD_SUBMARINE_URL,
  showDebugOverlay = true,
}: ParticleCloudDemoSceneProps) {
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
        <SubmarineCloud submarineUrl={submarineUrl} />
      </Suspense>
      <DonutCloud />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={18}
      />
      {showDebugOverlay ? <DebugOverlay /> : null}
    </>
  );
}

export function ParticleCloudDemoPage({
  background = '#060612',
  showLegend = true,
  submarineUrl = DEFAULT_PARTICLE_CLOUD_SUBMARINE_URL,
  showDebugOverlay = true,
}: ParticleCloudDemoPageProps) {
  return (
    <PageLayout background={background}>
      <DebugPanel position="left" />
      <Canvas
        style={{ flex: 1 }}
        camera={{ fov: 50, near: 0.1, far: 100, position: [0, 2, 7] }}
        gl={{ antialias: true }}
      >
        <ParticleCloudDemoScene
          submarineUrl={submarineUrl}
          showDebugOverlay={showDebugOverlay}
        />
      </Canvas>
      {showLegend ? (
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
      ) : null}
      <DebugPanel position="right" />
    </PageLayout>
  );
}
