import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScrollProgress } from '@lilypad/scroll';
import { AnimationGroup, easeSmoothstep } from '@lilypad/animation';
import * as THREE from 'three';

/**
 * Camera rig that interpolates camera position based on scroll progress.
 *
 * s01: Schematic view — camera steady, framing the exploded parts
 * a:   Camera moves horizontally (Section 1 → 2)
 * b:   Camera continues horizontally (Section 2 → 3)
 * c:   Camera continues horizontally (Section 3 → 4)
 * d:   Camera moves vertically down (Section 4 → 5)
 */

const segmentS01 = new AnimationGroup()
  .add('x', 0, 0)
  .add('y', 1, 0, easeSmoothstep)
  .add('z', 14, 8, easeSmoothstep);

const segmentA = new AnimationGroup()
  .add('x', 0, 4, easeSmoothstep)
  .add('y', 0, 0)
  .add('z', 8, 7, easeSmoothstep);

const segmentB = new AnimationGroup()
  .add('x', 4, 8, easeSmoothstep)
  .add('y', 0, -0.5, easeSmoothstep)
  .add('z', 7, 6.5, easeSmoothstep);

const segmentC = new AnimationGroup()
  .add('x', 8, 12, easeSmoothstep)
  .add('y', -0.5, -1, easeSmoothstep)
  .add('z', 6.5, 6, easeSmoothstep);

const segmentD = new AnimationGroup()
  .add('x', 12, 12)
  .add('y', -1, -8, easeSmoothstep)
  .add('z', 6, 5, easeSmoothstep);

export function CameraRig() {
  const { s01, a, b, c, d } = useScrollProgress();
  const target = useRef(new THREE.Vector3());

  useFrame(({ camera }) => {
    let pos: Record<string, number>;

    if (d > 0) {
      pos = segmentD.evaluate(d);
    } else if (c > 0) {
      pos = segmentC.evaluate(c);
    } else if (b > 0) {
      pos = segmentB.evaluate(b);
    } else if (a > 0) {
      pos = segmentA.evaluate(a);
    } else {
      pos = segmentS01.evaluate(s01);
    }

    target.current.set(pos.x, pos.y, pos.z);
    camera.position.lerp(target.current, 0.12);
    camera.lookAt(pos.x, pos.y, 0);
  });

  return null;
}
