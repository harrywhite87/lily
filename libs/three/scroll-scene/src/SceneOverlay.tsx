import { Canvas } from '@react-three/fiber';
import { DebugOverlay } from '@lilypad/debug';
import { CameraRig } from './CameraRig';
import { Lighting } from './Lighting';
import { Submarine } from './Submarine';
import {
  WaterSurface,
  Caustics,
  type WaterOverrides,
  type CausticsOverrides,
} from '@lilypad/three-effects';

/**
 * Persistent Three.js canvas overlay — sits on top of the DOM content layer.
 * pointer-events: none so scroll interactions pass through to the ScrollContainer.
 *
 */
export interface SceneOverlayProps {
  waterOverrides?: WaterOverrides;
  causticsOverrides?: CausticsOverrides;
}

export function SceneOverlay({
  waterOverrides,
  causticsOverrides,
}: SceneOverlayProps) {

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
        <WaterSurface overrides={waterOverrides} />
        <Caustics overrides={causticsOverrides} />
        <DebugOverlay />
      </Canvas>
    </div>
  );
}
