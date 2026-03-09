/// <reference types="vite/client" />
import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { PageLayout } from '@lilypad/page-layout';
import styles from './BattleboardPage.module.scss';

export type BattleboardRenderMode = 'SHADED' | 'WIREFRAME' | 'RTX' | 'RTX2';
export type BattleboardScale = '1 Mile' | '10 Miles' | '100 Miles';

export interface BattleboardTarget {
  id: string;
  label: string;
  nx: number;
  ny: number;
  nz: number;
}

export interface BattleboardSceneProps {
  tableUrl?: string;
  targets?: BattleboardTarget[];
  wireframe?: boolean;
}

export interface BattleboardPageProps extends BattleboardSceneProps {
  background?: string;
  initialRenderMode?: BattleboardRenderMode;
  initialScale?: BattleboardScale;
  renderModes?: readonly BattleboardRenderMode[];
  scales?: readonly BattleboardScale[];
  showHud?: boolean;
  showToolbar?: boolean;
}

const DISPLAY_WIDTH = 5.5;
const DISPLAY_HEIGHT = 3.0;
const DISPLAY_DEPTH = 4.2;
const TABLE_Y = 0.78;

export const DEFAULT_BATTLEBOARD_TARGETS: BattleboardTarget[] = [
  { id: 'e3a', label: 'E3A', nx: 0.18, ny: 0.91, nz: 0.1 },
  { id: 'topaz', label: 'Topaz SAR LED', nx: 0.72, ny: 0.93, nz: 0.09 },
  { id: 'phase35', label: 'Phase 35', nx: 0.54, ny: 0.73, nz: 0.28 },
  { id: 'typhoon', label: 'Typhoon\nC-130 Hercules', nx: 0.73, ny: 0.66, nz: 0.4 },
  { id: 'wk450', label: 'WK 450', nx: 0.6, ny: 0.5, nz: 0.51 },
  { id: 's700', label: 'S700', nx: 0.47, ny: 0.37, nz: 0.59 },
  { id: 't29', label: 'T-29', nx: 0.28, ny: 0.11, nz: 0.7 },
  { id: 't46', label: 'T-46', nx: 0.76, ny: 0.11, nz: 0.72 },
  { id: 'pr0582', label: 'PR 0582', nx: 0.16, ny: 0.07, nz: 0.75 },
  { id: 'mig29', label: 'Mig-29 Fulcrum', nx: 0.2, ny: 0.63, nz: 0.4 },
];

export const DEFAULT_BATTLEBOARD_RENDER_MODES = [
  'SHADED',
  'WIREFRAME',
  'RTX',
  'RTX2',
] as const satisfies readonly BattleboardRenderMode[];

export const DEFAULT_BATTLEBOARD_SCALES = [
  '1 Mile',
  '10 Miles',
  '100 Miles',
] as const satisfies readonly BattleboardScale[];

export const DEFAULT_BATTLEBOARD_TABLE_URL = `${import.meta.env.BASE_URL}Table.glb`;
useGLTF.preload(DEFAULT_BATTLEBOARD_TABLE_URL);

export function toBattleboardWorld(
  nx: number,
  ny: number,
  nz: number,
): [number, number, number] {
  return [
    (nx - 0.5) * DISPLAY_WIDTH,
    TABLE_Y + ny * DISPLAY_HEIGHT,
    (nz - 0.5) * DISPLAY_DEPTH,
  ];
}

export function terrainHeight(x: number, z: number) {
  return (
    Math.sin(x * 0.9) * Math.cos(z * 0.7) * 0.55 +
    Math.sin(x * 1.8 + 0.3) * Math.sin(z * 1.4) * 0.22 +
    Math.cos(x * 0.5 + z * 0.7) * 0.28 +
    Math.sin(x * 2.8 - z * 2.0) * 0.1
  );
}

function TableModel({ tableUrl }: { tableUrl: string }) {
  const { scene } = useGLTF(tableUrl);
  const cloned = useMemo(() => scene.clone(), [scene]);
  return <primitive object={cloned} />;
}

