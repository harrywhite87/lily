/// <reference types="vite/client" />
import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useScrollProgress } from '@lilypad/scroll';
import { Animation, easeSmoothstep, easeSineInOut } from '@lilypad/animation';
import { useDebugControls, useObjectInspectorSurface } from '@lilypad/debug';
import type { FolderControl, ObjectInspectorSurface } from '@lilypad/debug';
import { useModel } from '@lilypad/three-model-runtime';
import * as THREE from 'three';

/** Node names as they appear in the GLB (underscores, not spaces). */
const PART_NAMES = [
  'Submarine_Section_1',
  'Submarine_Section_2',
  'Submarine_Section_3',
  'Submarine_Section_4',
] as const;

const SECTION_COUNT = PART_NAMES.length;

/** Pose definition for a single submarine part. */
interface PartPose {
  position: [number, number, number];
  rotation: [number, number, number];
}

/**
 * Schematic (exploded) offsets — parts spread horizontally along X axis
 * with slight Y rotations for visual interest.
 */
const schematicOffsets: PartPose[] = [
  { position: [-3.0, 0, 0], rotation: [0, Math.PI * 0.12, 0] },
  { position: [-1.0, 0, 0], rotation: [0, -Math.PI * 0.08, 0] },
  { position: [1.0, 0, 0], rotation: [0, Math.PI * 0.08, 0] },
  { position: [3.0, 0, 0], rotation: [0, -Math.PI * 0.12, 0] },
];

/** Assembled offsets — zero displacement, no rotation. */
const assembledOffsets: PartPose[] = [
  { position: [0, 0, 0], rotation: [0, 0, 0] },
  { position: [0, 0, 0], rotation: [0, 0, 0] },
  { position: [0, 0, 0], rotation: [0, 0, 0] },
  { position: [0, 0, 0], rotation: [0, 0, 0] },
];

/** Build per-axis animation for one part: schematic offset → assembled (zero). */
function buildPartAnimations(index: number) {
  const from = schematicOffsets[index];
  const to = assembledOffsets[index];
  return {
    posX: new Animation(from.position[0], to.position[0], easeSmoothstep),
    posY: new Animation(from.position[1], to.position[1], easeSmoothstep),
    posZ: new Animation(from.position[2], to.position[2], easeSmoothstep),
    rotX: new Animation(from.rotation[0], to.rotation[0], easeSineInOut),
    rotY: new Animation(from.rotation[1], to.rotation[1], easeSineInOut),
    rotZ: new Animation(from.rotation[2], to.rotation[2], easeSineInOut),
  };
}

/** Post-assembly animations for the whole group (segments a–d). */
const postAssemblyAnims = {
  posX: new Animation(0, 12, easeSmoothstep),
  posY: new Animation(0.5, -2, easeSmoothstep),
  posZ: new Animation(0, -1, easeSineInOut),
  rotY: new Animation(0, -Math.PI * 0.15, easeSmoothstep),
  rotX: new Animation(0, Math.PI * 0.1, easeSmoothstep),
  scale: new Animation(3.2, 3.6, easeSineInOut),
};

/** Intro approach: keep heading mostly straight at the camera before lateral drift starts. */
const introApproachAnims = {
  posZ: new Animation(-3.2, 0.0, easeSmoothstep),
};

/**
 * Split a BufferGeometry into N sections along the X axis.
 * Triangles are assigned based on centroid X position.
 */
function splitGeometryByX(
  geometry: THREE.BufferGeometry,
  sectionCount: number,
): THREE.BufferGeometry[] {
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox!;
  const xMin = bb.min.x;
  const xMax = bb.max.x;
  const sliceWidth = (xMax - xMin) / sectionCount;

  const pos = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const uv = geometry.attributes.uv;
  const indexAttr = geometry.index;

  const buckets: { positions: number[]; normals: number[]; uvs: number[] }[] = [];
  for (let i = 0; i < sectionCount; i++) {
    buckets.push({ positions: [], normals: [], uvs: [] });
  }

  const triCount = indexAttr ? indexAttr.count / 3 : pos.count / 3;

  for (let tri = 0; tri < triCount; tri++) {
    const i0 = indexAttr ? indexAttr.getX(tri * 3) : tri * 3;
    const i1 = indexAttr ? indexAttr.getX(tri * 3 + 1) : tri * 3 + 1;
    const i2 = indexAttr ? indexAttr.getX(tri * 3 + 2) : tri * 3 + 2;

    const cx = (pos.getX(i0) + pos.getX(i1) + pos.getX(i2)) / 3;
    let sIdx = Math.floor((cx - xMin) / sliceWidth);
    sIdx = Math.max(0, Math.min(sectionCount - 1, sIdx));

    const bucket = buckets[sIdx];
    for (const vi of [i0, i1, i2]) {
      bucket.positions.push(pos.getX(vi), pos.getY(vi), pos.getZ(vi));
      if (normal) bucket.normals.push(normal.getX(vi), normal.getY(vi), normal.getZ(vi));
      if (uv) bucket.uvs.push(uv.getX(vi), uv.getY(vi));
    }
  }

  return buckets.map((b) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(b.positions, 3));
    if (b.normals.length) geo.setAttribute('normal', new THREE.Float32BufferAttribute(b.normals, 3));
    if (b.uvs.length) geo.setAttribute('uv', new THREE.Float32BufferAttribute(b.uvs, 2));
    geo.computeBoundingSphere();
    return geo;
  });
}

