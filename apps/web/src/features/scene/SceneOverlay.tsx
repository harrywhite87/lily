import { Canvas } from '@react-three/fiber';
import { DebugOverlay } from '@lilypad/debug';
import { CameraRig } from './CameraRig';
import { Lighting } from './Lighting';
import { Submarine } from './Submarine';
import { WaterSurface } from '../shaders/WaterSurface';
import { Caustics } from '../shaders/Caustics';
import { useShaderConfig } from '../config/ShaderConfigContext';

/**
 * Persistent Three.js canvas overlay — sits on top of the DOM content layer.
 * pointer-events: none so scroll interactions pass through to the ScrollContainer.
 *
 * Passes the global persisted shader config as overrides so that creative
 * tweaks made on the standalone pages carry through to the scroll demo.
 */
export function SceneOverlay() {
  const { config } = useShaderConfig();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        camera={{ fov: 50, near: 0.1, far: 1000, position: [0, 0, 8] }}
        style={{ pointerEvents: 'none' }}
        gl={{ alpha: true, antialias: true }}
      >
        <CameraRig />
        <Lighting />
        <Submarine />
        <WaterSurface overrides={config.water} />
        <Caustics overrides={config.caustics} />
        <DebugOverlay />
      </Canvas>
    </div>
  );
}