function TerrainMesh({ wireframe }: { wireframe: boolean }) {
  const geometry = useMemo(() => {
    const segments = 96;
    const plane = new THREE.PlaneGeometry(
      DISPLAY_WIDTH,
      DISPLAY_DEPTH,
      segments,
      segments,
    );
    plane.rotateX(-Math.PI / 2);

    const position = plane.attributes.position as THREE.BufferAttribute;
    for (let index = 0; index < position.count; index += 1) {
      const height = terrainHeight(position.getX(index), position.getZ(index));
      position.setY(index, Math.max(height * 0.65, 0));
    }

    position.needsUpdate = true;
    plane.computeVertexNormals();
    return plane;
  }, []);

  return (
    <group position={[0, TABLE_Y, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[DISPLAY_WIDTH, DISPLAY_DEPTH]} />
        <meshStandardMaterial color="#0c3550" roughness={0.9} />
      </mesh>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={wireframe ? '#00ffcc' : '#3a6a52'}
          wireframe={wireframe}
          roughness={0.85}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

function DisplayFrame() {
  const geometry = useMemo(
    () =>
      new THREE.EdgesGeometry(
        new THREE.BoxGeometry(DISPLAY_WIDTH, DISPLAY_HEIGHT, DISPLAY_DEPTH),
      ),
    [],
  );

  return (
    <lineSegments geometry={geometry} position={[0, TABLE_Y + DISPLAY_HEIGHT / 2, 0]}>
      <lineBasicMaterial color="#00ffcc" transparent opacity={0.5} />
    </lineSegments>
  );
}

function HoloGrid() {
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const columns = 14;
    const rows = 11;

    for (let index = 0; index <= columns; index += 1) {
      const x = -DISPLAY_WIDTH / 2 + (index / columns) * DISPLAY_WIDTH;
      points.push(
        new THREE.Vector3(x, 0, -DISPLAY_DEPTH / 2),
        new THREE.Vector3(x, 0, DISPLAY_DEPTH / 2),
      );
    }

    for (let index = 0; index <= rows; index += 1) {
      const z = -DISPLAY_DEPTH / 2 + (index / rows) * DISPLAY_DEPTH;
      points.push(
        new THREE.Vector3(-DISPLAY_WIDTH / 2, 0, z),
        new THREE.Vector3(DISPLAY_WIDTH / 2, 0, z),
      );
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  return (
    <lineSegments geometry={geometry} position={[0, TABLE_Y + 0.01, 0]}>
      <lineBasicMaterial color="#005544" transparent opacity={0.75} />
    </lineSegments>
  );
}

function CloudLayer() {
  const clouds = useMemo(
    () => [
      { x: -1.7, z: -1.4, w: 2.4, d: 0.9, r: 0.08 },
      { x: 0.9, z: -1.2, w: 1.9, d: 0.7, r: -0.18 },
      { x: -0.4, z: -0.9, w: 1.4, d: 0.6, r: 0.04 },
      { x: 1.6, z: -0.5, w: 1.7, d: 0.8, r: 0.14 },
      { x: -1.1, z: -0.3, w: 1.2, d: 0.5, r: -0.09 },
    ],
    [],
  );

  const cloudY = TABLE_Y + DISPLAY_HEIGHT * 0.62;

  return (
    <group position={[0, cloudY, 0]}>
      {clouds.map((cloud, index) => (
        <mesh
          key={index}
          position={[cloud.x, 0, cloud.z]}
          rotation={[-Math.PI / 2, 0, cloud.r]}
        >
          <planeGeometry args={[cloud.w, cloud.d]} />
          <meshBasicMaterial
            color="white"
            transparent
            opacity={0.11}
            depthWrite={false}
          />
        </mesh>
      ))}
      {clouds.map((cloud, index) => (
        <mesh
          key={`core-${cloud.x}-${cloud.z}-${index}`}
          position={[cloud.x, 0.025, cloud.z]}
          rotation={[-Math.PI / 2, 0, cloud.r + 0.28]}
        >
          <planeGeometry args={[cloud.w * 0.6, cloud.d * 0.55]} />
          <meshBasicMaterial
            color="white"
            transparent
            opacity={0.08}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function ScanLine() {
  const meshRef = useRef<THREE.Mesh>(null);
  const lineRef = useRef<THREE.LineSegments>(null);

  useFrame(({ clock }) => {
    const progress = (clock.getElapsedTime() * 0.16) % 1;
    const z = DISPLAY_DEPTH / 2 - progress * DISPLAY_DEPTH;

    if (meshRef.current) {
      meshRef.current.position.z = z;
    }

    if (lineRef.current) {
      lineRef.current.position.z = z;
    }
  });

  const lineGeometry = useMemo(
    () =>
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-DISPLAY_WIDTH / 2, 0, 0),
        new THREE.Vector3(DISPLAY_WIDTH / 2, 0, 0),
      ]),
    [],
  );

  return (
    <group position={[0, TABLE_Y + 0.025, 0]}>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[DISPLAY_WIDTH, 0.07]} />
        <meshBasicMaterial
          color="#00ffcc"
          transparent
          opacity={0.45}
          depthWrite={false}
        />
      </mesh>
      <lineSegments ref={lineRef} geometry={lineGeometry}>
        <lineBasicMaterial color="#00ffcc" transparent opacity={0.85} />
      </lineSegments>
    </group>
  );
}

function TargetReticle({
  label,
  position,
}: {
  label: string;
  position: [number, number, number];
}) {
  const size = 0.09;
  const geometry = useMemo(() => {
    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute(
      'position',
      new THREE.BufferAttribute(
        new Float32Array([
          -size, 0, -size,
          size, 0, -size,
          size, 0, -size,
          size, 0, size,
          size, 0, size,
          -size, 0, size,
          -size, 0, size,
          -size, 0, -size,
        ]),
        3,
      ),
    );
    return buffer;
  }, [size]);

  return (
    <group position={position}>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color="#00ffcc" transparent opacity={0.9} />
      </lineSegments>
      <mesh>
        <sphereGeometry args={[0.016, 6, 6]} />
        <meshBasicMaterial color="#00ffcc" />
      </mesh>
      <Html center distanceFactor={9} zIndexRange={[10, 20]}>
        <div className={styles.targetLabel}>
          {label.split('\n').map((line, index) => (
            <div key={`${line}-${index}`}>{line}</div>
          ))}
        </div>
      </Html>
    </group>
  );
}

function RoomBox() {
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const count = 10;
    const size = 16;

    for (let index = 0; index <= count; index += 1) {
      const value = -size / 2 + (index / count) * size;
      points.push(
        new THREE.Vector3(value, 0, -size / 2),
        new THREE.Vector3(value, 0, size / 2),
        new THREE.Vector3(-size / 2, 0, value),
        new THREE.Vector3(size / 2, 0, value),
      );
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  return (
    <lineSegments geometry={geometry} position={[0, TABLE_Y + DISPLAY_HEIGHT + 1.5, 0]}>
      <lineBasicMaterial color="#003322" transparent opacity={0.35} />
    </lineSegments>
  );
}

function RulerRight() {
  const ticks = Array.from({ length: 21 }, (_, index) => index);

  return (
    <div className={styles.rulerRight}>
      {ticks.map((tick) => (
        <div
          key={tick}
          className={`${styles.tick} ${tick % 5 === 0 ? styles.tickMajor : ''}`}
          style={{ top: `${(tick / 20) * 100}%` }}
        >
          {tick % 5 === 0 ? (
            <span className={styles.tickLabel}>{tick * 5}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function RulerTop() {
  const ticks = Array.from({ length: 21 }, (_, index) => index);

  return (
    <div className={styles.rulerTop}>
      {ticks.map((tick) => (
        <div
          key={tick}
          className={`${styles.tickH} ${tick % 5 === 0 ? styles.tickHMajor : ''}`}
          style={{ left: `${(tick / 20) * 100}%` }}
        >
          {tick % 5 === 0 ? (
            <span className={styles.tickLabelH}>{tick * 5}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function BattleboardScene({
  tableUrl = DEFAULT_BATTLEBOARD_TABLE_URL,
  targets = DEFAULT_BATTLEBOARD_TARGETS,
  wireframe = false,
}: BattleboardSceneProps) {
  return (
    <>
      <color attach="background" args={['#020c14']} />
      <fog attach="fog" args={['#020c14', 20, 45]} />
      <ambientLight intensity={0.12} />
      <pointLight
        position={[0, TABLE_Y + DISPLAY_HEIGHT * 0.85, 0]}
        intensity={1.4}
        color="#00ffcc"
        distance={11}
        decay={2}
      />
      <pointLight
        position={[2.2, TABLE_Y + DISPLAY_HEIGHT * 0.3, -1.5]}
        intensity={0.7}
        color="#0077cc"
        distance={9}
        decay={2}
      />
      <directionalLight position={[4, 8, 5]} intensity={0.25} color="#aaddff" />
      <Suspense fallback={null}>
        <TableModel tableUrl={tableUrl} />
      </Suspense>
      <DisplayFrame />
      <HoloGrid />
      <TerrainMesh wireframe={wireframe} />
      <CloudLayer />
      <ScanLine />
      <RoomBox />
      {targets.map((target) => (
        <TargetReticle
          key={target.id}
          label={target.label}
          position={toBattleboardWorld(target.nx, target.ny, target.nz)}
        />
      ))}
      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        target={[0, TABLE_Y + DISPLAY_HEIGHT * 0.45, 0]}
        minDistance={3}
        maxDistance={22}
      />
    </>
  );
}

export function BattleboardPage({
  background = '#020c14',
  initialRenderMode = 'SHADED',
  initialScale = '10 Miles',
  renderModes = DEFAULT_BATTLEBOARD_RENDER_MODES,
  scales = DEFAULT_BATTLEBOARD_SCALES,
  showHud = true,
  showToolbar = true,
  tableUrl = DEFAULT_BATTLEBOARD_TABLE_URL,
  targets = DEFAULT_BATTLEBOARD_TARGETS,
}: BattleboardPageProps) {
  const [renderMode, setRenderMode] = useState<BattleboardRenderMode>(initialRenderMode);
  const [scale, setScale] = useState<BattleboardScale>(initialScale);

  return (
    <PageLayout
      background={background}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <div className={styles.canvasWrap}>
        <Canvas
          camera={{ fov: 44, near: 0.1, far: 100, position: [5.5, 5.8, 7.5] }}
          gl={{ antialias: true }}
        >
          <BattleboardScene
            tableUrl={tableUrl}
            targets={targets}
            wireframe={renderMode === 'WIREFRAME'}
          />
        </Canvas>
        {showHud ? (
          <div className={styles.hud} aria-hidden="true">
            <RulerTop />
            <RulerRight />
            <div className={`${styles.corner} ${styles.cornerTL}`} />
            <div className={`${styles.corner} ${styles.cornerTR}`} />
            <div className={`${styles.corner} ${styles.cornerBL}`} />
            <div className={`${styles.corner} ${styles.cornerBR}`} />
            <div className={styles.brandLabel}>LILYPAD</div>
          </div>
        ) : null}
        {showToolbar ? (
          <div className={styles.toolbar}>
            <div className={styles.toolGroup}>
              {renderModes.map((mode) => (
                <button
                  key={mode}
                  className={`${styles.btn} ${renderMode === mode ? styles.btnActive : ''}`}
                  onClick={() => setRenderMode(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>
            <div className={styles.toolSep} />
            <div className={styles.toolGroup}>
              <span className={styles.scaleLabel}>SCALE</span>
              {scales.map((nextScale) => (
                <button
                  key={nextScale}
                  className={`${styles.btn} ${scale === nextScale ? styles.btnActive : ''}`}
                  onClick={() => setScale(nextScale)}
                >
                  {nextScale}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </PageLayout>
  );
}
