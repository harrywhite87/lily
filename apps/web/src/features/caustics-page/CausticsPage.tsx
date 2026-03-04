import { useRef, useCallback, useEffect, type ChangeEvent } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { DebugOverlay, useDebugControls } from '@lilypad/debug';
import { Caustics } from '../shaders/Caustics';
import { useShaderConfig, CAUSTICS_DEFAULTS } from '../config/ShaderConfigContext';
import type { CausticsOverrides } from '../shaders/Caustics';
import { PageLayout } from '../layout/PageLayout';

export function CausticsPage() {
  const { config, setCaustics, downloadConfig, importConfig, resetAll } = useShaderConfig();
  const importRef = useRef<HTMLInputElement>(null);

  const handleImport = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) importConfig(file);
    },
    [importConfig],
  );

  const [overrides, setOverrides] = useDebugControls(
    'Caustics',
    () => ({
      scale: { value: config.caustics.scale, min: 0.5, max: 5.0, step: 0.05 },
      speed: { value: config.caustics.speed, min: 0.0, max: 1.0, step: 0.01 },
      baseIntensity: { value: config.caustics.baseIntensity, min: 0.1, max: 4.0, step: 0.05 },
      contrast: { value: config.caustics.contrast, min: 0.5, max: 3.0, step: 0.05 },
      shimmer: { value: config.caustics.shimmer, min: 0.0, max: 2.0, step: 0.05 },
      flowAmount: { value: config.caustics.flowAmount, min: 0.0, max: 3.0, step: 0.1 },
      edgeFade: { value: config.caustics.edgeFade, min: 0.0, max: 1.0, step: 0.05 },
      sandAmount: { value: config.caustics.sandAmount, min: 0.0, max: 1.0, step: 0.05 },
      sandScale: { value: config.caustics.sandScale, min: 1.0, max: 20.0, step: 0.5 },
      sandTexScale: { value: 1.0, min: 0.1, max: 5.0, step: 0.05, label: 'Sand Texture Scale' },
    }),
    [],
  );

  // Config actions
  useDebugControls('Config', {
    '⬇ Download': { type: 'button', label: '⬇ Download Config', onClick: () => downloadConfig() },
    '⬆ Import': { type: 'button', label: '⬆ Import Config', onClick: () => importRef.current?.click() },
    '↺ Reset': {
      type: 'button',
      label: '↺ Reset All',
      onClick: () => {
        resetAll();
        setOverrides(CAUSTICS_DEFAULTS);
      },
    },
  });

  // Sync slider changes to global config (skip initial mount)
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    setCaustics(overrides as CausticsOverrides);
  }, [overrides, setCaustics]);

  return (
    <PageLayout background="var(--color-deep-navy)">
      <input
        ref={importRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImport}
      />
      <Canvas
        camera={{ fov: 50, near: 0.1, far: 1000, position: [0, 12, 14] }}
        gl={{ alpha: false, antialias: true }}
      >
        <color attach="background" args={['#0a1628']} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />
        <Caustics standalone overrides={overrides as CausticsOverrides} />
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={3}
          maxDistance={40}
        />
        <DebugOverlay />
      </Canvas>

 
    </PageLayout>
  );
}
