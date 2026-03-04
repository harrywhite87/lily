import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Sample `count` points uniformly distributed across the surface of a geometry.
 * Writes xyz triplets into the provided `target` Float32Array.
 */
export function sampleSurfacePoints(
  geom: THREE.BufferGeometry,
  count: number,
  target: Float32Array,
): void {
  const mesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial());
  const sampler = new MeshSurfaceSampler(mesh).build();
  const v = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    sampler.sample(v);
    const i3 = i * 3;
    target[i3 + 0] = v.x;
    target[i3 + 1] = v.y;
    target[i3 + 2] = v.z;
  }

  mesh.geometry.dispose();
  (mesh.material as THREE.Material).dispose();
}

/**
 * Extract and merge all mesh geometries from a Three.js Object3D scene graph.
 * Applies world transforms so merged geometry is in world space.
 * Returns `null` if no meshes are found.
 */
export function extractGeometry(
  object: THREE.Object3D,
): THREE.BufferGeometry | null {
  const geometries: THREE.BufferGeometry[] = [];

  object.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const geo = child.geometry.clone();
      child.updateWorldMatrix(true, false);
      geo.applyMatrix4(child.matrixWorld);
      geometries.push(geo);
    }
  });

  if (geometries.length === 0) return null;
  if (geometries.length === 1) return geometries[0];

  // Strip to position-only for merge compatibility
  const posOnly = geometries.map((g) => {
    const stripped = new THREE.BufferGeometry();
    stripped.setAttribute('position', g.getAttribute('position'));
    if (g.index) stripped.setIndex(g.index);
    return stripped;
  });

  const merged = mergeGeometries(posOnly, false);

  geometries.forEach((g) => g.dispose());
  posOnly.forEach((g) => g.dispose());

  return merged;
}

/**
 * Normalize a geometry to fit within a unit sphere centered at origin.
 * Computes bounding sphere, translates center to origin, and scales to `radius`.
 */
export function normalizeGeometry(
  geom: THREE.BufferGeometry,
  radius = 1.5,
): THREE.BufferGeometry {
  geom.computeBoundingSphere();
  const s = geom.boundingSphere!;
  const scale = radius / Math.max(s.radius, 0.001);
  geom.translate(-s.center.x, -s.center.y, -s.center.z);
  geom.scale(scale, scale, scale);
  return geom;
}
