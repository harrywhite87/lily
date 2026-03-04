import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { DebugOverlay } from '@lilypad/debug';
import { usePathBuilder } from './usePathBuilder';
import { PathMarkers } from './PathMarkers';
import { PathLine } from './PathLine';
import styles from './PathBuilderPage.module.scss';

function PathScene() {
  const { points, onPointMoved } = usePathBuilder();

  return (
    <>
      <PathMarkers points={points} onPointMoved={onPointMoved} />
      <PathLine points={points} />
    </>
  );
}

export function PathBuilderPage() {
  return (
    <div className={styles.page}>
      <Canvas
        camera={{ position: [6, 5, 8], fov: 50, near: 0.1, far: 1000 }}
        gl={{ alpha: false, antialias: true }}
      >
        <color attach="background" args={['#0a0a0f']} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={0.6} color="#ffffff" />
        <directionalLight position={[-3, 4, -5]} intensity={0.2} color="#a0c4ff" />

        <Grid
          args={[40, 40]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#1a1a2e"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#2a2a4a"
          fadeDistance={30}
          infiniteGrid
        />

        <PathScene />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={2}
          maxDistance={40}
        />
        <DebugOverlay />
      </Canvas>

   
    </div>
  );
}
