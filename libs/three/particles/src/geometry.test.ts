import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { sampleSurfacePoints, extractGeometry, normalizeGeometry } from './geometry';

describe('sampleSurfacePoints', () => {
  it('fills the target array with the correct number of xyz triplets', () => {
    const geom = new THREE.SphereGeometry(1, 8, 8);
    const count = 100;
    const target = new Float32Array(count * 3);

    sampleSurfacePoints(geom, count, target);

    // Every triplet should be a finite number (not NaN, not Inf)
    for (let i = 0; i < count * 3; i++) {
      expect(Number.isFinite(target[i])).toBe(true);
    }

    // Points should be on/near the surface of a unit sphere
    let anyNonZero = false;
    for (let i = 0; i < count; i++) {
      const x = target[i * 3];
      const y = target[i * 3 + 1];
      const z = target[i * 3 + 2];
      const dist = Math.sqrt(x * x + y * y + z * z);
      // Should be approximately 1.0 (radius of sphere)
      expect(dist).toBeGreaterThan(0.5);
      expect(dist).toBeLessThan(1.5);
      if (dist > 0) anyNonZero = true;
    }
    expect(anyNonZero).toBe(true);

    geom.dispose();
  });
});

describe('extractGeometry', () => {
  it('returns null for an object with no meshes', () => {
    const group = new THREE.Group();
    expect(extractGeometry(group)).toBeNull();
  });

  it('extracts and merges geometry from a scene with multiple meshes', () => {
    const group = new THREE.Group();
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial(),
    );
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 8),
      new THREE.MeshBasicMaterial(),
    );
    sphere.position.set(3, 0, 0);
    group.add(box);
    group.add(sphere);

    const result = extractGeometry(group);
    expect(result).not.toBeNull();

    const posAttr = result!.getAttribute('position');
    expect(posAttr).toBeTruthy();

    // Merged geometry should have vertices from both meshes
    const boxVertCount = box.geometry.getAttribute('position').count;
    const sphereVertCount = sphere.geometry.getAttribute('position').count;
    expect(posAttr.count).toBeGreaterThanOrEqual(boxVertCount + sphereVertCount);

    result!.dispose();
    box.geometry.dispose();
    sphere.geometry.dispose();
  });
});

describe('normalizeGeometry', () => {
  it('centers and scales geometry to the target radius', () => {
    const geom = new THREE.BoxGeometry(2, 2, 2);
    geom.translate(10, 10, 10); // Offset far from origin

    normalizeGeometry(geom, 1.0);

    geom.computeBoundingSphere();
    const s = geom.boundingSphere!;

    // Center should be near origin
    expect(Math.abs(s.center.x)).toBeLessThan(0.1);
    expect(Math.abs(s.center.y)).toBeLessThan(0.1);
    expect(Math.abs(s.center.z)).toBeLessThan(0.1);

    // Radius should be approximately 1.0
    expect(s.radius).toBeGreaterThan(0.8);
    expect(s.radius).toBeLessThan(1.2);

    geom.dispose();
  });
});
