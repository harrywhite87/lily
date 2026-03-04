import { useState, useEffect, useMemo, useRef, useCallback, type ChangeEvent, type MutableRefObject } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, TransformControls, useGLTF } from '@react-three/drei';
import { DebugOverlay, useDebugControls } from '@lilypad/debug';
import type { FolderControl } from '@lilypad/debug';
import { ParticlesMorph, extractGeometry, normalizeGeometry } from '@lilypad/three-particles';
import * as THREE from 'three';
import { PageLayout } from '../layout/PageLayout';


/* ───────── GLB loader sub-component ───────── */

function GLBGeometryLoader({
  url,
  onGeometry,
}: {
  url: string;
  onGeometry: (geo: THREE.BufferGeometry) => void;
}) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    const geo = extractGeometry(scene);
    if (geo) {
      normalizeGeometry(geo);
      onGeometry(geo);
    }
  }, [scene, onGeometry]);

  return null;
}

/* ───────── TransformGizmo — attaches to an existing mesh object ───────── */

function TransformGizmo({
  mesh,
  controls,
}: {
  mesh: THREE.Mesh;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controls: any;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tcRef = useRef<any>(null);

  useEffect(() => {
    const tc = tcRef.current;
    if (!tc) return;

    const onDraggingChanged = (event: { value: boolean }) => {
      if (controls) controls.enabled = !event.value;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tc.addEventListener('dragging-changed', onDraggingChanged as any);
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tc.removeEventListener('dragging-changed', onDraggingChanged as any);
      if (controls) controls.enabled = true;
    };
  }, [controls]);

  return <TransformControls ref={tcRef} object={mesh} mode="translate" />;
}

/* ───────── MeshPreviews — both meshes always mounted, gizmo roams between them ───────── */

function MeshPreviews({
  fromGeometry,
  toGeometry,
  fromPositionRef,
  toPositionRef,
  selectedMesh,
  onSelectMesh,
}: {
  fromGeometry: THREE.BufferGeometry;
  toGeometry: THREE.BufferGeometry;
  fromPositionRef: MutableRefObject<THREE.Vector3>;
  toPositionRef: MutableRefObject<THREE.Vector3>;
  selectedMesh: 'A' | 'B' | null;
  onSelectMesh: (m: 'A' | 'B') => void;
}) {
  const fromMeshRef = useRef<THREE.Mesh>(null);
  const toMeshRef = useRef<THREE.Mesh>(null);
  const { controls } = useThree();

  // Force a re-render after first mount so that fromMeshRef.current / toMeshRef.current
  // are populated before we attempt to pass one to TransformGizmo.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Set initial positions once on mount
  useEffect(() => {
    if (fromMeshRef.current) fromMeshRef.current.position.copy(fromPositionRef.current);
    if (toMeshRef.current) toMeshRef.current.position.copy(toPositionRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync BOTH mesh positions to their shared refs every frame.
  // Since the meshes are always mounted, positions are never lost on selection change.
  useFrame(() => {
    if (fromMeshRef.current) fromPositionRef.current.copy(fromMeshRef.current.position);
    if (toMeshRef.current) toPositionRef.current.copy(toMeshRef.current.position);
  });

  // Resolve the active THREE.Mesh for the gizmo — only after refs are populated
  const activeMesh = !mounted ? null
    : selectedMesh === 'A' ? fromMeshRef.current
    : selectedMesh === 'B' ? toMeshRef.current
    : null;


  return (
    <>
      {/* Mesh A — always mounted, click to select */}
      <mesh
        ref={fromMeshRef}
        geometry={fromGeometry}
        onPointerDown={(e) => { e.stopPropagation(); onSelectMesh('A'); }}
      >
        <meshBasicMaterial
          color="#4fc3f7"
          wireframe
          transparent
          opacity={selectedMesh === 'A' ? 0.4 : 0.15}
          depthWrite={false}
        />
      </mesh>

      {/* Mesh B — always mounted, click to select */}
      <mesh
        ref={toMeshRef}
        geometry={toGeometry}
        onPointerDown={(e) => { e.stopPropagation(); onSelectMesh('B'); }}
      >
        <meshBasicMaterial
          color="#ff8a65"
          wireframe
          transparent
          opacity={selectedMesh === 'B' ? 0.4 : 0.15}
          depthWrite={false}
        />
      </mesh>

      {/* Single gizmo that attaches to whichever mesh is selected */}
      {activeMesh && (
        <TransformGizmo key={selectedMesh} mesh={activeMesh} controls={controls} />
      )}
    </>
  );
}


/* ───────── mesh presets ───────── */

type MeshPreset = {
  label: string;
  value: string;
  type: 'procedural' | 'glb' | 'upload';
  factory?: () => THREE.BufferGeometry;
};

const MESH_PRESETS: MeshPreset[] = [
  { label: 'TorusKnot', value: 'torusknot', type: 'procedural', factory: () => new THREE.TorusKnotGeometry(1.0, 0.32, 260, 36) },
  { label: 'Icosahedron', value: 'icosahedron', type: 'procedural', factory: () => new THREE.IcosahedronGeometry(1.25, 4) },
  { label: 'Sphere', value: 'sphere', type: 'procedural', factory: () => new THREE.SphereGeometry(1.2, 64, 64) },
  { label: 'Torus', value: 'torus', type: 'procedural', factory: () => new THREE.TorusGeometry(1.0, 0.4, 32, 100) },
  { label: 'Submarine', value: 'submarine.glb', type: 'glb' },
  { label: 'Table', value: 'Table.glb', type: 'glb' },
  { label: 'Shipyard', value: 'shipyard.glb', type: 'glb' },
  { label: 'Upload…', value: '__upload__', type: 'upload' },
];

const PRESET_OPTIONS = MESH_PRESETS.map((p) => p.label);
const DEFAULT_A = 'TorusKnot';
const DEFAULT_B = 'Icosahedron';

function findPreset(label: string): MeshPreset | undefined {
  return MESH_PRESETS.find((p) => p.label === label);
}

/* ───────── default mesh positions ───────── */

const DEFAULT_POS_A = new THREE.Vector3(-1.5, 0, 0);
const DEFAULT_POS_B = new THREE.Vector3(1.5, 0, 0);

/* ───────── main page ───────── */

export function ParticlesPage() {
  /* ── procedural fallbacks ── */
  const defaultFrom = useMemo(() => new THREE.TorusKnotGeometry(1.0, 0.32, 260, 36), []);
  const defaultTo = useMemo(() => new THREE.IcosahedronGeometry(1.25, 4), []);

  useEffect(() => {
    return () => {
      defaultFrom.dispose();
      defaultTo.dispose();
    };
  }, [defaultFrom, defaultTo]);

  /* ── geometry state ── */
  const [fromGeo, setFromGeo] = useState<THREE.BufferGeometry | null>(null);
  const [toGeo, setToGeo] = useState<THREE.BufferGeometry | null>(null);

  /* ── GLB URLs (for both preset and uploaded) ── */
  const [fromUrl, setFromUrl] = useState<string | null>(null);
  const [toUrl, setToUrl] = useState<string | null>(null);
  const [fromIsBlob, setFromIsBlob] = useState(false);
  const [toIsBlob, setToIsBlob] = useState(false);

  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  /* ── mesh position refs ── */
  const meshAPos = useRef(DEFAULT_POS_A.clone());
  const meshBPos = useRef(DEFAULT_POS_B.clone());

  /* ── which mesh has the active gizmo ── */
  const [selectedMesh, setSelectedMesh] = useState<'A' | 'B' | null>(null);

  /* ── pending upload slot — remember which slot triggered the file input ── */
  const pendingUploadSlot = useRef<'from' | 'to' | null>(null);

  /* ── apply preset for a slot ── */
  const applyPreset = useCallback(
    (label: string, slot: 'from' | 'to') => {
      const preset = findPreset(label);
      if (!preset) return;

      if (preset.type === 'upload') {
        pendingUploadSlot.current = slot;
        if (slot === 'from') fromInputRef.current?.click();
        else toInputRef.current?.click();
        return;
      }

      // Clean up previous blob URL
      if (slot === 'from') {
        if (fromIsBlob && fromUrl) URL.revokeObjectURL(fromUrl);
        setFromIsBlob(false);
      } else {
        if (toIsBlob && toUrl) URL.revokeObjectURL(toUrl);
        setToIsBlob(false);
      }

      if (preset.type === 'procedural' && preset.factory) {
        const geo = preset.factory();
        if (slot === 'from') {
          setFromUrl(null);
          setFromGeo(geo);
        } else {
          setToUrl(null);
          setToGeo(geo);
        }
      } else if (preset.type === 'glb') {
        const glbUrl = `${import.meta.env.BASE_URL}${preset.value}`;
        if (slot === 'from') {
          setFromGeo(null);
          setFromUrl(glbUrl);
        } else {
          setToGeo(null);
          setToUrl(glbUrl);
        }
      }
    },
    [fromUrl, toUrl, fromIsBlob, toIsBlob],
  );

  /* ── file upload handlers ── */
  const handleFileUpload = useCallback(
    (file: File, slot: 'from' | 'to') => {
      const name = file.name.toLowerCase();
      if (!name.endsWith('.glb') && !name.endsWith('.gltf')) {
        alert('Please provide a .glb or .gltf file.');
        return;
      }
      const blobUrl = URL.createObjectURL(file);
      if (slot === 'from') {
        if (fromIsBlob && fromUrl) URL.revokeObjectURL(fromUrl);
        setFromUrl(blobUrl);
        setFromGeo(null);
        setFromIsBlob(true);
      } else {
        if (toIsBlob && toUrl) URL.revokeObjectURL(toUrl);
        setToUrl(blobUrl);
        setToGeo(null);
        setToIsBlob(true);
      }
    },
    [fromUrl, toUrl, fromIsBlob, toIsBlob],
  );

  const handleFromChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file, 'from');
    },
    [handleFileUpload],
  );

  const handleToChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file, 'to');
    },
    [handleFileUpload],
  );

  const handleFromGeometry = useCallback((geo: THREE.BufferGeometry) => {
    setFromGeo(geo);
  }, []);

  const handleToGeometry = useCallback((geo: THREE.BufferGeometry) => {
    setToGeo(geo);
  }, []);

  /* ── effective geometries ── */
  const effectiveFrom = fromGeo ?? defaultFrom;
  const effectiveTo = toGeo ?? defaultTo;

  /* ── controls ── */
  const [controls, setControls] = useDebugControls('Particles', () => ({
    Params: {
      type: 'folder' as const,
      title: 'Particles',
      controls: {
        count: { value: 70000, min: 5000, max: 150000, step: 5000 },
        pointSize: { value: 2.4, min: 0.5, max: 32.0, step: 0.1 },
        turbulence: { value: 1.15, min: 0.0, max: 4.0, step: 0.05 },
        speed: { value: 0.8, min: 0.1, max: 3.0, step: 0.05 },
        color: { value: '#cfe8ff' },
        opacity: { value: 1.0, min: 0.1, max: 1.0, step: 0.05 },
      },
    } satisfies FolderControl,
    Meshes: {
      type: 'folder' as const,
      title: 'Meshes',
      controls: {
        showMeshes: { value: false, label: 'Show Meshes' },
        meshA: { type: 'select' as const, value: DEFAULT_A, options: PRESET_OPTIONS, label: 'Mesh A (blue)' },
        meshB: { type: 'select' as const, value: DEFAULT_B, options: PRESET_OPTIONS, label: 'Mesh B (orange)' },
        '◎ Select A': { type: 'button' as const, label: '◎ Select Mesh A', onClick: () => setSelectedMesh('A') },
        '◎ Select B': { type: 'button' as const, label: '◎ Select Mesh B', onClick: () => setSelectedMesh('B') },
        '↺ Reset': {
          type: 'button' as const,
          label: '↺ Reset to Defaults',
          onClick: () => {
            if (fromIsBlob && fromUrl) URL.revokeObjectURL(fromUrl);
            if (toIsBlob && toUrl) URL.revokeObjectURL(toUrl);
            setFromUrl(null);
            setToUrl(null);
            setFromGeo(null);
            setToGeo(null);
            setFromIsBlob(false);
            setToIsBlob(false);
            meshAPos.current.copy(DEFAULT_POS_A);
            meshBPos.current.copy(DEFAULT_POS_B);
            setSelectedMesh(null);
            setControls({ meshA: DEFAULT_A, meshB: DEFAULT_B });
          },
        },
      },
    } satisfies FolderControl,
  }), []);

  const showMeshes = controls.showMeshes as boolean;

  /* ── react to dropdown changes ── */
  const prevMeshA = useRef(DEFAULT_A);
  const prevMeshB = useRef(DEFAULT_B);

  useEffect(() => {
    const meshA = controls.meshA as string;
    const meshB = controls.meshB as string;

    if (meshA !== prevMeshA.current) {
      prevMeshA.current = meshA;
      applyPreset(meshA, 'from');
    }
    if (meshB !== prevMeshB.current) {
      prevMeshB.current = meshB;
      applyPreset(meshB, 'to');
    }
  }, [controls.meshA, controls.meshB, applyPreset]);

  /* ── key to force ParticlesMorph remount on geometry change ── */
  const morphKey = `${fromUrl ?? 'default-from'}_${toUrl ?? 'default-to'}_${controls.count}_${fromGeo ? 'fg' : ''}${toGeo ? 'tg' : ''}`;

  return (
    <PageLayout background="#05050a">
      {/* hidden file inputs */}
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
        <color attach="background" args={['#05050a']} />
        <ambientLight intensity={0.6} />

        {fromUrl && (
          <GLBGeometryLoader url={fromUrl} onGeometry={handleFromGeometry} />
        )}
        {toUrl && (
          <GLBGeometryLoader url={toUrl} onGeometry={handleToGeometry} />
        )}

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
          fromOffset={meshAPos}
          toOffset={meshBPos}
        />

        {/* Wireframe mesh previews — both always mounted so positions persist */}
        {showMeshes && (
          <MeshPreviews
            fromGeometry={effectiveFrom}
            toGeometry={effectiveTo}
            fromPositionRef={meshAPos}
            toPositionRef={meshBPos}
            selectedMesh={selectedMesh}
            onSelectMesh={setSelectedMesh}
          />
        )}

        <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
        <DebugOverlay />
      </Canvas>

  
    </PageLayout>
  );
}

