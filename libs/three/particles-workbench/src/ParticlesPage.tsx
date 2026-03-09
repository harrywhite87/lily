/// <reference types="vite/client" />
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { DebugOverlay, useDebugControls } from '@lilypad/debug';
import type { FolderControl } from '@lilypad/debug';
import { PageLayout } from '@lilypad/page-layout';
import { ParticlesMorph } from '@lilypad/three-particles';
import * as THREE from 'three';
import { GLBGeometryLoader } from './GLBGeometryLoader';
import { MeshPreviews } from './MeshPreviews';
import {
  DEFAULT_PARTICLE_MESH_A,
  DEFAULT_PARTICLE_MESH_B,
  DEFAULT_PARTICLE_MESH_PRESETS,
  DEFAULT_PARTICLE_POSITION_A,
  DEFAULT_PARTICLE_POSITION_B,
  type ParticleMeshPreset,
} from './presets';

export interface ParticlesPageProps {
  background?: string;
  assetBaseUrl?: string;
  presets?: ParticleMeshPreset[];
  defaultMeshA?: string;
  defaultMeshB?: string;
}

function isAbsoluteAssetUrl(value: string) {
  return (
    /^(?:[a-z]+:)?\/\//i.test(value) ||
    value.startsWith('/') ||
    value.startsWith('blob:') ||
    value.startsWith('data:')
  );
}

function resolveAssetUrl(assetBaseUrl: string, value: string) {
  return isAbsoluteAssetUrl(value) ? value : `${assetBaseUrl}${value}`;
}

function resolveDefaultMeshLabel(
  presets: ParticleMeshPreset[],
  preferred: string,
  fallbackIndex: number,
) {
  if (presets.some((preset) => preset.label === preferred)) {
    return preferred;
  }

  return presets[fallbackIndex]?.label ?? presets[0]?.label ?? preferred;
}

