import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { DebugBridge, DebugPanel, useDebugControls } from '@lilypad/debug';
import { AssetsPlugin } from '@lilypad/debug-assets';
import { useAssetRegistry } from '@lilypad/three-assets';
import { PageLayout } from '../layout/PageLayout';

const SHIPYARD_MODEL = `${import.meta.env.BASE_URL}shipyard.glb`;

function useClonedScene(url: string) {
  const { scene } = useGLTF(url);
  return useMemo(() => scene.clone(), [scene]);
}

export function ShipyardPage() {
  const manager = useAssetRegistry();
  const viewport = useDebugControls('Viewport', {
    autoRotate: { value: false, label: 'Auto Spin' },
    autoRotateSpeed: { value: 1.5, min: 0.1, max: 10, step: 0.1, label: 'Spin Speed' },
  });

  return (
    <PageLayout background="var(--color-deep-navy)">
      <DebugPanel position="left" plugins={[AssetsPlugin(manager)]} />
      <Canvas
        style={{ flex: 1 }}
        camera={{
  position: [638.15, 490.96, 266.31],
  fov: 50,
  near: 0.10,
  far: 2000,
}}

        gl={{ alpha: false, antialias: true }}
      >
        <color attach="background" args={['#0f2240']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={1.0} />
        <directionalLight position={[-3, 4, -5]} intensity={0.3} />
        <ShipyardModel />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          autoRotate={viewport.autoRotate as boolean}
          autoRotateSpeed={viewport.autoRotateSpeed as number}
        />
        <DebugBridge plugins={[AssetsPlugin(manager)]} />
      </Canvas>
      <DebugPanel position="right" plugins={[AssetsPlugin(manager)]} />
    </PageLayout>
  );
}

function ShipyardModel() {
  const cloned = useClonedScene(SHIPYARD_MODEL);
  return <primitive object={cloned} />;
}
