/// <reference types="vite/client" />
import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import { DebugOverlay, DebugPanel } from '@lilypad/debug';
import { PageLayout } from '@lilypad/page-layout';
import {
  useMenuInspector,
  DEFAULT_MENU_TUNING,
  type MenuTuning,
} from './useMenuInspector';
import styles from './MenuDemoPage.module.scss';

/* ─────────────────── constants ─────────────────── */

const CIRCLE_SEGMENTS = 128;

/* ─────────────────── circle path component ─────────────────── */

function CirclePath({ tuning }: { tuning: MenuTuning }) {
  const radius = tuning.diameter / 2;

  const points = useMemo(() => {
    const path = new THREE.Path();
    path.absarc(0, 0, radius, 0, Math.PI * 2, false);
    const points2D = path.getPoints(CIRCLE_SEGMENTS);
    // Convert 2D points to 3D (circle on the XZ plane)
    return points2D.map(
      (p) => new THREE.Vector3(p.x, 0, p.y),
    );
  }, [radius]);

  return (
    <Line
      points={points}
      color="#60c0ff"
      lineWidth={2}
    />
  );
}

/* ─────────────────── exported scene / page ─────────────────── */

export interface MenuDemoSceneProps {
  showDebugOverlay?: boolean;
}

export interface MenuDemoPageProps extends MenuDemoSceneProps {
  background?: string;
  showLegend?: boolean;
}

export function MenuDemoScene({
  showDebugOverlay = true,
}: MenuDemoSceneProps) {
  const tuning = useMenuInspector(DEFAULT_MENU_TUNING);

  return (
    <>
      <color attach="background" args={['#0a0a14']} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} />

      <CirclePath tuning={tuning} />

      {tuning.showAxesHelper && (
        <axesHelper args={[tuning.axesHelperSize]} />
      )}

      <gridHelper args={[20, 20, '#222233', '#1a1a2a']} />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={30}
      />
      {showDebugOverlay ? <DebugOverlay /> : null}
    </>
  );
}

export function MenuDemoPage({
  background = '#0a0a14',
  showLegend = true,
  showDebugOverlay = true,
}: MenuDemoPageProps) {
  return (
    <PageLayout background={background}>
      <DebugPanel position="left" />
      <Canvas
        style={{ flex: 1 }}
        camera={{ fov: 50, near: 0.1, far: 100, position: [0, 8, 12] }}
        gl={{ antialias: true }}
      >
        <MenuDemoScene showDebugOverlay={showDebugOverlay} />
      </Canvas>
      {showLegend ? (
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.dot} style={{ background: '#60c0ff' }} />
            Circle path · adjustable diameter
          </div>
          <div className={styles.legendItem}>
            Press ` to open Inspector &middot; Controls tab
          </div>
        </div>
      ) : null}
      <DebugPanel position="right" />
    </PageLayout>
  );
}