export function ParticlesPage({
  background = '#05050a',
  assetBaseUrl = import.meta.env.BASE_URL,
  presets = DEFAULT_PARTICLE_MESH_PRESETS,
  defaultMeshA = DEFAULT_PARTICLE_MESH_A,
  defaultMeshB = DEFAULT_PARTICLE_MESH_B,
}: ParticlesPageProps) {
  const resolvedDefaultMeshA = useMemo(
    () => resolveDefaultMeshLabel(presets, defaultMeshA, 0),
    [defaultMeshA, presets],
  );
  const resolvedDefaultMeshB = useMemo(
    () => resolveDefaultMeshLabel(presets, defaultMeshB, 1),
    [defaultMeshB, presets],
  );
  const presetOptions = useMemo(
    () => presets.map((preset) => preset.label),
    [presets],
  );

  const defaultFrom = useMemo(
    () => new THREE.TorusKnotGeometry(1.0, 0.32, 260, 36),
    [],
  );
  const defaultTo = useMemo(
    () => new THREE.IcosahedronGeometry(1.25, 4),
    [],
  );

  useEffect(() => {
    return () => {
      defaultFrom.dispose();
      defaultTo.dispose();
    };
  }, [defaultFrom, defaultTo]);

  const [fromGeometry, setFromGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [toGeometry, setToGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [fromUrl, setFromUrl] = useState<string | null>(null);
  const [toUrl, setToUrl] = useState<string | null>(null);
  const [fromIsBlob, setFromIsBlob] = useState(false);
  const [toIsBlob, setToIsBlob] = useState(false);
  const [selectedMesh, setSelectedMesh] = useState<'A' | 'B' | null>(null);

  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const fromResourceRef = useRef({ url: null as string | null, isBlob: false });
  const toResourceRef = useRef({ url: null as string | null, isBlob: false });
  const meshAPosition = useRef(DEFAULT_PARTICLE_POSITION_A.clone());
  const meshBPosition = useRef(DEFAULT_PARTICLE_POSITION_B.clone());

  useEffect(() => {
    fromResourceRef.current = { url: fromUrl, isBlob: fromIsBlob };
  }, [fromIsBlob, fromUrl]);

  useEffect(() => {
    toResourceRef.current = { url: toUrl, isBlob: toIsBlob };
  }, [toIsBlob, toUrl]);

  useEffect(() => {
    return () => {
      const currentFrom = fromResourceRef.current;
      const currentTo = toResourceRef.current;

      if (currentFrom.isBlob && currentFrom.url) {
        URL.revokeObjectURL(currentFrom.url);
      }

      if (currentTo.isBlob && currentTo.url) {
        URL.revokeObjectURL(currentTo.url);
      }
    };
  }, []);

  const applyPreset = useCallback(
    (label: string, slot: 'from' | 'to') => {
      const preset = presets.find((entry) => entry.label === label);
      if (!preset) {
        return;
      }

      if (preset.type === 'upload') {
        if (slot === 'from') {
          fromInputRef.current?.click();
        } else {
          toInputRef.current?.click();
        }
        return;
      }

      if (slot === 'from') {
        if (fromIsBlob && fromUrl) {
          URL.revokeObjectURL(fromUrl);
        }
        setFromIsBlob(false);
      } else {
        if (toIsBlob && toUrl) {
          URL.revokeObjectURL(toUrl);
        }
        setToIsBlob(false);
      }

      if (preset.type === 'procedural' && preset.factory) {
        const geometry = preset.factory();
        if (slot === 'from') {
          setFromUrl(null);
          setFromGeometry(geometry);
        } else {
          setToUrl(null);
          setToGeometry(geometry);
        }
        return;
      }

      const nextUrl = resolveAssetUrl(assetBaseUrl, preset.value);
      if (slot === 'from') {
        setFromGeometry(null);
        setFromUrl(nextUrl);
      } else {
        setToGeometry(null);
        setToUrl(nextUrl);
      }
    },
    [assetBaseUrl, fromIsBlob, fromUrl, presets, toIsBlob, toUrl],
  );

  const handleFileUpload = useCallback(
    (file: File, slot: 'from' | 'to') => {
      const name = file.name.toLowerCase();
      if (!name.endsWith('.glb') && !name.endsWith('.gltf')) {
        window.alert('Please provide a .glb or .gltf file.');
        return;
      }

      const blobUrl = URL.createObjectURL(file);
      if (slot === 'from') {
        if (fromIsBlob && fromUrl) {
          URL.revokeObjectURL(fromUrl);
        }
        setFromUrl(blobUrl);
        setFromGeometry(null);
        setFromIsBlob(true);
      } else {
        if (toIsBlob && toUrl) {
          URL.revokeObjectURL(toUrl);
        }
        setToUrl(blobUrl);
        setToGeometry(null);
        setToIsBlob(true);
      }
    },
    [fromIsBlob, fromUrl, toIsBlob, toUrl],
  );

  const handleFromChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileUpload(file, 'from');
      }
    },
    [handleFileUpload],
  );

  const handleToChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileUpload(file, 'to');
      }
    },
    [handleFileUpload],
  );

  const effectiveFrom = fromGeometry ?? defaultFrom;
  const effectiveTo = toGeometry ?? defaultTo;

  const [controls, setControls] = useDebugControls(
    'Particles',
    () => ({
      Params: {
        type: 'folder',
        title: 'Particles',
        controls: {
          count: { value: 70_000, min: 5_000, max: 150_000, step: 5_000 },
          pointSize: { value: 2.4, min: 0.5, max: 32.0, step: 0.1 },
          turbulence: { value: 1.15, min: 0.0, max: 4.0, step: 0.05 },
          speed: { value: 0.8, min: 0.1, max: 3.0, step: 0.05 },
          color: { value: '#cfe8ff' },
          opacity: { value: 1.0, min: 0.1, max: 1.0, step: 0.05 },
        },
      } satisfies FolderControl,
      Meshes: {
        type: 'folder',
        title: 'Meshes',
        controls: {
          showMeshes: { value: false, label: 'Show Meshes' },
          meshA: {
            type: 'select',
            value: resolvedDefaultMeshA,
            options: presetOptions,
            label: 'Mesh A (blue)',
          },
          meshB: {
            type: 'select',
            value: resolvedDefaultMeshB,
            options: presetOptions,
            label: 'Mesh B (orange)',
          },
          'Select A': {
            type: 'button',
            label: 'Select Mesh A',
            onClick: () => setSelectedMesh('A'),
          },
          'Select B': {
            type: 'button',
            label: 'Select Mesh B',
            onClick: () => setSelectedMesh('B'),
          },
          Reset: {
            type: 'button',
            label: 'Reset to Defaults',
            onClick: () => {
              if (fromIsBlob && fromUrl) {
                URL.revokeObjectURL(fromUrl);
              }

              if (toIsBlob && toUrl) {
                URL.revokeObjectURL(toUrl);
              }

              setFromUrl(null);
              setToUrl(null);
              setFromGeometry(null);
              setToGeometry(null);
              setFromIsBlob(false);
              setToIsBlob(false);
              meshAPosition.current.copy(DEFAULT_PARTICLE_POSITION_A);
              meshBPosition.current.copy(DEFAULT_PARTICLE_POSITION_B);
              setSelectedMesh(null);
              setControls({
                meshA: resolvedDefaultMeshA,
                meshB: resolvedDefaultMeshB,
              });
            },
          },
        },
      } satisfies FolderControl,
    }),
    [
      fromIsBlob,
      fromUrl,
      presetOptions,
      resolvedDefaultMeshA,
      resolvedDefaultMeshB,
      toIsBlob,
      toUrl,
    ],
  );

  const previousMeshA = useRef(resolvedDefaultMeshA);
  const previousMeshB = useRef(resolvedDefaultMeshB);

  useEffect(() => {
    previousMeshA.current = resolvedDefaultMeshA;
    previousMeshB.current = resolvedDefaultMeshB;
    setControls({
      meshA: resolvedDefaultMeshA,
      meshB: resolvedDefaultMeshB,
    });
  }, [resolvedDefaultMeshA, resolvedDefaultMeshB, setControls]);

  useEffect(() => {
    const meshA = controls.meshA as string;
    const meshB = controls.meshB as string;

    if (meshA !== previousMeshA.current) {
      previousMeshA.current = meshA;
      applyPreset(meshA, 'from');
    }

    if (meshB !== previousMeshB.current) {
      previousMeshB.current = meshB;
      applyPreset(meshB, 'to');
    }
  }, [applyPreset, controls.meshA, controls.meshB]);

  const morphKey = [
    fromUrl ?? 'default-from',
    toUrl ?? 'default-to',
    controls.count,
    fromGeometry ? 'from-geometry' : 'no-from-geometry',
    toGeometry ? 'to-geometry' : 'no-to-geometry',
  ].join('_');

  return (
    <PageLayout background={background}>
      <input
        ref={fromInputRef}
        type="file"
        accept=".glb,.gltf"
        style={{ display: 'none' }}
        onChange={handleFromChange}
      />
      <input
        ref={toInputRef}
        type="file"
        accept=".glb,.gltf"
        style={{ display: 'none' }}
        onChange={handleToChange}
      />
      <Canvas
        camera={{ fov: 50, near: 0.1, far: 100, position: [0, 0, 4] }}
        gl={{ alpha: false, antialias: true }}
      >
        <color attach="background" args={[background]} />
        <ambientLight intensity={0.6} />
        {fromUrl ? (
          <GLBGeometryLoader url={fromUrl} onGeometry={setFromGeometry} />
        ) : null}
        {toUrl ? (
          <GLBGeometryLoader url={toUrl} onGeometry={setToGeometry} />
        ) : null}
        <ParticlesMorph
          key={morphKey}
          from={effectiveFrom}
          to={effectiveTo}
          count={controls.count as number}
          pointSize={controls.pointSize as number}
          turbulence={controls.turbulence as number}
          color={controls.color as string}
          opacity={controls.opacity as number}
          speed={controls.speed as number}
          fromOffset={meshAPosition}
          toOffset={meshBPosition}
        />
        {Boolean(controls.showMeshes) ? (
          <MeshPreviews
            fromGeometry={effectiveFrom}
            toGeometry={effectiveTo}
            fromPositionRef={meshAPosition}
            toPositionRef={meshBPosition}
            selectedMesh={selectedMesh}
            onSelectMesh={setSelectedMesh}
          />
        ) : null}
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
        <DebugOverlay />
      </Canvas>
    </PageLayout>
  );
}
