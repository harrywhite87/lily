import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/* ────────────────────────────────────────────── */
/*  Types                                         */
/* ────────────────────────────────────────────── */

export interface ModelMetrics {
  totalMeshes: number;
  activeMeshes: number;
  activeIndices: number;
  activeFaces: number;
  activeBones: number;
  activeParticles: number;
  drawCalls: number;
  totalLights: number;
  totalVertices: number;
  totalMaterials: number;
  totalTextures: number;
}

export const EMPTY_METRICS: ModelMetrics = {
  totalMeshes: 0,
  activeMeshes: 0,
  activeIndices: 0,
  activeFaces: 0,
  activeBones: 0,
  activeParticles: 0,
  drawCalls: 0,
  totalLights: 0,
  totalVertices: 0,
  totalMaterials: 0,
  totalTextures: 0,
};

/* ────────────────────────────────────────────── */
/*  Utilities                                     */
/* ────────────────────────────────────────────── */

/** Deep-inspects a Three.js scene graph and returns comprehensive metrics. */
export function countModelMetrics(obj: THREE.Object3D): ModelMetrics {
  let totalMeshes = 0;
  let activeMeshes = 0;
  let activeIndices = 0;
  let activeFaces = 0;
  let activeBones = 0;
  let activeParticles = 0;
  let drawCalls = 0;
  let totalLights = 0;
  let totalVertices = 0;

  const materials = new Set<string>();
  const textures = new Set<string>();

  const collectTextures = (mat: THREE.Material) => {
    // Walk known texture slots on common material types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = mat as any;
    const slots = [
      'map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap',
      'emissiveMap', 'bumpMap', 'displacementMap', 'alphaMap',
      'envMap', 'lightMap', 'specularMap',
    ];
    for (const slot of slots) {
      const tex = m[slot];
      if (tex instanceof THREE.Texture) {
        textures.add(tex.uuid);
      }
    }
  };

  obj.traverse((child) => {
    // ── Meshes ──
    if (child instanceof THREE.Mesh && child.geometry) {
      totalMeshes++;
      if (child.visible) activeMeshes++;

      const geo = child.geometry;
      const pos = geo.attributes.position;

      if (pos) totalVertices += pos.count;

      if (geo.index) {
        activeIndices += geo.index.count;
        activeFaces += geo.index.count / 3;
      } else if (pos) {
        activeFaces += pos.count / 3;
      }

      // Draw calls: one per geometry group, or 1 if no groups
      drawCalls += geo.groups.length > 0 ? geo.groups.length : 1;

      // Materials
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const mat of mats) {
        if (mat) {
          materials.add(mat.uuid);
          collectTextures(mat);
        }
      }
    }

    // ── Skinned meshes (bones) ──
    if (child instanceof THREE.SkinnedMesh && child.skeleton) {
      activeBones += child.skeleton.bones.length;
    }

    // ── Points / Particles ──
    if (child instanceof THREE.Points && child.geometry) {
      const pos = child.geometry.attributes.position;
      if (pos) activeParticles += pos.count;
    }

    // ── Lights ──
    if (child instanceof THREE.Light) {
      totalLights++;
    }
  });

  return {
    totalMeshes,
    activeMeshes,
    activeIndices,
    activeFaces,
    activeBones,
    activeParticles,
    drawCalls,
    totalLights,
    totalVertices,
    totalMaterials: materials.size,
    totalTextures: textures.size,
  };
}

/* ────────────────────────────────────────────── */
/*  ModelPreview component                        */
/* ────────────────────────────────────────────── */

export function ModelPreview({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  const cloned = useMemo(() => scene.clone(), [scene]);

  return <primitive object={cloned} />;
}
