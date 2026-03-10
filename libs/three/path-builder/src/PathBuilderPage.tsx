import { Canvas } from '@react-three/fiber';
import { Grid, OrbitControls } from '@react-three/drei';
import { DebugOverlay, DebugPanel } from '@lilypad/debug';
import { PageLayout } from '@lilypad/page-layout';
import { PathLine } from './PathLine';
import { PathMarkers } from './PathMarkers';
import { usePathBuilder } from './usePathBuilder';

export interface PathBuilderSceneProps {
  showGrid?: boolean;
  showDebugOverlay?: boolean;
}

export interface PathBuilderPageProps extends PathBuilderSceneProps {
  background?: string;
}

export function PathBuilderScene({
  showGrid = true,
  showDebugOverlay = true,
}: PathBuilderSceneProps) {
  const { points, onPointMoved } = usePathBuilder();

  return (
    <>
      {showGrid ? (
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
      ) : null}
      <PathMarkers points={points} onPointMoved={onPointMoved} />
      <PathLine points={points} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={40}
      />
      {showDebugOverlay ? <DebugOverlay /> : null}
    </>
  );
}

export function PathBuilderPage({
  background = '#0a0a0f',
  showGrid = true,
  showDebugOverlay = true,
}: PathBuilderPageProps) {
  return (
    <PageLayout background={background}>
      <DebugPanel position="left" />
      <Canvas
        style={{ flex: 1 }}
        camera={{ position: [6, 5, 8], fov: 50, near: 0.1, far: 1000 }}
        gl={{ alpha: false, antialias: true }}
      >
        <color attach="background" args={[background]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={0.6} color="#ffffff" />
        <directionalLight position={[-3, 4, -5]} intensity={0.2} color="#a0c4ff" />
        <PathBuilderScene
          showGrid={showGrid}
          showDebugOverlay={showDebugOverlay}
        />
      </Canvas>
      <DebugPanel position="right" />
    </PageLayout>
  );
}
