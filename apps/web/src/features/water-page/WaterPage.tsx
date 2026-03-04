import { Suspense, useRef, useCallback, useEffect, type ChangeEvent } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { DebugOverlay, useDebugControls } from '@lilypad/debug';
import type { FolderControl } from '@lilypad/debug';
import * as THREE from 'three';
import { WaterSurface } from '../shaders/WaterSurface';
import { useShaderConfig, WATER_DEFAULTS } from '../config/ShaderConfigContext';
import type { WaterOverrides } from '../shaders/WaterSurface';
import { SkyDome } from '../shaders/SkyDome';
import { WaveSubmarine } from './WaveSubmarine';
import styles from './WaterPage.module.scss';

export function WaterPage() {
  const { config, setWater, downloadConfig, importConfig, resetAll } = useShaderConfig();
  const importRef = useRef<HTMLInputElement>(null);

  const handleImport = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) importConfig(file);
    },
    [importConfig],
  );

  const [overrides, setOverrides] = useDebugControls(
    'Water',
    () => ({
      Waves: {
        type: 'folder' as const,
        title: 'Waves',
        controls: {
          waveScale: { value: config.water.waveScale, min: 0.05, max: 1.4, step: 0.01 },
          waveDepth: { value: config.water.waveDepth, min: 0.2, max: 3.0, step: 0.05 },
          waveDrag: { value: config.water.waveDrag, min: 0.1, max: 2.0, step: 0.01 },
          waveSpeed: { value: config.water.waveSpeed, min: 0.2, max: 2.5, step: 0.05 },
        },
      } satisfies FolderControl,
      Lighting: {
        type: 'folder' as const,
        title: 'Optics',
        controls: {
          reflectionStrength: { value: config.water.reflectionStrength, min: 0.1, max: 2.5, step: 0.05 },
          scatterStrength: { value: config.water.scatterStrength, min: 0.0, max: 2.0, step: 0.05 },
          sunIntensity: { value: config.water.sunIntensity, min: 0.0, max: 2.5, step: 0.05 },
          exposure: { value: config.water.exposure, min: 0.5, max: 3.0, step: 0.05 },
        },
      } satisfies FolderControl,
      Sun: {
        type: 'folder' as const,
        title: 'Sun',
        controls: {
          animateSun: { value: config.water.animateSun },
          timeOfDay: { value: config.water.timeOfDay, min: 0.0, max: 1.0, step: 0.001 },
          sunCycleSpeed: { value: config.water.sunCycleSpeed, min: 0.0, max: 0.2, step: 0.001 },
        },
      } satisfies FolderControl,
      Surface: {
        type: 'folder' as const,
        title: 'Surface',
        controls: {
          normalEpsilon: { value: config.water.normalEpsilon, min: 0.01, max: 0.2, step: 0.005 },
          normalSmooth: { value: config.water.normalSmooth, min: 0.0, max: 1.0, step: 0.01 },
        },
      } satisfies FolderControl,
      Fog: {
        type: 'folder' as const,
        title: 'Fog',
        controls: {
          fogNear: { value: config.water.fogNear, min: 0, max: 50, step: 1 },
          fogFar: { value: config.water.fogFar, min: 10, max: 200, step: 2 },
          fogStrength: { value: config.water.fogStrength, min: 0.0, max: 1.0, step: 0.01 },
        },
      } satisfies FolderControl,
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
        setOverrides(WATER_DEFAULTS);
      },
    },
  });

  // Sync slider changes to global config (skip initial mount)
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    setWater(overrides as WaterOverrides);
  }, [overrides, setWater]);

  const waterOverrides = overrides as WaterOverrides;
  const exposure = waterOverrides.exposure ?? config.water.exposure;
  const sunIntensity = waterOverrides.sunIntensity ?? config.water.sunIntensity;
  const timeOfDay = waterOverrides.timeOfDay ?? config.water.timeOfDay;
  const animateSun = waterOverrides.animateSun ?? config.water.animateSun;
  const sunCycleSpeed = waterOverrides.sunCycleSpeed ?? config.water.sunCycleSpeed;

  return (
    <div className={styles.page}>
      <input
        ref={importRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImport}
      />
      <Canvas
        camera={{ fov: 55, near: 0.1, far: 5000, position: [0, 2.2, 6] }}
        gl={{ alpha: false, antialias: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(0x000000), 1);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.NoToneMapping;
        }}
      >
        <Suspense fallback={null}>
          <SkyDome
            exposure={exposure}
            sunIntensity={sunIntensity}
            timeOfDay={timeOfDay}
            animateSun={animateSun}
            sunCycleSpeed={sunCycleSpeed}
          />
          <ambientLight intensity={0.25} />
          <directionalLight position={[5, 10, 5]} intensity={0.5} />
          <WaterSurface standalone overrides={waterOverrides} />
          <WaveSubmarine overrides={waterOverrides} />
        </Suspense>
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          maxPolarAngle={Math.PI * 0.49}
          minDistance={2}
          maxDistance={60}
        />
        <DebugOverlay />
      </Canvas>
    </div>
  );
}
