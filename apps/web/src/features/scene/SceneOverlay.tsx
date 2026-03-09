import { SceneOverlay as ScrollSceneOverlay } from '@lilypad/three-scroll-scene';
import { useShaderConfig } from '../config/ShaderConfigContext';

export function SceneOverlay() {
  const { config } = useShaderConfig();

  return (
    <ScrollSceneOverlay
      waterOverrides={config.water}
      causticsOverrides={config.caustics}
    />
  );
}
