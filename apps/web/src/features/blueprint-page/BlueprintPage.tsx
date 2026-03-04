import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { DebugOverlay, useDebugControls } from '@lilypad/debug';
import { BlueprintSubmarine } from '../shaders/BlueprintMaterial';
import type { BlueprintOverrides } from '../shaders/BlueprintMaterial';
import { PageLayout } from '../layout/PageLayout';

export function BlueprintPage() {
  const overrides = useDebugControls('Blueprint Grid', {
    gridScale: { value: 18.0, min: 0.1, max: 50.0, step: 0.1, label: 'Grid Scale' },
    thickness: { value: 0.02, min: 0.005, max: 0.1, step: 0.005, label: 'Line Thickness' },
    subGridScale: { value: 36, min: 1.0, max: 100.0, step: 0.5, label: 'Sub-Grid Scale' },
    subGridOpacity: { value: 0.6, min: 0.0, max: 1.0, step: 0.05, label: 'Sub-Grid Opacity' },
    fresnelPower: { value: 2.5, min: 0.5, max: 6.0, step: 0.1, label: 'Fresnel Power' },
    fresnelIntensity: { value: 0.8, min: 0.0, max: 2.0, step: 0.05, label: 'Fresnel Intensity' },
    pulseSpeed: { value: 1.5, min: 0.0, max: 5.0, step: 0.1, label: 'Pulse Speed' },
    pulseAmount: { value: 0.08, min: 0.0, max: 0.5, step: 0.01, label: 'Pulse Amount' },
  });

  return (
    <PageLayout background="var(--color-deep-navy)">
      <Canvas
        camera={{ position: [0.94, 0.81, -1.35], fov: 50, near: 0.10, far: 1000 }}
        gl={{ alpha: false, antialias: true }}
      >
        <color attach="background" args={['#060e1a']} />
        <ambientLight intensity={0.15} />
        <directionalLight position={[5, 8, 5]} intensity={0.3} />
        <BlueprintSubmarine overrides={overrides as BlueprintOverrides} />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={1}
          maxDistance={20}
        />
        <DebugOverlay />
      </Canvas>

    </PageLayout>
  );
}