/** Runtime part data: the group node, its base centroid position. */
interface PartData {
  group: THREE.Group;
  centroid: THREE.Vector3;
}

export function Submarine() {
  const { modelUrl } = useModel();
  const { scene } = useGLTF(modelUrl);
  const groupRef = useRef<THREE.Group>(null!);
  const partsRef = useRef<PartData[]>([]);
  const [debug, setDebug] = useState(false);
  const axisHelpersRef = useRef<THREE.Object3D[]>([]);
  const introPreviewPlayingRef = useRef(false);

  const { s01, a, b, c, d, progress } = useScrollProgress();

  const [introControls, setIntroControls] = useDebugControls(
    'Submarine Intro',
    () => ({
      Motion: {
        type: 'folder' as const,
        title: 'Motion',
        controls: {
          introAngleDeg: { value: 0, min: -60, max: 60, step: 0.5, label: 'Angle' },
          previewOverride: { value: false, label: 'Override' },
          previewProgress: { value: 0, min: 0, max: 1, step: 0.001, label: 'Progress' },
          previewSpeed: { value: 0.25, min: 0.05, max: 1.5, step: 0.01, label: 'Speed' },
        },
      } satisfies FolderControl,
    }),
    [],
  );

  const introControlsRef = useRef(introControls);

  useEffect(() => {
    introControlsRef.current = introControls;
  }, [introControls]);

  const startIntroPreview = useCallback(() => {
    introPreviewPlayingRef.current = true;
    setIntroControls({ previewOverride: true });
  }, [setIntroControls]);

  const stopIntroPreview = useCallback(() => {
    introPreviewPlayingRef.current = false;
  }, []);

  const resetIntroPreview = useCallback(() => {
    introPreviewPlayingRef.current = false;
    setIntroControls({ previewOverride: true, previewProgress: 0, introAngleDeg: 0 });
  }, [setIntroControls]);

  useDebugControls('Submarine Intro Actions', {
    Start: {
      type: 'button',
      label: 'Start',
      onClick: startIntroPreview,
    },
    Stop: {
      type: 'button',
      label: 'Stop',
      onClick: stopIntroPreview,
    },
    Reset: {
      type: 'button',
      label: 'Reset',
      onClick: resetIntroPreview,
    },
  });

  const introInspectorSurface = useMemo<ObjectInspectorSurface>(
    () => ({
      title: 'Submarine Intro',
      fields: [
        {
          kind: 'number',
          key: 'introAngleDeg',
          label: 'Angle',
          min: -60,
          max: 60,
          step: 0.5,
          get: () => Number(introControlsRef.current.introAngleDeg ?? 0),
          set: (value: number) => setIntroControls({ introAngleDeg: value }),
        },
        {
          kind: 'boolean',
          key: 'previewOverride',
          label: 'Override',
          get: () => Boolean(introControlsRef.current.previewOverride),
          set: (value: boolean) => setIntroControls({ previewOverride: value }),
        },
        {
          kind: 'number',
          key: 'previewProgress',
          label: 'Progress',
          min: 0,
          max: 1,
          step: 0.001,
          get: () => Number(introControlsRef.current.previewProgress ?? 0),
          set: (value: number) =>
            setIntroControls({ previewProgress: THREE.MathUtils.clamp(value, 0, 1) }),
        },
        {
          kind: 'number',
          key: 'previewSpeed',
          label: 'Speed',
          min: 0.05,
          max: 1.5,
          step: 0.01,
          get: () => Number(introControlsRef.current.previewSpeed ?? 0.25),
          set: (value: number) => setIntroControls({ previewSpeed: value }),
        },
        {
          kind: 'button',
          key: 'start',
          label: 'Start',
          onClick: startIntroPreview,
        },
        {
          kind: 'button',
          key: 'stop',
          label: 'Stop',
          onClick: stopIntroPreview,
        },
        {
          kind: 'button',
          key: 'reset',
          label: 'Reset',
          onClick: resetIntroPreview,
        },
      ],
    }),
    [setIntroControls, startIntroPreview, stopIntroPreview, resetIntroPreview],
  );

  useObjectInspectorSurface(groupRef, introInspectorSurface);

  // Toggle debug mode with 'D' key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        setDebug((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const partAnimations = useMemo(
    () => Array.from({ length: SECTION_COUNT }, (_, i) => buildPartAnimations(i)),
    [],
  );

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    // Clear previous
    while (group.children.length > 0) group.remove(group.children[0]);
    partsRef.current = [];

    // Dump full scene graph for diagnostics
    console.log('[Submarine] Scene graph dump:');
    scene.traverse((child) => {
      const depth = [];
      let p = child.parent;
      while (p) { depth.push('  '); p = p.parent; }
      console.log(
        `${depth.join('')}${child.type} "${child.name || '(unnamed)'}"` +
        (child instanceof THREE.Mesh ? ` [Mesh, geo=${child.geometry?.attributes?.position?.count} verts]` : ''),
      );
    });

    // ── Strategy 1: Search the ORIGINAL scene for named nodes, then clone each ──
    const namedParts: THREE.Object3D[] = [];
    for (const name of PART_NAMES) {
      const node = scene.getObjectByName(name);
      if (node) {
        namedParts.push(node);
        console.log(`[Submarine] Found node "${name}" (type: ${node.type})`);
      } else {
        console.warn(`[Submarine] Node "${name}" not found.`);
      }
    }

    if (namedParts.length === SECTION_COUNT) {
      console.log('[Submarine] Using named GLB nodes for sections.');
      for (let i = 0; i < SECTION_COUNT; i++) {
        const originalNode = namedParts[i];
        const node = originalNode.clone();

        const partGroup = new THREE.Group();

        // Compute this node's world-space centroid for pivot
        const box = new THREE.Box3().setFromObject(node);
        const centroid = new THREE.Vector3();
        box.getCenter(centroid);

        console.log(`[Submarine] Section ${i + 1}: centroid=(${centroid.x.toFixed(3)}, ${centroid.y.toFixed(3)}, ${centroid.z.toFixed(3)})`);

        // Re-center the node geometry so rotation pivots around its centroid
        node.position.sub(centroid);
        partGroup.position.copy(centroid);
        partGroup.add(node);
        group.add(partGroup);

        partsRef.current.push({ group: partGroup, centroid: centroid.clone() });
      }
    } else {
      // ── Strategy 2: Fallback — split first mesh geometry by X axis ──
      console.log('[Submarine] Falling back to geometry splitting.');
      const cloned = scene.clone();
      let sourceMesh: THREE.Mesh | null = null;
      cloned.traverse((child) => {
        if (!sourceMesh && child instanceof THREE.Mesh) sourceMesh = child;
      });

      if (!sourceMesh) {
        console.warn('[Submarine] No mesh found in GLB.');
        return;
      }

      const mesh = sourceMesh as THREE.Mesh;
      const material = mesh.material;
      const sectionGeos = splitGeometryByX(mesh.geometry, SECTION_COUNT);

      for (let i = 0; i < SECTION_COUNT; i++) {
        const geo = sectionGeos[i];
        geo.computeBoundingBox();
        const centroid = new THREE.Vector3();
        geo.boundingBox!.getCenter(centroid);

        geo.translate(-centroid.x, -centroid.y, -centroid.z);

        const partGroup = new THREE.Group();
        partGroup.position.copy(centroid);

        const partMesh = new THREE.Mesh(geo, material);
        partGroup.add(partMesh);
        group.add(partGroup);

        partsRef.current.push({ group: partGroup, centroid: centroid.clone() });
      }
    }

    console.log(`[Submarine] ${partsRef.current.length} sections ready.`);
  }, [scene]);

  // ── Debug: add/remove axis helpers ──
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    // Remove old helpers
    for (const h of axisHelpersRef.current) {
      h.parent?.remove(h);
    }
    axisHelpersRef.current = [];

    if (debug) {
      console.log('[Debug] Axis helpers ON — R=X, G=Y, B=Z');
      // World-origin axes on root group
      const rootAxes = new THREE.AxesHelper(5);
      group.add(rootAxes);
      axisHelpersRef.current.push(rootAxes);

      // Grid on XZ plane
      const grid = new THREE.GridHelper(10, 20, 0x2ec4b6, 0x1a3a5c);
      group.add(grid);
      axisHelpersRef.current.push(grid);

      // Per-part axes
      for (let i = 0; i < partsRef.current.length; i++) {
        const part = partsRef.current[i];
        const partAxes = new THREE.AxesHelper(2);
        part.group.add(partAxes);
        axisHelpersRef.current.push(partAxes);

        console.log(
          `[Debug] Part ${i}: pos=(${part.group.position.x.toFixed(2)}, ${part.group.position.y.toFixed(2)}, ${part.group.position.z.toFixed(2)})` +
          ` rot=(${THREE.MathUtils.radToDeg(part.group.rotation.x).toFixed(1)}°, ${THREE.MathUtils.radToDeg(part.group.rotation.y).toFixed(1)}°, ${THREE.MathUtils.radToDeg(part.group.rotation.z).toFixed(1)}°)`,
        );
      }
    } else {
      console.log('[Debug] Axis helpers OFF');
    }
  }, [debug]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const g = groupRef.current;
    const parts = partsRef.current;
    const previewOverride = Boolean(introControls.previewOverride);
    const previewSpeed = Number(introControls.previewSpeed ?? 0.25);
    const currentPreviewProgress = THREE.MathUtils.clamp(
      Number(introControls.previewProgress ?? 0),
      0,
      1,
    );
    let introProgress = s01;

    if (previewOverride) {
      if (introPreviewPlayingRef.current) {
        const nextPreviewProgress = THREE.MathUtils.clamp(
          currentPreviewProgress + delta * previewSpeed,
          0,
          1,
        );
        if (Math.abs(nextPreviewProgress - currentPreviewProgress) > 1e-5) {
          setIntroControls({ previewProgress: nextPreviewProgress });
        }
        if (nextPreviewProgress >= 1) {
          introPreviewPlayingRef.current = false;
        }
        introProgress = nextPreviewProgress;
      } else {
        introProgress = currentPreviewProgress;
      }
    } else if (introPreviewPlayingRef.current) {
      introPreviewPlayingRef.current = false;
    }

    const introAngleRad = THREE.MathUtils.degToRad(Number(introControls.introAngleDeg ?? 0));
    const introAngleInfluence = 1.0 - THREE.MathUtils.smoothstep(progress, 0.2, 0.55);

    // Phase 1: Assembly (s01 segment)
    // Each part: position = baseCentroid + interpolatedOffset, rotation = interpolated
    for (let i = 0; i < parts.length; i++) {
      const { group: partGroup, centroid } = parts[i];
      const anims = partAnimations[i];

      partGroup.position.set(
        centroid.x + anims.posX.evaluate(introProgress),
        centroid.y + anims.posY.evaluate(introProgress),
        centroid.z + anims.posZ.evaluate(introProgress),
      );

      partGroup.rotation.set(
        anims.rotX.evaluate(introProgress),
        anims.rotY.evaluate(introProgress),
        anims.rotZ.evaluate(introProgress),
      );
    }

    // Phase 2: Post-assembly whole-group movement (segments a-d)
    const hProgress = Math.min(a + b + c, 3) / 3;
    const lateralProgress = THREE.MathUtils.clamp((hProgress - 0.18) / 0.82, 0, 1);
    g.position.x = postAssemblyAnims.posX.evaluate(lateralProgress);
    g.rotation.y = postAssemblyAnims.rotY.evaluate(lateralProgress) + introAngleRad * introAngleInfluence;
    g.position.y = postAssemblyAnims.posY.evaluate(progress);
    g.rotation.x = postAssemblyAnims.rotX.evaluate(d);

    const introZ = introApproachAnims.posZ.evaluate(introProgress);
    const cruiseZ = postAssemblyAnims.posZ.evaluate(progress);
    const zBlend = THREE.MathUtils.smoothstep(progress, 0.2, 0.35);
    g.position.z = THREE.MathUtils.lerp(introZ, cruiseZ, zBlend);

    const s = postAssemblyAnims.scale.evaluate(progress);
    g.scale.setScalar(s);
  });

  return <group ref={groupRef} name="Submarine Root" />;
}

useGLTF.preload(`${import.meta.env.BASE_URL}submarine.glb`);
