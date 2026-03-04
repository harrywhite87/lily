import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { DebugOverlay, useDebugControls } from '@lilypad/debug';
import type { FolderControl } from '@lilypad/debug';
import { BuildSubmarine } from '../shaders/BuildMaterial';
import type { BuildOverrides } from '../shaders/BuildMaterial';
import styles from './BuildPage.module.scss';

export function BuildPage() {
  const overrides = useDebugControls('Build', {
    Rust: {
      type: 'folder' as const,
      title: 'Rust',
      controls: {
        rustTexScale: { value: 0.5, min: 0.05, max: 5.0, step: 0.05, label: 'Texture Scale' },
        rustScale: { value: 1.8, min: 0.5, max: 500.0, step: 0.1, label: 'Noise Scale' },
        rustRoughness: { value: 0.6, min: 0.0, max: 1.0, step: 0.05, label: 'Roughness' },
        primerMix: { value: 0.25, min: 0.0, max: 1.0, step: 0.05, label: 'Primer Showing' },
        steelMix: { value: 0.4, min: 0.0, max: 1.0, step: 0.05, label: 'Steel Showing' },
      },
    } satisfies FolderControl,
    Structure: {
      type: 'folder' as const,
      title: 'Structure',
      controls: {
        ribSpacing: { value: 9.0, min: 0.5, max: 20.0, step: 0.1, label: 'Rib Spacing' },
        ribOffset: { value: 0.0, min: -5.0, max: 5.0, step: 0.05, label: 'Rib Offset' },
        ribThickness: { value: 0.012, min: 0.002, max: 0.05, step: 0.002, label: 'Rib Thickness' },
        seamSpacing: { value: 10.0, min: 0.5, max: 15.0, step: 0.1, label: 'Seam Spacing' },
        seamOffset: { value: 0.0, min: -5.0, max: 5.0, step: 0.05, label: 'Seam Offset' },
        seamThickness: { value: 0.008, min: 0.002, max: 0.04, step: 0.002, label: 'Seam Thickness' },
        seamWobble: { value: 0.003, min: 0.0, max: 0.02, step: 0.001, label: 'Seam Wobble' },
        lineOpacity: { value: 0.6, min: 0.0, max: 1.0, step: 0.05, label: 'Line Opacity' },
      },
    } satisfies FolderControl,
    Details: {
      type: 'folder' as const,
      title: 'Details',
      controls: {
        rivetSpacing: { value: 6.0, min: 1.0, max: 20.0, step: 0.5, label: 'Rivet Spacing' },
        rivetSize: { value: 0.02, min: 0.005, max: 0.08, step: 0.005, label: 'Rivet Size' },
        chalkOpacity: { value: 0.4, min: 0.0, max: 1.0, step: 0.05, label: 'Chalk Marks' },
      },
    } satisfies FolderControl,
    Edge: {
      type: 'folder' as const,
      title: 'Edge',
      controls: {
        fresnelPower: { value: 2.0, min: 0.5, max: 6.0, step: 0.1, label: 'Fresnel Power' },
        fresnelIntensity: { value: 0.4, min: 0.0, max: 2.0, step: 0.05, label: 'Fresnel Intensity' },
      },
    } satisfies FolderControl,
  });

  return (
    <div className={styles.page}>
      <Canvas
        camera={{ position: [0.94, 0.81, -1.35], fov: 50, near: 0.10, far: 1000 }}
        gl={{ alpha: false, antialias: true }}
      >
        <color attach="background" args={['#0d0d0d']} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 8, 5]} intensity={0.6} color="#ffd4a0" />
        <directionalLight position={[-3, 4, -5]} intensity={0.2} color="#a0c4ff" />
        <BuildSubmarine overrides={overrides as BuildOverrides} />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={1}
          maxDistance={20}
        />
        <DebugOverlay />
      </Canvas>

   
    </div>
  );
}
