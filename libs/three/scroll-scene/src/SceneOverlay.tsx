import { Canvas } from '@react-three/fiber';
import { DebugBridge, DebugPanel } from '@lilypad/debug';
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
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      <DebugPanel position="left" />
      <Canvas
        camera={{ fov: 50, near: 0.1, far: 1000, position: [0, 0, 8] }}
        style={{ pointerEvents: 'none', flex: 1 }}
        gl={{ alpha: true, antialias: true }}
      >
        <CameraRig />
        <Lighting />
        <Submarine />
        <WaterSurface overrides={waterOverrides} />
        <Caustics overrides={causticsOverrides} />
        <DebugBridge />
      </Canvas>
      <DebugPanel position="right" />
    </div>
  );
}
