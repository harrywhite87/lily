import { Suspense, useState, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import styles from './BattleboardPage.module.scss';
import { PageLayout } from '../layout/PageLayout';

// ── Display volume constants ──────────────────────────────────────
const DW = 5.5;      // width  (x)
const DH = 3.0;      // height (y)
const DD = 4.2;      // depth  (z)
const TABLE_Y = 0.78; // approx table surface world Y

// ── Target data (normalized 0..1 within display volume) ──────────
const TARGETS = [
  { id: 'e3a',      label: 'E3A',                    nx: 0.18, ny: 0.91, nz: 0.10 },
  { id: 'topaz',    label: 'Topaz SAR LED',           nx: 0.72, ny: 0.93, nz: 0.09 },
  { id: 'phase35',  label: 'Phase 35',                nx: 0.54, ny: 0.73, nz: 0.28 },
  { id: 'typhoon',  label: 'Typhoon\nC-130 Hercules', nx: 0.73, ny: 0.66, nz: 0.40 },
  { id: 'wk450',    label: 'WK 450',                  nx: 0.60, ny: 0.50, nz: 0.51 },
  { id: 's700',     label: 'S700',                    nx: 0.47, ny: 0.37, nz: 0.59 },
  { id: 't29',      label: 'T-29',                    nx: 0.28, ny: 0.11, nz: 0.70 },
  { id: 't46',      label: 'T-46',                    nx: 0.76, ny: 0.11, nz: 0.72 },
  { id: 'pr0582',   label: 'PR 0582',                 nx: 0.16, ny: 0.07, nz: 0.75 },
  { id: 'mig29',    label: 'Mig-29 Fulcrum',          nx: 0.20, ny: 0.63, nz: 0.40 },
];

function toWorld(nx: number, ny: number, nz: number): [number, number, number] {
  return [(nx - 0.5) * DW, TABLE_Y + ny * DH, (nz - 0.5) * DD];
}

// ── Terrain displacement ──────────────────────────────────────────
function terrainH(x: number, z: number): number {
  return (
    Math.sin(x * 0.9) * Math.cos(z * 0.7) * 0.55 +
    Math.sin(x * 1.8 + 0.3) * Math.sin(z * 1.4) * 0.22 +
    Math.cos(x * 0.5 + z * 0.7) * 0.28 +
    Math.sin(x * 2.8 - z * 2.0) * 0.10
  );
}

// ── Table model ───────────────────────────────────────────────────
const TABLE_URL = `${import.meta.env.BASE_URL}Table.glb`;
useGLTF.preload(TABLE_URL);

function TableModel() {
  const { scene } = useGLTF(TABLE_URL);
  const cloned = useMemo(() => scene.clone(), [scene]);
  return <primitive object={cloned} />;
}

// ── Terrain mesh ──────────────────────────────────────────────────
function TerrainMesh({ wireframe }: { wireframe: boolean }) {
  const geo = useMemo(() => {
    const SEGS = 96;
    const g = new THREE.PlaneGeometry(DW, DD, SEGS, SEGS);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const h = terrainH(pos.getX(i), pos.getZ(i));
      pos.setY(i, Math.max(h * 0.65, 0));
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <group position={[0, TABLE_Y, 0]}>
      {/* Ocean base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[DW, DD]} />
        <meshStandardMaterial color="#0c3550" roughness={0.9} />
      </mesh>
      {/* Terrain */}
      <mesh geometry={geo}>
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

// ── Holographic display frame (wire box) ──────────────────────────
function DisplayFrame() {
  const geo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(DW, DH, DD)), []);
  return (
    <lineSegments geometry={geo} position={[0, TABLE_Y + DH / 2, 0]}>
      <lineBasicMaterial color="#00ffcc" transparent opacity={0.5} />
    </lineSegments>
  );
}

// ── Grid on the display floor ─────────────────────────────────────
function HoloGrid() {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const cols = 14, rows = 11;
    for (let i = 0; i <= cols; i++) {
      const x = -DW / 2 + (i / cols) * DW;
      pts.push(new THREE.Vector3(x, 0, -DD / 2), new THREE.Vector3(x, 0, DD / 2));
    }
    for (let j = 0; j <= rows; j++) {
      const z = -DD / 2 + (j / rows) * DD;
      pts.push(new THREE.Vector3(-DW / 2, 0, z), new THREE.Vector3(DW / 2, 0, z));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  return (
    <lineSegments geometry={geo} position={[0, TABLE_Y + 0.01, 0]}>
      <lineBasicMaterial color="#005544" transparent opacity={0.75} />
    </lineSegments>
  );
}

// ── Cloud layer ───────────────────────────────────────────────────
function CloudLayer() {
  const clouds = useMemo(() => [
    { x: -1.7, z: -1.4, w: 2.4, d: 0.9, r: 0.08 },
    { x:  0.9, z: -1.2, w: 1.9, d: 0.7, r: -0.18 },
    { x: -0.4, z: -0.9, w: 1.4, d: 0.6, r: 0.04 },
    { x:  1.6, z: -0.5, w: 1.7, d: 0.8, r: 0.14 },
    { x: -1.1, z: -0.3, w: 1.2, d: 0.5, r: -0.09 },
  ], []);

  const cloudY = TABLE_Y + DH * 0.62;

  return (
    <group position={[0, cloudY, 0]}>
      {clouds.map((c, i) => (
        <mesh key={i} position={[c.x, 0, c.z]} rotation={[-Math.PI / 2, 0, c.r]}>
          <planeGeometry args={[c.w, c.d]} />
          <meshBasicMaterial color="white" transparent opacity={0.11} depthWrite={false} />
        </mesh>
      ))}
      {clouds.map((c, i) => (
        <mesh key={`core-${i}`} position={[c.x, 0.025, c.z]} rotation={[-Math.PI / 2, 0, c.r + 0.28]}>
          <planeGeometry args={[c.w * 0.6, c.d * 0.55]} />
          <meshBasicMaterial color="white" transparent opacity={0.08} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// ── Animated scan line ────────────────────────────────────────────
function ScanLine() {
  const meshRef = useRef<THREE.Mesh>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  useFrame(({ clock }) => {
    const t = (clock.getElapsedTime() * 0.16) % 1;
    const z = DD / 2 - t * DD;
    if (meshRef.current) meshRef.current.position.z = z;
    if (linesRef.current) linesRef.current.position.z = z;
  });

  const lineGeo = useMemo(
    () => new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-DW / 2, 0, 0),
      new THREE.Vector3( DW / 2, 0, 0),
    ]),
    [],
  );

  return (
    <group position={[0, TABLE_Y + 0.025, 0]}>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[DW, 0.07]} />
        <meshBasicMaterial color="#00ffcc" transparent opacity={0.45} depthWrite={false} />
      </mesh>
      <lineSegments ref={linesRef} geometry={lineGeo}>
        <lineBasicMaterial color="#00ffcc" transparent opacity={0.85} />
      </lineSegments>
    </group>
  );
}

// ── Target reticle marker ─────────────────────────────────────────
function TargetReticle({
  pos,
  label,
}: {
  pos: [number, number, number];
  label: string;
}) {
  const S = 0.09;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      'position',
      new THREE.BufferAttribute(
        new Float32Array([
          -S, 0, -S,  S, 0, -S,
           S, 0, -S,  S, 0,  S,
           S, 0,  S, -S, 0,  S,
          -S, 0,  S, -S, 0, -S,
        ]),
        3,
      ),
    );
    return g;
  }, []);

  return (
    <group position={pos}>
      <lineSegments geometry={geo}>
        <lineBasicMaterial color="#00ffcc" transparent opacity={0.9} />
      </lineSegments>
      <mesh>
        <sphereGeometry args={[0.016, 6, 6]} />
        <meshBasicMaterial color="#00ffcc" />
      </mesh>
      <Html center distanceFactor={9} zIndexRange={[10, 20]}>
        <div className={styles.targetLabel}>
          {label.split('\n').map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      </Html>
    </group>
  );
}

// ── Ambient room geometry ─────────────────────────────────────────
function RoomBox() {
  // Subtle ceiling grid lines above the scene
  const ceilGeo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const n = 10, size = 16;
    for (let i = 0; i <= n; i++) {
      const t = -size / 2 + (i / n) * size;
      pts.push(new THREE.Vector3(t, 0, -size / 2), new THREE.Vector3(t, 0, size / 2));
      pts.push(new THREE.Vector3(-size / 2, 0, t), new THREE.Vector3(size / 2, 0, t));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  return (
    <lineSegments geometry={ceilGeo} position={[0, TABLE_Y + DH + 1.5, 0]}>
      <lineBasicMaterial color="#003322" transparent opacity={0.35} />
    </lineSegments>
  );
}

// ── Full 3D scene ─────────────────────────────────────────────────
function Scene({ wireframe }: { wireframe: boolean }) {
  return (
    <>
      <color attach="background" args={['#020c14']} />
      <fog attach="fog" args={['#020c14', 20, 45]} />

      {/* Lighting */}
      <ambientLight intensity={0.12} />
      <pointLight
        position={[0, TABLE_Y + DH * 0.85, 0]}
        intensity={1.4}
        color="#00ffcc"
        distance={11}
        decay={2}
      />
      <pointLight
        position={[2.2, TABLE_Y + DH * 0.3, -1.5]}
        intensity={0.7}
        color="#0077cc"
        distance={9}
        decay={2}
      />
      <directionalLight position={[4, 8, 5]} intensity={0.25} color="#aaddff" />

      {/* Table model */}
      <Suspense fallback={null}>
        <TableModel />
      </Suspense>

      {/* Holographic battle display */}
      <DisplayFrame />
      <HoloGrid />
      <TerrainMesh wireframe={wireframe} />
      <CloudLayer />
      <ScanLine />
      <RoomBox />

      {/* Target markers */}
      {TARGETS.map((t) => (
        <TargetReticle key={t.id} pos={toWorld(t.nx, t.ny, t.nz)} label={t.label} />
      ))}

      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        target={[0, TABLE_Y + DH * 0.45, 0]}
        minDistance={3}
        maxDistance={22}
      />
    </>
  );
}

// ── HUD overlays ──────────────────────────────────────────────────
function RulerRight() {
  const ticks = Array.from({ length: 21 }, (_, i) => i);
  return (
    <div className={styles.rulerRight}>
      {ticks.map((i) => (
        <div key={i} className={`${styles.tick} ${i % 5 === 0 ? styles.tickMajor : ''}`} style={{ top: `${(i / 20) * 100}%` }}>
          {i % 5 === 0 && <span className={styles.tickLabel}>{i * 5}</span>}
        </div>
      ))}
    </div>
  );
}

function RulerTop() {
  const ticks = Array.from({ length: 21 }, (_, i) => i);
  return (
    <div className={styles.rulerTop}>
      {ticks.map((i) => (
        <div key={i} className={`${styles.tickH} ${i % 5 === 0 ? styles.tickHMajor : ''}`} style={{ left: `${(i / 20) * 100}%` }}>
          {i % 5 === 0 && <span className={styles.tickLabelH}>{i * 5}</span>}
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────
const RENDER_MODES = ['SHADED', 'WIREFRAME', 'RTX', 'RTX2'] as const;
const SCALES = ['1 Mile', '10 Miles', '100 Miles'] as const;

export function BattleboardPage() {
  const [renderMode, setRenderMode] = useState<(typeof RENDER_MODES)[number]>('SHADED');
  const [scale, setScale] = useState<(typeof SCALES)[number]>('10 Miles');

  return (
    <PageLayout background="#020c14" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className={styles.canvasWrap}>
        <Canvas
          camera={{ fov: 44, near: 0.1, far: 100, position: [5.5, 5.8, 7.5] }}
          gl={{ antialias: true }}
        >
          <Scene wireframe={renderMode === 'WIREFRAME'} />
        </Canvas>

        {/* HUD layer */}
        <div className={styles.hud} aria-hidden="true">
          <RulerTop />
          <RulerRight />
          <div className={`${styles.corner} ${styles.cornerTL}`} />
          <div className={`${styles.corner} ${styles.cornerTR}`} />
          <div className={`${styles.corner} ${styles.cornerBL}`} />
          <div className={`${styles.corner} ${styles.cornerBR}`} />
          <div className={styles.brandLabel}>LILYPAD</div>
        </div>

        {/* Bottom toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolGroup}>
            {RENDER_MODES.map((m) => (
              <button
                key={m}
                className={`${styles.btn} ${renderMode === m ? styles.btnActive : ''}`}
                onClick={() => setRenderMode(m)}
              >
                {m}
              </button>
            ))}
          </div>

          <div className={styles.toolSep} />

          <div className={styles.toolGroup}>
            <span className={styles.scaleLabel}>SCALE</span>
            {SCALES.map((s) => (
              <button
                key={s}
                className={`${styles.btn} ${scale === s ? styles.btnActive : ''}`}
                onClick={() => setScale(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
